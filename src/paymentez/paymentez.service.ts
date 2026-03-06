import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const PAYMENTEZ_BASE_URL_STG = 'https://ccapi-stg.paymentez.com';
const PAYMENTEZ_BASE_URL_PROD = 'https://ccapi.paymentez.com';

export interface InitReferenceParams {
  userId: string;
  userEmail: string;
  amount: number;
  description: string;
  devReference: string;
  locale?: string;
  vat?: number;
}

export interface InitReferenceResponse {
  reference: string;
  checkout_url: string;
}

@Injectable()
export class PaymentezService {
  private readonly serverAppKey: string;
  private readonly serverApplicationCode: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.serverAppKey = this.config.get<string>('PAYMENTEZ_SERVER_APP_KEY') ?? '';
    this.serverApplicationCode = this.config.get<string>('PAYMENTEZ_SERVER_APPLICATION_CODE') ?? '';
    const env = this.config.get<string>('PAYMENTEZ_ENV') ?? 'stg';
    this.baseUrl = env === 'prod' ? PAYMENTEZ_BASE_URL_PROD : PAYMENTEZ_BASE_URL_STG;
  }

  private getAuthToken(): string {
    const unixTimestamp = Math.floor(Date.now() / 1000).toString();
    const uniqTokenString = this.serverAppKey + unixTimestamp;
    const uniqTokenHash = crypto.createHash('sha256').update(uniqTokenString).digest('hex');
    const authString = `${this.serverApplicationCode};${unixTimestamp};${uniqTokenHash}`;
    return Buffer.from(authString, 'utf-8').toString('base64');
  }

  async initReference(params: InitReferenceParams): Promise<InitReferenceResponse> {
    const body = {
      locale: params.locale ?? 'es',
      order: {
        amount: params.amount,
        description: params.description,
        vat: params.vat ?? 0,
        dev_reference: params.devReference,
        installments_type: 0,
      },
      user: {
        id: params.userId,
        email: params.userEmail,
      },
    };
    const authToken = this.getAuthToken();
    const res = await fetch(`${this.baseUrl}/v2/transaction/init_reference/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Auth-Token': authToken,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Paymentez init_reference failed: ${res.status} ${errText}`);
    }
    const data = (await res.json()) as { reference?: string; checkout_url?: string };
    if (!data.reference || !data.checkout_url) {
      throw new Error('Paymentez init_reference: invalid response');
    }
    return { reference: data.reference, checkout_url: data.checkout_url };
  }
}
