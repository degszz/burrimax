import { describe, expect, it } from 'vitest';
import { esEndpointPushValido } from './push';

describe('endpoints de avisos push', () => {
  it('acepta los servicios oficiales', () => {
    expect(esEndpointPushValido('https://fcm.googleapis.com/fcm/send/abc')).toBe(true);
    expect(esEndpointPushValido('https://web.push.apple.com/QGx')).toBe(true);
    expect(esEndpointPushValido('https://updates.push.services.mozilla.com/wpush/v2/x')).toBe(true);
    expect(esEndpointPushValido('https://db5p.notify.windows.com/w/?token=x')).toBe(true);
  });

  it('rechaza cualquier otra dirección', () => {
    expect(esEndpointPushValido('http://fcm.googleapis.com/x')).toBe(false);
    expect(esEndpointPushValido('https://fcm.googleapis.com:8443/x')).toBe(false);
    expect(esEndpointPushValido('https://evil.com/fcm.googleapis.com')).toBe(false);
    expect(esEndpointPushValido('https://fcm.googleapis.com.evil.com/x')).toBe(false);
    expect(esEndpointPushValido('https://169.254.169.254/latest')).toBe(false);
    expect(esEndpointPushValido('no es url')).toBe(false);
  });
});
