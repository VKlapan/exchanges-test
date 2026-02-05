import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppConfigModule } from '../config/config.module';
import { HttpModule } from '@nestjs/axios';
import { KucoinService } from './kucoin.service';
import { KucoinController } from './kucoin.controller';

@Module({
  imports: [ConfigModule, AppConfigModule, HttpModule],
  providers: [KucoinService],
  controllers: [KucoinController],
})
export class KucoinModule {}
