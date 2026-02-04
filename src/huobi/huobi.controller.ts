import { Controller, Get } from '@nestjs/common';
import { HuobiService } from './huobi.service';

@Controller('huobi')
export class HuobiController {
  constructor(private readonly huobiService: HuobiService) {}

  @Get('signed')
  getSigned() {
    const out = this.huobiService.generateSignatureAndRequest(
      'GET',
      'api.huobi.pro',
      '/market/detail/merged',
      { symbol: 'btcusdt' },
    );

    return out;
  }

  @Get('market')
  getMarket() {
    const out = this.huobiService.requestSigned(
      'GET',
      'api.huobi.pro',
      '/market/detail/merged',
      { symbol: 'btcusdt' },
    );

    return out;
  }
}
