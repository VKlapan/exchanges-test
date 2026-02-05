import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from '../config/app-config.service';
import { HttpService } from '@nestjs/axios';
import * as crypto from 'crypto';

@Injectable()
export class KucoinService {
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly apiPassPhrase: string;
  private readonly brokerName: string;
  private readonly apiPartner: string;
  private readonly apiPartnerSecretKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly appConfig: AppConfigService,
  ) {
    const ku = this.appConfig.kucoin;
    this.apiKey = ku.apiKey;
    this.secretKey = ku.secretKey;
    this.apiPassPhrase = ku.apiPassPhrase;
    this.brokerName = ku.brokerName;
    this.apiPartner = ku.apiPartner;
    this.apiPartnerSecretKey = ku.apiPartnerSecretKey;
  }
  generateBrokerInf0SignatureAndRequest(
    method: 'GET' | 'POST',
    host: string,
    path: string,
    body: Record<string, any> | string | null,
    keyVersion = '2',
  ) {
    const timestamp = Date.now().toString(); //'1680885532722' 

    const requestPath = path;
    let queryString = '';
    if (method === 'GET' && body && typeof body === 'object') {
      queryString = '?' + new URLSearchParams(body as any).toString();
    }

    const bodyStr =
      body == null
        ? ''
        : typeof body === 'string'
          ? body
          : JSON.stringify(body);

    const fullPathForPrehash = requestPath; // exclude queryString from prehash; include bodyStr instead

    const preHashPayload =
      timestamp + method.toUpperCase() + fullPathForPrehash + bodyStr;

    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(preHashPayload);
    const signature = hmac.digest('base64');

    // passphrase needs to be base64-encoded HMAC-SHA256 with secret
    const passHmac = crypto.createHmac('sha256', this.secretKey);
    passHmac.update(this.apiPassPhrase);
    const encodedPassphrase = passHmac.digest('base64');

    const headers = {
      'KC-API-KEY': this.apiKey,
      'KC-API-SIGN': signature,
      'KC-API-TIMESTAMP': timestamp,
      'KC-API-PASSPHRASE': encodedPassphrase,
      'KC-API-KEY-VERSION': keyVersion,
      'KC-API-PARTNER-VERIFY': 'true',
      'Content-Type': 'application/json',
    } as Record<string, string>;

    if (this.brokerName) {
      headers['KC-BROKER-NAME'] = this.brokerName;
    }

    if (this.apiPartner) {
      headers['KC-API-PARTNER'] = this.apiPartner;
    }

    if (this.apiPartner && this.apiPartnerSecretKey) {
      const partnerPrehash = timestamp + this.apiPartner + this.apiKey;
      const partnerHmac = crypto.createHmac('sha256', this.apiPartnerSecretKey);
      partnerHmac.update(partnerPrehash);
      headers['KC-API-PARTNER-SIGN'] = partnerHmac.digest('base64');
    }

    const url = `https://${host}${requestPath}${queryString}`;

    const result = {
      method,
      host,
      path: requestPath,
      timestamp,
      prehash: preHashPayload,
      signature,
      headers,
      url,
      body: bodyStr,
    };

    console.dir(result);

    return result;
  }

  async requestBrokerInfo(params: {
    host?: string;
    path?: string;
    keyVersion?: string;
    body?: Record<string, any> | string | null;
  }) {
    const {
      host = 'api.kucoin.com',
      path = '/api/v1/broker/nd/info',
      body,
      keyVersion,
    } = params;

    const request = this.generateBrokerInf0SignatureAndRequest(
      'POST',
      host,
      path,
      body || null,
      keyVersion,
    );

    console.log(request.url);
    console.log(request.headers);

    const res = await this.httpService.axiosRef.request({
      url: request.url,
      method: 'GET',
      headers: request.headers,
    });

    const status = res.status;
    const ok = status >= 200 && status < 300;
    const data = res.data;

    return {
      status,
      ok,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data,
    };
  }

  buildAccountsRequestSignatureAndRequest(params: {
    method: string;
    endpoint: string;
    body?: Record<string, any> | string | null;
    keyVersion?: string;
    host?: string;
    siteType?: string;
  }) {
    const {
      method,
      endpoint,
      body = null,
      keyVersion = '2',
      host = 'api.kucoin.com',
      siteType,
    } = params;

    const timestamp = Date.now().toString();
    const upperMethod = method.toUpperCase();

    const bodyStr =
      body == null
        ? ''
        : typeof body === 'string'
          ? body
          : JSON.stringify(body);

    let queryString = '';
    if (upperMethod === 'GET' && body && typeof body === 'object') {
      queryString = '?' + new URLSearchParams(body as any).toString();
    }

    const fullEndpointForPrehash = endpoint; // exclude queryString from prehash; include bodyStr instead

    const preHashPayload =
      timestamp + upperMethod + fullEndpointForPrehash + bodyStr;

    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(preHashPayload);
    const signature = hmac.digest('base64');

    const passHmac = crypto.createHmac('sha256', this.secretKey);
    passHmac.update(this.apiPassPhrase);
    const encodedPassphrase = passHmac.digest('base64');

    const headers = {
      'KC-API-KEY': this.apiKey,
      'KC-API-SIGN': signature,
      'KC-API-TIMESTAMP': timestamp,
      'KC-API-PASSPHRASE': encodedPassphrase,
      'KC-API-KEY-VERSION': keyVersion,
      'Content-Type': 'application/json',
    } as Record<string, string>;

    if (siteType) {
      headers['X-SITE-TYPE'] = siteType;
    }

    const url = `https://${host}${endpoint}${queryString}`;

    return {
      method: upperMethod,
      host,
      path: endpoint,
      timestamp,
      prehash: preHashPayload,
      signature,
      headers,
      url,
      body: bodyStr,
    };
  }

  async requestAccounts(params: {
    method: string;
    endpoint: string;
    body?: Record<string, any> | string | null;
    keyVersion?: string;
    host?: string;
    siteType?: string;
  }) {
    const request = this.buildAccountsRequestSignatureAndRequest(params);

    console.log(request.url);
    console.log(request.headers);

    const init: RequestInit = {
      method: request.method,
      headers: request.headers,
    };

    if (
      request.body &&
      request.method !== 'GET' &&
      request.method !== 'DELETE'
    ) {
      init.body = request.body;
    }

    const axiosReq: any = {
      url: request.url,
      method: request.method,
      headers: request.headers,
    };

    if (
      request.body &&
      request.method !== 'GET' &&
      request.method !== 'DELETE'
    ) {
      axiosReq.data = request.body;
    }

    const res = await this.httpService.axiosRef.request(axiosReq);

    const status = res.status;
    const ok = status >= 200 && status < 300;
    const data = res.data;

    return {
      status,
      ok,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data,
    };
  }

  async getCurrenciesWithChains(opts: { baseURL?: string; timeoutMs?: number } = {}) {
  const baseURL = opts.baseURL || 'https://api.kucoin.com';
  const timeout = typeof opts.timeoutMs === 'number' ? opts.timeoutMs : 15000;
  const url = '/api/v3/currencies';

  try {
    const res = await this.httpService.axiosRef.request({
      baseURL,
      url,
      method: 'GET',
      timeout,
      validateStatus: () => true,
    });

    if (!res || !res.data) {
      throw new Error(`Empty response from KuCoin (http status ${res && res.status})`);
    }

    const { code, data, msg } = res.data;

    if (code && code !== '200000') {
      const reason = typeof msg === 'string' ? msg : JSON.stringify(res.data);
      const err = new Error(`KuCoin API error code=${code}: ${reason}`);
      (err as any).payload = res.data;
      throw err;
    }

    if (!Array.isArray(data)) return [];

    const coins = data.map(item => {
      const {
        currency,
        name,
        fullName,
        precision,
        confirms,
        contractAddress,
        isMarginEnabled,
        isDebitEnabled,
        chains,
      } = item;

      const normalizedChains = Array.isArray(chains)
        ? chains.map(ch => ({
            chainName: ch.chainName || '',
            chainId: ch.chainId || '',
            depositEnabled: Boolean(ch.isDepositEnabled),
            withdrawEnabled: Boolean(ch.isWithdrawEnabled),
            needTag: Boolean(ch.needTag),
            confirms: Number(ch.confirms) || 0,
            preConfirms: Number(ch.preConfirms) || 0,
            depositMinSize: ch.depositMinSize ? Number(ch.depositMinSize) : null,
            withdrawalMinSize: ch.withdrawalMinSize ? Number(ch.withdrawalMinSize) : null,
            withdrawalMinFee: ch.withdrawalMinFee ? Number(ch.withdrawalMinFee) : null,
            withdrawPrecision: ch.withdrawPrecision ? Number(ch.withdrawPrecision) : null,
            contractAddress: ch.contractAddress || '',
            raw: ch,
          }))
        : [];

      return {
        currency,
        name,
        fullName,
        precision: Number(precision) || 0,
        confirms: Number(confirms) || 0,
        contractAddress: contractAddress || '',
        isMarginEnabled: Boolean(isMarginEnabled),
        isDebitEnabled: Boolean(isDebitEnabled),
        chains: normalizedChains,
        raw: item,
      };
    });
    
    return coins;
  } catch (err) {
    if ((err as any).response && (err as any).response.data) {
      const e = new Error(`KuCoin request failed: ${JSON.stringify((err as any).response.data)}`);
      (e as any).payload = (err as any).response.data;
      throw e;
    }
    throw err;
  }
  }

  async getSubAccounts(opts = {}) {
  const apiKey = process.env.KUCOIN_MAIN_KEY || '';
  const apiSecret = process.env.KUCOIN_MAIN_SECRET || '';
  const apiPassphrase = process.env.KUCOIN_MAIN_PASSPHRASE || '';
  const apiKeyVersion = process.env.KUCOIN_MAIN_KEY_VERSION || '2';
  const timeoutMs = 15000;

  const BASE = 'https://api.kucoin.com';
  const path = '/api/v2/sub/user';
  const method = 'GET';
  const ts = Date.now().toString();

  const prehash = `${ts}${method}${path}`;
  const sign = crypto.createHmac('sha256', apiSecret).update(prehash).digest('base64');

  const passphraseHeader =
    String(apiKeyVersion) === '1'
      ? apiPassphrase
      : crypto.createHmac('sha256', apiSecret).update(apiPassphrase).digest('base64');

  const headers = {
    'Content-Type': 'application/json',
    'KC-API-KEY': apiKey,
    'KC-API-SIGN': sign,
    'KC-API-TIMESTAMP': ts,
    'KC-API-PASSPHRASE': passphraseHeader,
    'KC-API-KEY-VERSION': String(apiKeyVersion),
  };

  const res = await this.httpService.axiosRef.request({
    baseURL: BASE,
    url: path,
    method,
    headers,
    timeout: timeoutMs,
    validateStatus: () => true,
  });

  if (!res?.data) throw new Error(`Empty response (status ${res.status})`);

  const { code, data, msg } = res.data;

  if (code !== '200000') throw new Error(`KuCoin API error ${code}: ${msg || 'unknown'}`);

  return data || [];
  }

}
