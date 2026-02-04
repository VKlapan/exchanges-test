import { Controller, Get } from '@nestjs/common';
import { KucoinService } from './kucoin.service';

@Controller('kucoin')
export class KucoinController {
  constructor(private readonly kucoinService: KucoinService) {}

  @Get('broker-info')
  getSigned() {
    return this.kucoinService.requestBrokerInfo({
      host: 'api-broker.kucoin.com',
      path: '/api/v1/broker/nd/info',
      keyVersion: '3',
    });
  }

  @Get('accounts')
  requestPrivate() {
    return this.kucoinService.requestAccounts({
      method: 'GET',
      endpoint: '/api/v1/accounts',
      keyVersion: '2',
      host: 'api.kucoin.com',
    });
  }
}
