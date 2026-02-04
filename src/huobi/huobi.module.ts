import { Module } from '@nestjs/common';
import { HuobiService } from './huobi.service';
import { HuobiController } from './huobi.controller';

@Module({
  providers: [HuobiService],
  controllers: [HuobiController],
})
export class HuobiModule {}
