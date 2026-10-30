import { useEffect, useState } from 'react';

/** Clave pública de los avisos (la privada solo está en el servidor de la tienda). */
const VAPID_PUBLICA = 'BCRyAo4wyLZDHaZnF-VsM7dfASSLDde8z-yK9Q7vM_L-givj9u9pR_lRgrs8IVkxOZ9FC_jAeO6aTshhyySPFak';

type Estado = 'cargando' | 'no-soportado' | 'instalar-iphone' | 'apagado' | 'activado' | 'bloqueado' | 'error';

function aBytes(base64: string): Uint8Array<ArrayBuffer> {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4);
  const crudo = atob((base64 + relleno).replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(new ArrayBuffer(crudo.length));
  for (let i = 0; i < crudo.length; i++) bytes[i] = crudo.charCodeAt(i);
  return bytes;
}

const esIphone = () => /iPhone|iPad|iPod/.test(navigator.userAgent);
const instalada = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

/**
 * "Avisarme en este celular": avisos de pedido nuevo aunque el panel esté
 * cerrado. En iPhone solo funciona con el panel instalado en la pantalla de inicio.
 */
export function BotonAvisos() {
  const [estado, setEstado] = useState<Estado>('cargando');

  useEffect(() => {
    void (async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        setEstado(esIphone() && !instalada() ? 'instalar-iphone' : 'no-soportado');
        return;
      }
      if (Notification.permission === 'denied') {
        setEstado('bloqueado');
        return;
      }
      const reg = await navigator.serviceWorker.register('/sw.js');
      const suscripcion = await reg.pushManager.getSubscription();
      setEstado(suscripcion && Notification.permission === 'granted' ? 'activado' : 'apagado');
    })().catch(() => setEstado('error'));
  }, []);

  async function activar() {
    setEstado('cargando');
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== 'granted') {
        setEstado(permiso === 'denied' ? 'bloqueado' : 'apagado');
        return;
      }
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const suscripcion = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(VAPID_PUBLICA) }));
      const r = await fetch('/api/push', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...suscripcion.toJSON(), dispositivo: navigator.userAgent.slice(0, 200) }),
      });
      if (!r.ok) throw new Error();
      setEstado('activado');
      // Aviso de prueba local, para ver cómo llega.
      await reg.showNotification('🔔 Avisos activados', { body: 'Así te va a llegar cada pedido nuevo.', icon: '/icono-192.png', tag: 'prueba' });
    } catch {
      setEstado('error');
    }
  }

  async function probar() {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification('🌯 Pedido #0000 · $9.000', { body: 'Prueba · Delivery · Efectivo', icon: '/icono-192.png', tag: 'prueba', requireInteraction: true });
  }

  async function apagar() {
    const reg = await navigator.serviceWorker.ready;
    const suscripcion = await reg.pushManager.getSubscription();
    if (suscripcion) {
      await fetch('/api/push', { method: 'DELETE', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ endpoint: suscripcion.endpoint }) });
      await suscripcion.unsubscribe();
    }
    setEstado('apagado');
  }

  const base = 'h-11 rounded-xl px-4 text-sm font-bold';
  switch (estado) {
    case 'cargando':
      return null;
    case 'activado':
      return (
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-green-700">📲 Avisos en este celular</span>
          <button type="button" onClick={probar} className={`${base} bg-white`}>
            Probar
          </button>
          <button type="button" onClick={apagar} className={`${base} text-zinc-500`}>
            Apagar
          </button>
        </span>
      );
    case 'apagado':
    case 'error':
      return (
        <button type="button" onClick={activar} className={`${base} bg-zinc-900 text-white`}>
          📲 {estado === 'error' ? 'Reintentar avisos' : 'Avisarme en este celular'}
        </button>
      );
    case 'bloqueado':
      return <span className="text-sm font-semibold text-red-700">Avisos bloqueados: habilitalos en los ajustes del navegador para este sitio</span>;
    case 'instalar-iphone':
      return <span className="text-sm font-semibold text-zinc-700">📲 Para avisos en iPhone: Compartir → "Agregar a inicio" y abrí el panel desde ese ícono</span>;
    default:
      return <span className="text-sm text-zinc-500">Este navegador no admite avisos</span>;
  }
}
