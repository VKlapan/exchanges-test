import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class KucoinService {
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly apiPassPhrase: string;
  private readonly brokerName: string;
  private readonly apiPartner: string;
  private readonly apiPartnerSecretKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('KUCOIN_API_KEY') || '';
    this.secretKey = this.configService.get<string>('KUCOIN_SECRET_KEY') || '';
    this.apiPassPhrase =
      this.configService.get<string>('KUCOIN_API_PASSPHRASE') || '';
    this.brokerName =
      this.configService.get<string>('KUCOIN_BROKER_NAME') || '';
    this.apiPartner =
      this.configService.get<string>('KUCOIN_API_PARTNER') || '';
    this.apiPartnerSecretKey =
      this.configService.get<string>('KUCOIN_API_PARTNER_SECRETKEY') || '';
  }
  generateBrokerInf0SignatureAndRequest(
    method: 'GET' | 'POST',
    host: string,
    path: string,
    body: Record<string, any> | string | null,
    keyVersion = '2',
  ) {
    const timestamp = Date.now().toString();

    const requestPath = path;
    let queryString = '';
    if (method === 'GET' && body && typeof body === 'object') {
      queryString = '?' + new URLSearchParams(body as any).toString();
    }
    const fullPathForPrehash = requestPath + queryString;

    const bodyStr =
      body == null || method === 'GET'
        ? ''
        : typeof body === 'string'
          ? body
          : JSON.stringify(body);

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
  }) {
    const {
      host = 'api.kucoin.com',
      path = '/api/v1/broker/nd/info',
      keyVersion,
    } = params;

    const request = this.generateBrokerInf0SignatureAndRequest(
      'GET',
      host,
      path,
      null,
      keyVersion,
    );

    console.log(request.url);
    console.log(request.headers);

    const response = await fetch(request.url, {
      method: 'GET',
      headers: request.headers,
    });

    const contentType = response.headers.get('content-type') || '';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    return {
      status: response.status,
      ok: response.ok,
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
      upperMethod === 'GET' || upperMethod === 'DELETE' || body == null
        ? ''
        : typeof body === 'string'
          ? body
          : JSON.stringify(body);

    let queryString = '';
    if (upperMethod === 'GET' && body && typeof body === 'object') {
      queryString = '?' + new URLSearchParams(body as any).toString();
    }

    const fullEndpointForPrehash = endpoint + queryString;

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

    const response = await fetch(request.url, init);

    const contentType = response.headers.get('content-type') || '';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    return {
      status: response.status,
      ok: response.ok,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data,
    };
  }
}
