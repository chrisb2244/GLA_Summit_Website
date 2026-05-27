import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

vi.stubEnv('COPRESENTER_INVITE_KEY', 'test-secret-key-for-unit-tests');

import {
  generateInviteToken,
  verifyInviteToken
} from './copresenterInviteToken';

const PRESENTATION_ID = 'presentation-uuid-123';
const PRESENTER_ID = 'presenter-uuid-456';

describe('generateInviteToken / verifyInviteToken', () => {
  it('round-trips correctly', () => {
    const token = generateInviteToken(PRESENTATION_ID, PRESENTER_ID);
    const payload = verifyInviteToken(token);

    expect(payload).not.toBeNull();
    expect(payload?.presentationId).toBe(PRESENTATION_ID);
    expect(payload?.presenterId).toBe(PRESENTER_ID);
  });

  it('returns null for an empty string', () => {
    expect(verifyInviteToken('')).toBeNull();
  });

  it('returns null for a malformed token', () => {
    expect(verifyInviteToken('not-valid-base64url!!')).toBeNull();
  });

  it('returns null when JSON decodes to a non-transfer-object', () => {
    const garbage = encodeURIComponent(
      Buffer.from(JSON.stringify({ hello: 'world' })).toString('base64url')
    );
    expect(verifyInviteToken(garbage)).toBeNull();
  });

  it('returns null when the HMAC is tampered', () => {
    const token = generateInviteToken(PRESENTATION_ID, PRESENTER_ID);
    const decoded = JSON.parse(
      Buffer.from(decodeURIComponent(token), 'base64url').toString('utf-8')
    );
    decoded.token = decoded.token.replace(/[0-9a-f]/, 'x');
    const tampered = encodeURIComponent(
      Buffer.from(JSON.stringify(decoded)).toString('base64url')
    );
    expect(verifyInviteToken(tampered)).toBeNull();
  });

  it('returns null for a token with exp in the past', async () => {
    // Build a token payload with exp already in the past, then sign it correctly
    const expiredPayload = {
      presentationId: PRESENTATION_ID,
      presenterId: PRESENTER_ID,
      exp: Date.now() - 1000 // 1 second ago
    };
    const { createHmac } = await import('crypto');
    const hmac = createHmac('sha256', 'test-secret-key-for-unit-tests');
    hmac.update(JSON.stringify(expiredPayload));
    const token_str = hmac.digest('hex');
    const obj = { data: expiredPayload, token: token_str };
    const encoded = encodeURIComponent(
      Buffer.from(JSON.stringify(obj)).toString('base64url')
    );
    expect(verifyInviteToken(encoded)).toBeNull();
  });
});
