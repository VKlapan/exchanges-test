import { Module } from '@nestjs/common';
import { HuobiService } from './huobi.service';
import { HuobiController } from './huobi.controller';
import { AppConfigModule } from '../config/config.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [AppConfigModule, HttpModule],
  providers: [HuobiService],
  controllers: [HuobiController],
})
export class HuobiModule {}
