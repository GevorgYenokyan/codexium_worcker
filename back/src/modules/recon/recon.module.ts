import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ReconController } from './recon.controller';
import { ReconService } from './recon.service';
import { CloudflareLeakService } from './cloudflare-leak.service';
import { VerifiedDomain } from './models/verified-domain.model';
import { PassiveDnsCache } from './models/passive-dns-cache.model';
import { ReconScan } from './models/recon-scan.model';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    SequelizeModule.forFeature([VerifiedDomain, ReconScan, PassiveDnsCache]),
    AuthModule,
  ],
  controllers: [ReconController],
  providers: [ReconService, CloudflareLeakService],
  exports: [ReconService],
})
export class ReconModule {}
