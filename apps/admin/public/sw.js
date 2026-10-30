// Service worker del panel: muestra el aviso de pedido nuevo aunque el panel
// esté cerrado o el celular bloqueado, y al tocarlo abre el tablero.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (evento) => evento.waitUntil(self.clients.claim()));

self.addEventListener('push', (evento) => {
  let datos = { titulo: 'Pedido nuevo', cuerpo: 'Entró un pedido', etiqueta: 'pedido', url: '/' };
  try {
    datos = { ...datos, ...evento.data.json() };
  } catch {
    // Sin datos: aviso genérico.
  }
  evento.waitUntil(
    self.registration.showNotification(datos.titulo, {
      body: datos.cuerpo,
      tag: datos.etiqueta,
      renotify: true,
      requireInteraction: true,
      vibrate: [300, 120, 300, 120, 300],
      icon: '/icono-192.png',
      badge: '/favicon-48.png',
      data: { url: datos.url },
    }),
  );
});

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const destino = new URL(evento.notification.data?.url ?? '/', self.location.origin).href;
  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      const abierta = ventanas.find((v) => v.url.startsWith(self.location.origin));
      if (abierta) {
        abierta.navigate(destino);
        return abierta.focus();
      }
      return self.clients.openWindow(destino);
    }),
  );
});
