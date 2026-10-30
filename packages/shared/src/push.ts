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
  // https://<host>/... sin puerto, sin usuario y sin nada raro antes de la ruta.
  const partes = /^https:\/\/([a-z0-9.-]+)(\/\S*)?$/i.exec(endpoint);
  if (!partes) return false;
  const host = partes[1]!.toLowerCase();
  return SERVICIOS_PUSH.some((r) => r.test(host));
}
