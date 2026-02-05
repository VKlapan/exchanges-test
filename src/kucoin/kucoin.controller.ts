import { Controller, Get } from '@nestjs/common';
import { KucoinService } from './kucoin.service';

@Controller('kucoin')
export class KucoinController {
  constructor(private readonly kucoinService: KucoinService) {}

  @Get('broker-info')
  getSigned() {
    return this.kucoinService.requestBrokerInfo({
      //host: 'api.kucoin.com',
      //path: '/api/v1/orders',

      host: 'api-broker.kucoin.com',
      path: '/api/v1/broker/nd/info',

      keyVersion: '2',
      //body: {"symbol":"BTC-USDT","side":"buy","size":"0.0001","price":"30000","type":"limit","clientOid":"2b802154-8d31-42e6-88ea-c8c18d3e4822","tradeType":"TRADE"} as Record<string, any>,
    });
  }

  @Get('accounts')
  requestPrivate() {
    return this.kucoinService.requestAccounts({
      method: 'GET',
      endpoint: '/api/v1/accounts',
      keyVersion: '3',
      host: 'api.kucoin.com',
    });
  }

  @Get('currencies')
  getCurrencies() {
    return this.kucoinService.getCurrenciesWithChains();
  }
}
