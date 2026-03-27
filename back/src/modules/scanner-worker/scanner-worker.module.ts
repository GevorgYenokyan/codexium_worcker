import { Module } from '@nestjs/common';
import { ScannerWorkerService } from './scanner-worker.service';
import { ReconModule } from '../recon/recon.module';
import { DirectAccessModule } from '../direct-access/direct-access.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ReconModule, DirectAccessModule, ConfigModule],
  providers: [ScannerWorkerService],
})
export class ScannerWorkerModule {}
