// Solo se aceptan direcciones de avisos de los servicios oficiales de los
// navegadores. Así el servidor nunca le manda pedidos a una URL cualquiera
// (aunque alguien guardara una suscripción trucha).
const SERVICIOS_PUSH = [
  /^fcm\.googleapis\.com$/, // Chrome, Android, Edge nuevo
  /^(.+\.)?push\.services\.mozilla\.com$/, // Firefox
  /^web\.push\.apple\.com$/, // Safari / iPhone
  /^(.+\.)?notify\.windows\.com$/, // Edge viejo / Windows
];

export function esEndpointPushValido(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return url.protocol === 'https:' && !url.port && SERVICIOS_PUSH.some((r) => r.test(url.hostname));
  } catch {
    return false;
  }
}
