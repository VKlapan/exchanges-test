import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { KucoinService } from './kucoin.service';
import { KucoinController } from './kucoin.controller';

@Module({
  imports: [ConfigModule],
  providers: [KucoinService],
  controllers: [KucoinController],
})
export class KucoinModule {}
