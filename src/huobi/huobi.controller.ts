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

  @Get('market-depth')
  getMarketDepth() {
    const out = this.huobiService.requestSigned(
      'GET',
      'api.huobi.pro',
      '/market/depth',
      { symbol: 'btcusdt', type: 'step0' },
    );

    return out;
  }

  @Get('tickets')
  getTickets() {
    const out = this.huobiService.requestSigned(
      'GET',
      'api.huobi.pro',
      '/market/tickers',
      {},
    );

    return out;
  }

  @Get('symbols-settings')
  getSymbolsSettings() {
    const out = this.huobiService.requestSigned(
      'GET',
      'api.huobi.pro',
      '/v1/common/symbols',
      { currency: 'usdt' },
    );

    return out;
  }

  @Get('chains-settings')
  getChainsSettings() {
    const out = this.huobiService.requestPublic(
      'GET',
      'api.huobi.pro',
      '/v2/reference/currencies',
      {},
    );

    return out;
  }
}
