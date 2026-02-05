import { Module } from '@nestjs/common';
import { HuobiService } from './huobi.service';
import { HuobiController } from './huobi.controller';
import { AppConfigModule } from '../config/config.module';

@Module({
  imports: [AppConfigModule],
  providers: [HuobiService],
  controllers: [HuobiController],
})
export class HuobiModule {}
