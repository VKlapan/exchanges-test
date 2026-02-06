import { Controller, Get, Query, Body } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { KucoinService } from './kucoin.service';

@Controller('kucoin')
export class KucoinController {
  constructor(private readonly kucoinService: KucoinService) {}

  @Get('broker-info')
  @GrpcMethod('KucoinService', 'GetBrokerInfo')
  async getBrokerInfo(payload?: any, @Query() query?: any, @Body() body?: any) {
    const src = payload && Object.keys(payload).length ? payload : query || {};
    const { host, path, keyVersion } = src || {};
    const reqBody = (payload && payload.body) ?? body ?? null;

    return this.kucoinService.requestBrokerInfo({
      host: host || 'api-broker.kucoin.com',
      path: path || '/api/v1/broker/nd/info',
      keyVersion: keyVersion || '2',
      body: reqBody,
    });
  }

  @Get('accounts')
  @GrpcMethod('KucoinService', 'GetAccounts')
  async getAccounts(payload?: any, @Query() query?: any, @Body() body?: any) {
    const src = payload && Object.keys(payload).length ? payload : query || {};
    const method = src.method || 'GET';
    const endpoint = src.endpoint || '/api/v1/accounts';
    const keyVersion = src.keyVersion;
    const host = src.host || 'api.kucoin.com';
    const siteType = src.siteType;
    const reqBody = (payload && payload.body) ?? body ?? null;

    const res = await this.kucoinService.requestAccounts({
      method,
      endpoint,
      body: reqBody,
      keyVersion,
      host,
      siteType,
    });

    return res;
  }

  @Get('currencies')
  @GrpcMethod('KucoinService', 'GetCurrencies')
  async getCurrencies(payload?: any, @Query() query?: any, @Body() body?: any) {
    const src = payload && Object.keys(payload).length ? payload : query || {};
    const timeoutMs: number | undefined =
      typeof src?.timeoutMs === 'number' ? src.timeoutMs : undefined;

    const data = await this.kucoinService.getCurrenciesWithChains({ timeoutMs });
    return {
      status: 200,
      ok: true,
      data: { list: data },
    };
  }

  @Get('subaccounts')
  @GrpcMethod('KucoinService', 'GetSubAccounts')
  async getSubAccounts() {
    const data = await this.kucoinService.getSubAccounts();
    return {
      status: 200,
      ok: true,
      data: { list: data },
    };
  }

  @Get('prices')
  @GrpcMethod('KucoinService', 'GetPrices')
  async getPrices(payload?: any, @Query() query?: any, @Body() body?: any) {
    const src = payload && Object.keys(payload).length ? payload : query || {};
    const timeoutMs: number | undefined =
      typeof src?.timeoutMs === 'number' ? src.timeoutMs : undefined;

    const data = await this.kucoinService.getPrices({ timeoutMs });
    return {
      status: 200,
      ok: true,
      data: { prices: data },
    };
  }
}
