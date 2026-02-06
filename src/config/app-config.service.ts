import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type KucoinConfig = {
  apiKey: string;
  secretKey: string;
  apiPassPhrase: string;
  brokerName: string;
  apiPartner: string;
  apiPartnerSecretKey: string;
};

export type HuobiConfig = {
  accessKey: string;
  secretKey: string;
};

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService) {}

  get kucoin(): KucoinConfig {
    return {
      apiKey: this.configService.get<string>('KUCOIN_API_KEY') || '',
      secretKey: this.configService.get<string>('KUCOIN_SECRET_KEY') || '',
      apiPassPhrase:
        this.configService.get<string>('KUCOIN_API_PASSPHRASE') || '',
      brokerName: this.configService.get<string>('KUCOIN_BROKER_NAME') || '',
      apiPartner: this.configService.get<string>('KUCOIN_API_PARTNER') || '',
      apiPartnerSecretKey:
        this.configService.get<string>('KUCOIN_API_PARTNER_SECRETKEY') || '',
    };
  }

  get huobi(): HuobiConfig {
    return {
      accessKey: this.configService.get<string>('HUOBI_HMAC') || '',
      secretKey: this.configService.get<string>('HUOBI_SECRET_KEY') || '',
    };
  }
}
