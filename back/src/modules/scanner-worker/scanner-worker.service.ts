import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import axios, { AxiosInstance } from 'axios';
import { ReconService }       from '../recon/recon.service';
import { DirectAccessService } from '../direct-access/direct-access.service';

type TaskType = 'recon' | 'port_scan' | 'direct_access';

interface Task {
  id:      number;
  type:    TaskType;
  payload: string;
}

@Injectable()
export class ScannerWorkerService implements OnModuleInit {
  private readonly logger = new Logger(ScannerWorkerService.name);
  private readonly api:    AxiosInstance;
  private activeJobs = 0;
  private readonly CONCURRENCY: number;

  constructor(
    private readonly config:        ConfigService,
    private readonly reconService:  ReconService,
    private readonly directService: DirectAccessService,
  ) {
    this.CONCURRENCY = parseInt(this.config.get('CONCURRENCY') ?? '3', 10);

    this.api = axios.create({
      baseURL: this.config.getOrThrow('SERVER_A_URL'),
      timeout: 120_000,
      headers: {
        'x-scanner-secret': this.config.getOrThrow('SCANNER_SECRET'),
        'x-worker-id':      this.config.get('WORKER_ID') ?? 'server-b',
        'Content-Type':     'application/json',
      },
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.api.get('/api/tasks/ping');
      this.logger.log(`✓ Connected to Server A: ${this.config.get('SERVER_A_URL')}`);
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
        types:     ['recon', 'port_scan', 'direct_access'],
      });

      const tasks: Task[] = data.tasks ?? [];
      if (!tasks.length) return;

      this.logger.log(`Pulled ${tasks.length} task(s)`);
      this.activeJobs += tasks.length;

      await Promise.allSettled(
        tasks.map((t) => this.run(t).finally(() => { this.activeJobs--; })),
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
      const result = await this.dispatch(task.type, payload);
      await this.report(task.id, result, null);
      this.logger.log(`✓ Task #${task.id} done`);
    } catch (err: any) {
      await this.report(task.id, null, err?.message ?? 'Unknown error');
      this.logger.error(`✗ Task #${task.id}: ${err?.message}`);
    }
  }

  private dispatch(type: TaskType, payload: any): Promise<any> {
    switch (type) {
      case 'recon':
        return this.reconService.scanFromPayload(
          payload.domain,
          payload.portFrom  ?? 1,
          payload.portTo    ?? 1024,
          payload.knownRealIps ?? [],
        );
      case 'port_scan':
        return this.reconService.scanIpDirect(
          payload.ip,
          payload.domain,
          payload.portFrom ?? 1,
          payload.portTo   ?? 1024,
        );
      case 'direct_access':
        return this.directService.test(payload.ip, payload.domain);
      default:
        return Promise.reject(new Error(`Unknown task type: ${type}`));
    }
  }

  private async report(taskId: number, result: any, error: string | null): Promise<void> {
    try {
      await this.api.post('/api/tasks/complete', { taskId, result, error });
    } catch (err: any) {
      this.logger.error(`Failed to report task #${taskId}: ${err.message}`);
    }
  }
}