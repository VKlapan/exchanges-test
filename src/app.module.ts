import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HuobiModule } from './huobi/huobi.module';
import { KucoinModule } from './kucoin/kucoin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HuobiModule,
    KucoinModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
