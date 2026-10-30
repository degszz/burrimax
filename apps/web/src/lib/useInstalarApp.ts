import { useEffect, useState } from 'react';

// "Instalar la app" (agregar a la pantalla de inicio). El navegador avisa que
// se puede con el evento `beforeinstallprompt` (Chrome/Edge/Android); lo
// guarda un script en Base.astro apenas carga la página. En iPhone no existe:
// se explica cómo hacerlo desde Compartir.

interface EventoInstalar extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __eventoInstalar?: EventoInstalar | null;
  }
}

export type ModoInstalar = 'boton' | 'iphone' | 'android' | 'ninguno';

export function useInstalarApp() {
  const [modo, setModo] = useState<ModoInstalar>('ninguno');

  useEffect(() => {
    const yaInstalada = window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
    if (yaInstalada) return;
    if (window.__eventoInstalar) setModo('boton');
    else if (/iPhone|iPad|iPod/.test(navigator.userAgent)) setModo('iphone');
    else if (/Android/.test(navigator.userAgent)) setModo('android');

    const alPoder = () => setModo('boton');
    const alInstalar = () => setModo('ninguno');
    window.addEventListener('instalar-disponible', alPoder);
    window.addEventListener('appinstalled', alInstalar);
    return () => {
      window.removeEventListener('instalar-disponible', alPoder);
      window.removeEventListener('appinstalled', alInstalar);
    };
  }, []);

  /** Abre el cartel del navegador. Devuelve true si la persona aceptó. */
  async function instalar(): Promise<boolean> {
    const evento = window.__eventoInstalar;
    if (!evento) return false;
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    window.__eventoInstalar = null;
    setModo('ninguno');
    return outcome === 'accepted';
  }

  return { modo, instalar };
}
