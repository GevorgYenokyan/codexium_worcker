import { Module } from '@nestjs/common';
import { MailController } from './mail.controller';
import { MaileService } from './mail.service';

@Module({
  controllers: [MailController],
  providers: [MaileService],
  imports: [],
  exports: [MaileService],
})
export class MailModule {}
