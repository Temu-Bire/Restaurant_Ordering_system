import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChapaGateway } from './chapa.gateway.js';

describe('ChapaGateway', () => {
  let gateway: ChapaGateway;
  let config: ConfigService;

  beforeEach(() => {
    config = {
      get: vi.fn((key: string) => {
        if (key === 'chapa.secretKey') return 'CHASECK_TEST-sample-key';
        if (key === 'chapa.publicKey') return 'CHAPUBK_TEST-sample-key';
        if (key === 'chapa.webhookSecret') return 'test-webhook-secret';
        if (key === 'chapa.baseUrl') return 'https://api.chapa.co/v1';
        if (key === 'chapa.environment') return 'TEST';
        return undefined;
      }),
    } as unknown as ConfigService;

    gateway = new ChapaGateway(config);
  });

  it('should initialize gateway in TEST environment', () => {
    expect(gateway.getEnvironment()).toBe('TEST');
  });

  it('should verify valid HMAC-SHA256 webhook signatures', () => {
    const payload = JSON.stringify({
      event: 'charge.complete',
      tx_ref: 'ARIF-1001-123',
      status: 'success',
    });

    const crypto = require('crypto');
    const validSignature = crypto
      .createHmac('sha256', 'test-webhook-secret')
      .update(payload)
      .digest('hex');

    const isValid = gateway.verifyWebhookSignature(validSignature, payload);
    expect(isValid).toBe(true);
  });

  it('should reject invalid webhook signatures', () => {
    const payload = JSON.stringify({ tx_ref: 'ARIF-1001-123' });
    const isInvalid = gateway.verifyWebhookSignature('invalid-sig', payload);
    expect(isInvalid).toBe(false);
  });

  it('should fallback to mock checkout link in test mode if fetch fails', async () => {
    const result = await gateway.initialize({
      amount: 450,
      currency: 'ETB',
      email: 'guest@example.com',
      txRef: 'ARIF-99-TEST',
    });

    expect(result.txRef).toBe('ARIF-99-TEST');
    expect(result.checkoutUrl).toContain('ARIF-99-TEST');
  });
});
