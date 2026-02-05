import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfigService } from '../config/app-config.service';
import { HttpService } from '@nestjs/axios';
import * as crypto from 'crypto';

@Injectable()
export class HuobiService {
  private readonly accessKey: string;
  private readonly secretKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly appConfig: AppConfigService,
    private readonly httpService: HttpService,
  ) {
    const hu = this.appConfig.huobi;
    this.accessKey = hu.accessKey;
    this.secretKey = hu.secretKey;
  }
  generateSignatureAndRequest(
    method: 'GET' | 'POST',
    host: string,
    path: string,
    params: Record<string, any>,
  ) {
    const upperHost = host.toLowerCase();

    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, '');

    const authParams: Record<string, string> = {
      AccessKeyId: this.accessKey,
      SignatureMethod: 'HmacSHA256',
      SignatureVersion: '2',
      Timestamp: timestamp,
    };

    // Merge params (user params may override non-auth keys)
    const merged: Record<string, any> = { ...params, ...authParams };

    // Percent-encode per RFC3986 using encodeURIComponent and uppercase hex
    const encode = (str: string) =>
      encodeURIComponent(str)
        // eslint-disable-next-line no-useless-escape
        .replace(/\!/g, '%21')
        // eslint-disable-next-line no-useless-escape
        .replace(/\'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A')
        .replace(/%[0-9a-f]{2}/g, (m) => m.toUpperCase());

    // Sort keys by ASCII
    const orderedKeys = Object.keys(merged).sort();

    const canonical = orderedKeys
      .map((k) => `${encode(k)}=${encode(String(merged[k]))}`)
      .join('&');

    const preSignedText = `${method}\n${upperHost}\n${path}\n${canonical}`;

    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(preSignedText);
    const signature = hmac.digest('base64');

    // Attach signature (must be URL-encoded when building final URL)
    const signedParams = `${canonical}&Signature=${encode(signature)}`;

    const url = `https://${upperHost}${path}?${signedParams}`;

    return {
      method,
      host: upperHost,
      path,
      timestamp,
      preSignedText,
      signature,
      signedParams,
      url,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };
  }

  async requestPublic(
    method: 'GET' | 'POST',
    host: string,
    path: string,
    params: Record<string, any>,
  ) {
    const urlBase = `https://${host}${path}`;
    const init: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    };

    let url = urlBase;
    if (method === 'GET') {
      const qs = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ).toString();
      if (qs) url = `${urlBase}?${qs}`;
    } else {
      init.body = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ).toString();
    }

    const axiosReq: any = {
      url: urlBase,
      method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      validateStatus: () => true,
    };

    if (method === 'GET') {
      axiosReq.params = params;
    } else {
      axiosReq.data = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v)]),
      ).toString();
    }

    const res = await this.httpService.axiosRef.request(axiosReq);

    const status = res.status;
    const ok = status >= 200 && status < 300;
    const data = res.data;

    return {
      status,
      ok,
      data,
    };
  }

    async requestSigned(
    method: 'GET' | 'POST',
    host: string,
    path: string,
    params: Record<string, any>,
  ) {
    const req = this.generateSignatureAndRequest(method, host, path, params);

    const init: RequestInit = { method: req.method, headers: req.headers };

    let url = req.url;
    if (req.method === 'POST') {
      // For POST, send signed params in request body as form data
      init.body = req.signedParams;
      url = `https://${req.host}${req.path}`;
    }

    let res: any;
    if (req.method === 'GET') {
      res = await this.httpService.axiosRef.request({
        url: req.url,
        method: req.method,
        headers: req.headers,
        validateStatus: () => true,
      });
    } else {
      res = await this.httpService.axiosRef.request({
        url: `https://${req.host}${req.path}`,
        method: req.method,
        headers: req.headers,
        data: req.signedParams,
        validateStatus: () => true,
      });
    }

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
}
