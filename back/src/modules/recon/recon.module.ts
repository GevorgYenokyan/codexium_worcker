import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ReconController } from './recon.controller';
import { ReconService } from './recon.service';
import { CloudflareLeakService } from './cloudflare-leak.service';
import { VerifiedDomain } from './models/verified-domain.model';
import { PassiveDnsCache } from './models/passive-dns-cache.model';
import { ReconScan } from './models/recon-scan.model';
import { AuthModule } from 'src/auth/auth.module';
import { DnsCollectorService } from './sub-services/dns-collector.service';
import { PassiveDnsService } from './sub-services/passive-dns.service';
import { CertFaviconService } from './sub-services/cert-favicon.service';
import { HttpProbeService } from './sub-services/http-probe.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    SequelizeModule.forFeature([VerifiedDomain, ReconScan, PassiveDnsCache]),
    AuthModule,
    ConfigModule,
  ],
  controllers: [ReconController],
  providers: [
    ReconService,
    CloudflareLeakService,
    DnsCollectorService,
    PassiveDnsService,
    CertFaviconService,
    HttpProbeService,
  ],
  exports: [ReconService],
})
export class ReconModule {}
