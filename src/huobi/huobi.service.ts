import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class HuobiService {
  private readonly accessKey: string;
  private readonly secretKey: string;

  constructor(private readonly configService: ConfigService) {
    this.accessKey = this.configService.get<string>('HUOBI_HMAC') || '';
    this.secretKey = this.configService.get<string>('HUOBI_SECRET_KEY') || '';
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

    const response = await fetch(url, init);

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
