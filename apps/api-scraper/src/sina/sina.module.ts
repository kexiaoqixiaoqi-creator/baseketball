import { Module } from '@nestjs/common';
import { SinaClientService } from './sina.client.service';

@Module({
  providers: [SinaClientService],
  exports: [SinaClientService],
})
export class SinaModule {}
