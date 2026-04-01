import { Module } from '@nestjs/common';
import { DirectAccessController } from './direct-access.controller';
import { DirectAccessService } from './direct-access.service';
import { ReconModule } from 'src/modules/recon/recon.module';
import { AuthModule } from 'src/auth/auth.module';
import { HttpProbeService } from './sub-services/http-probe.service';
import { AttackTestsService } from './sub-services/attack-tests.service';
import { FilePathScanService } from './sub-services/file-path-scan.service';
import { BannerService } from './sub-services/banner.service';
import { ResultBuilderService } from './sub-services/result-builder.service';

@Module({
  imports: [ReconModule, AuthModule], // for domain ownership + IP association check
  controllers: [DirectAccessController],
  providers: [
    DirectAccessService,
    HttpProbeService,
    AttackTestsService,
    FilePathScanService,
    BannerService,
    ResultBuilderService,
  ],
  exports: [DirectAccessService],
})
export class DirectAccessModule {}
