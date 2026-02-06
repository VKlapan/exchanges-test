import { Controller, Get, Query, Body, UseInterceptors, Param } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { KucoinService } from './kucoin.service';
import { jsObjectToStruct } from '../lib/grpc-struct';
import { GrpcStructInterceptor } from '../lib/grpc-struct.interceptor';

@Controller('kucoin')
@UseInterceptors(GrpcStructInterceptor)
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

  @Get('mark-price/:symbol/current')
  async getMarkPriceCurrent(@Param('symbol') symbolParam: string, @Query() query?: any) {
    // HTTP handler: use route param and optional query
    const timeoutMs: number | undefined = typeof query?.timeoutMs === 'number' ? query.timeoutMs : undefined;
    if (!symbolParam) {
      return { status: 400, ok: false, data: { error: 'symbol is required' } };
    }

    const data = await this.kucoinService.getMarkPriceCurrent(symbolParam, { timeoutMs });
    return {
      status: 200,
      ok: true,
      data,
    };
  }

  @GrpcMethod('KucoinService', 'GetMarkPriceCurrent')
  async getMarkPriceCurrentGrpc(payload: any) {
    // gRPC handler: payload contains { symbol, timeoutMs }
    const symbol = payload?.symbol;
    const timeoutMs: number | undefined = typeof payload?.timeoutMs === 'number' ? payload.timeoutMs : undefined;

    if (!symbol) {
      return { status: 400, ok: false, data: { error: 'symbol is required' } };
    }

    const data = await this.kucoinService.getMarkPriceCurrent(symbol, { timeoutMs });
    return {
      status: 200,
      ok: true,
      data,
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
    // Log the raw data returned from the service to diagnose gRPC serialization issues
    console.log('Raw data from getPrices:');
    console.dir(data, { depth: null });

    // For HTTP return plain JSON; the global interceptor will convert to Struct for RPC
    const pricesJson = JSON.parse(JSON.stringify(data));
    return {
      status: 200,
      ok: true,
      data: { prices: pricesJson },
    };
  }
}
