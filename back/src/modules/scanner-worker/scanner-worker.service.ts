import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import axios, { AxiosInstance } from 'axios';
import { ReconService } from '../recon/recon.service';
import { DirectAccessService } from '../direct-access/direct-access.service';

type TaskType = 'recon' | 'port_scan';

interface Task {
  id: number;
  type: TaskType;
  payload: string;
}

@Injectable()
export class ScannerWorkerService implements OnModuleInit {
  private readonly logger = new Logger(ScannerWorkerService.name);
  private readonly api: AxiosInstance;
  private activeJobs = 0;
  private readonly CONCURRENCY: number;

  constructor(
    private readonly config: ConfigService,
    private readonly reconService: ReconService,
    private readonly directService: DirectAccessService,
  ) {
    this.CONCURRENCY = parseInt(this.config.get('CONCURRENCY') ?? '3', 10);

    this.api = axios.create({
      baseURL: this.config.getOrThrow('SERVER_A_URL'),
      timeout: 120_000,
      headers: {
        'x-scanner-secret': this.config.getOrThrow('SCANNER_SECRET'),
        'x-worker-id': this.config.get('WORKER_ID') ?? 'server-b',
        'Content-Type': 'application/json',
      },
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.api.get('/api/tasks/ping');
      this.logger.log(
        `✓ Connected to Server A: ${this.config.get('SERVER_A_URL')}`,
      );
      this.logger.log(`  Concurrency: ${this.CONCURRENCY} parallel tasks`);
    } catch (err: any) {
      this.logger.warn(`Server A unreachable on startup: ${err.message}`);
    }
  }

  @Cron('*/5 * * * * *')
  async pullAndExecute(): Promise<void> {
    const available = this.CONCURRENCY - this.activeJobs;
    if (available <= 0) return;

    try {
      const { data } = await this.api.post('/api/tasks/pull', {
        batchSize: available,
        types: ['recon', 'port_scan'],
      });

      const tasks: Task[] = data.tasks ?? [];
      if (!tasks.length) return;

      this.logger.log(`Pulled ${tasks.length} task(s)`);
      this.activeJobs += tasks.length;

      await Promise.allSettled(
        tasks.map((t) =>
          this.run(t).finally(() => {
            this.activeJobs--;
          }),
        ),
      );
    } catch (err: any) {
      if (err.response?.status === 401) {
        this.logger.error('Invalid SCANNER_SECRET — check .env');
      } else {
        this.logger.warn(`Pull error: ${err.message}`);
      }
    }
  }

  private async run(task: Task): Promise<void> {
    this.logger.log(`▶ Task #${task.id} [${task.type}]`);
    let payload: any;
    try {
      payload = JSON.parse(task.payload);
    } catch {
      await this.report(task.id, null, 'Invalid JSON payload');
      return;
    }

    try {
      const result = await this.dispatch(task.type, task.id, payload);
      await this.report(task.id, result, null);
      this.logger.log(`✓ Task #${task.id} done`);
    } catch (err: any) {
      await this.report(task.id, null, err?.message ?? 'Unknown error');
      this.logger.error(`✗ Task #${task.id}: ${err?.message}`);
    }
  }

  // ─── Dispatch ─────────────────────────────────────────────────────────────

  private dispatch(type: TaskType, taskId: number, payload: any): Promise<any> {
    switch (type) {
      case 'recon':
        return this.runRecon(taskId, payload);
      case 'port_scan':
        return this.reconService.scanIpDirect(
          payload.ip,
          payload.domain,
          payload.portFrom ?? 1,
          payload.portTo ?? 1024,
        );
      default:
        return Promise.reject(new Error(`Unknown task type: ${type}`));
    }
  }

  // ─── Recon + DirectAccess combined ───────────────────────────────────────
  // Прогресс репортится на Server A между этапами.
  // DirectAccess запускается автоматически после recon
  // если найдены реальные IP за CDN.

  private async runRecon(taskId: number, payload: any): Promise<any> {
    const { domain, portFrom = 1, portTo = 1024, knownRealIps = [] } = payload;

    await this.progress(taskId, 'wildcard_check');
    await this.sleep(100);

    await this.progress(taskId, 'cdn_leak');
    await this.sleep(200);

    await this.progress(taskId, 'ct_logs');
    await this.sleep(100);

    await this.progress(taskId, 'dns_bruteforce');

    // ── Основной скан ─────────────────────────────────────────────────────
    const reconResult = await this.reconService.scanFromPayload(
      domain,
      portFrom,
      portTo,
      knownRealIps,
    );

    await this.progress(taskId, 'port_scan');

    // ── Direct access test ────────────────────────────────────────────────
    // Запускаем только если нашли реальные IP за CDN.
    // slice(0, 3) — не более 3 IP чтобы не затягивать скан.
    let directAccess: any[] = [];

    if (reconResult.leakedRealIps.length > 0) {
      await this.progress(taskId, 'direct_access');
      this.logger.log(
        `Direct access test for ${reconResult.leakedRealIps.length} IP(s): ${reconResult.leakedRealIps.join(', ')}`,
      );

      // const settled = await Promise.allSettled(
      // reconResult.leakedRealIps
      //     .slice(0, 3)
      //     .map((ip: string) => this.directService.test(ip, domain)),
      // );

      const settled = await Promise.allSettled(
        reconResult.leakedRealIps.slice(0, 3).map((ip: string) => {
          const ipInfo = reconResult.ipMap.find((m: any) => m.address === ip);
          return this.directService.test(ip, domain, ipInfo?.openPorts ?? []);
        }),
      );

      for (const r of settled) {
        if (r.status === 'fulfilled') {
          directAccess.push(r.value);
        } else {
          this.logger.warn(`Direct access test failed: ${r.reason?.message}`);
        }
      }
    } else {
      this.logger.log(`No real IPs found — skipping direct access test`);
    }

    // ── Combined result ───────────────────────────────────────────────────
    return {
      ...reconResult,
      directAccess,
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async progress(taskId: number, step: string): Promise<void> {
    try {
      await this.api.post('/api/tasks/progress', { taskId, step });
      this.logger.debug(`Task #${taskId} → ${step}`);
    } catch (err: any) {
      // Прогресс не критичен — не роняем скан если Server A временно недоступен
      this.logger.warn(`Progress report failed for #${taskId}: ${err.message}`);
    }
  }

  private async report(
    taskId: number,
    result: any,
    error: string | null,
  ): Promise<void> {
    try {
      await this.api.post('/api/tasks/complete', { taskId, result, error });
    } catch (err: any) {
      this.logger.error(`Failed to report task #${taskId}: ${err.message}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
