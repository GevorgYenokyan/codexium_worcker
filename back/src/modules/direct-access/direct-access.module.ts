import { Module } from '@nestjs/common';
import { DirectAccessController } from './direct-access.controller';
import { DirectAccessService } from './direct-access.service';
import { ReconModule } from 'src/modules/recon/recon.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [ReconModule, AuthModule], // for domain ownership + IP association check
  controllers: [DirectAccessController],
  providers: [DirectAccessService],
  exports: [DirectAccessService],
})
export class DirectAccessModule {}
