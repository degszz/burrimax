import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatoPesos } from '@/lib/formato';
import { useInstalarApp } from '@/lib/useInstalarApp';
import { IconoWhatsapp } from '../tienda/IconosRedes';

export interface DatosTransferencia {
  alias: string | null;
  cvu: string | null;
  titular: string | null;
  total: number;
}

interface Props {
  /** null: la web no pudo guardarlo; va solo por WhatsApp (sin seguimiento). */
  numero: number | null;
  linkWhatsapp: string;
  urlSeguimiento: string | null;
  /** Si paga por transferencia y hay alias o CVU cargado: se muestran para copiar. */
  transferencia?: DatosTransferencia | null;
}

/**
 * Pantalla completa de "¡Listo!": un tilde grande que se dibuja, el número de
 * pedido y, SIN tocar nada, salta a WhatsApp con el mensaje ya escrito.
 * Con transferencia espera un poco más para poder copiar el alias.
 * Mientras tanto ofrece instalar la app (si toca, la cuenta se pausa).
 */
export function PedidoEnviado({ numero, linkWhatsapp, urlSeguimiento, transferencia }: Props) {
  const conDatos = !!transferencia && !!(transferencia.alias || transferencia.cvu);
  const [segundos, setSegundos] = useState(conDatos ? 8 : 3);
  const [pausado, setPausado] = useState(false);
  const [yaFue, setYaFue] = useState(false);
  const { modo: modoInstalar, instalar } = useInstalarApp();

  // Cuenta regresiva y salto a WhatsApp (una sola vez).
  useEffect(() => {
    if (pausado || yaFue) return;
    if (segundos <= 0) {
      setYaFue(true);
      window.location.href = linkWhatsapp;
      return;
    }
    const t = window.setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [segundos, pausado, yaFue, linkWhatsapp]);

  const cuenta = yaFue
    ? 'Si no se abrió WhatsApp, tocá el botón.'
    : pausado
      ? 'En pausa mientras instalás…'
      : `Te llevamos a WhatsApp en ${segundos}…`;
  const masTiempo = () => setSegundos((s) => Math.max(s, 6));

  async function alInstalar() {
    setPausado(true);
    await instalar().catch(() => false);
    // Después de instalar (o no), sigue el camino a WhatsApp.
    setSegundos(2);
    setPausado(false);
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="titulo-enviado"
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-crema px-6 py-6 text-center"
    >
      <div className="w-full max-w-sm">
        <div
          className={`animate-sello mx-auto grid place-items-center rounded-full border-[3px] border-tinta bg-verde shadow-[0_6px_0_var(--tinta)] ${conDatos ? 'size-24' : 'size-36'}`}
        >
          <svg viewBox="0 0 52 52" className={conDatos ? 'size-14' : 'size-20'} aria-hidden>
            <path className="animate-tilde" d="M14 27 L23 36 L39 17" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 id="titulo-enviado" className="animate-aparecer mt-4 text-4xl font-extrabold">
          ¡Listo!
        </h1>
        <p className="animate-aparecer mt-1 text-xl font-semibold">
          {numero ? (
            <>
              Tu pedido <span className="font-heading font-extrabold">#{String(numero).padStart(4, '0')}</span> está armado
            </>
          ) : (
            'Tu pedido está armado'
          )}
        </p>

        {conDatos && transferencia ? (
          <>
            <section aria-label="Datos para transferir" className="juguete mt-5 rounded-3xl bg-white p-4 text-left">
              <h2 className="text-xl font-extrabold">1. Transferí {formatoPesos(transferencia.total)}</h2>
              <dl className="mt-2 space-y-2">
                <FilaCopiar etiqueta="Monto" valor={String(transferencia.total)} mostrar={formatoPesos(transferencia.total)} onCopiar={masTiempo} />
                {transferencia.alias && <FilaCopiar etiqueta="Alias" valor={transferencia.alias} onCopiar={masTiempo} />}
                {transferencia.cvu && <FilaCopiar etiqueta="CVU" valor={transferencia.cvu} onCopiar={masTiempo} />}
                {transferencia.titular && (
                  <div>
                    <dt className="text-sm text-tinta-suave">Titular</dt>
                    <dd className="font-heading text-lg font-extrabold">{transferencia.titular}</dd>
                  </div>
                )}
              </dl>
              {/* Abre la app de Mercado Pago si está instalada (si no, la web). */}
              <a
                href="https://www.mercadopago.com.ar/"
                target="_blank"
                rel="noopener noreferrer"
                className="juguete mt-3 flex min-h-12 items-center justify-center rounded-xl bg-[#00B1EA] font-heading text-lg font-extrabold text-white"
              >
                Abrir Mercado Pago
              </a>
              <p className="mt-1.5 text-center text-sm text-tinta-suave">Tocá "Transferir" y pegá el alias. También sirve cualquier banco.</p>
            </section>

            <a
              href={linkWhatsapp}
              className="juguete mt-4 flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-verde font-heading text-xl leading-tight font-extrabold text-white shadow-[0_4px_0_var(--tinta)]"
            >
              <IconoWhatsapp className="size-6 shrink-0" /> Mandar el pedido ahora
            </a>
            <p className="mt-1.5 text-sm text-tinta-suave" aria-live="polite">
              {cuenta} Después mandanos el comprobante por el mismo chat.
            </p>
          </>
        ) : (
          <>
            <p className="mt-4 text-lg text-tinta-suave" aria-live="polite">
              <IconoWhatsapp className="mr-1 inline size-5 align-[-4px] text-verde" />
              {cuenta}
            </p>
            <a
              href={linkWhatsapp}
              className="juguete mt-6 flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-verde font-heading text-xl font-extrabold text-white shadow-[0_4px_0_var(--tinta)]"
            >
              <IconoWhatsapp className="size-6" /> Abrir WhatsApp ahora
            </a>
          </>
        )}

        {/* Instalar la app: el próximo pedido, a un toque desde la pantalla de inicio */}
        {modoInstalar !== 'ninguno' && (
          <div className="mt-5 rounded-2xl border-2 border-dashed border-tinta/40 p-3">
            <p className="flex items-center justify-center gap-2 font-heading text-lg font-extrabold">
              <img src="/icono-192.png" alt="" className="size-8 rounded-lg" /> Tené Burrimax en tu celular
            </p>
            {modoInstalar === 'boton' ? (
              <button
                type="button"
                onClick={alInstalar}
                className="juguete mt-2 flex min-h-12 w-full items-center justify-center rounded-xl bg-white font-heading text-lg font-extrabold"
              >
                Instalar la app
              </button>
            ) : modoInstalar === 'iphone' ? (
              <p className="mt-1 text-sm text-tinta-suave">
                En Safari tocá <b>Compartir</b> y después <b>Agregar a inicio</b>.
              </p>
            ) : (
              <p className="mt-1 text-sm text-tinta-suave">
                En Chrome tocá <b>⋮</b> (arriba a la derecha) y después <b>Agregar a la pantalla principal</b>.
              </p>
            )}
          </div>
        )}

        {urlSeguimiento ? (
          <a href={urlSeguimiento} className="mt-3 inline-flex min-h-12 items-center font-bold text-tinta-suave underline underline-offset-4">
            Ver mi pedido
          </a>
        ) : (
          <a href="/" className="mt-3 inline-flex min-h-12 items-center font-bold text-tinta-suave underline underline-offset-4">
            Volver al inicio
          </a>
        )}
      </div>
    </div>
  );
}

/** Un dato con su botón "Copiar" (cambia a "¡Copiado!" un momento). */
function FilaCopiar({ etiqueta, valor, mostrar, onCopiar }: { etiqueta: string; valor: string; mostrar?: string; onCopiar?: () => void }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
    } catch {
      // Navegadores viejos: selección manual con un textarea oculto.
      const campo = document.createElement('textarea');
      campo.value = valor;
      document.body.append(campo);
      campo.select();
      document.execCommand('copy');
      campo.remove();
    }
    setCopiado(true);
    onCopiar?.();
    window.setTimeout(() => setCopiado(false), 1800);
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <dt className="text-sm text-tinta-suave">{etiqueta}</dt>
        <dd className="font-heading text-xl font-extrabold break-all">{mostrar ?? valor}</dd>
      </div>
      <button
        type="button"
        onClick={copiar}
        aria-label={`Copiar ${etiqueta.toLowerCase()}`}
        className={`juguete flex min-h-12 shrink-0 items-center gap-1 rounded-xl px-3 font-bold ${copiado ? 'bg-verde-claro text-verde' : 'bg-amarillo'}`}
      >
        {copiado ? <Check aria-hidden className="size-4" strokeWidth={3} /> : <Copy aria-hidden className="size-4" />}
        <span aria-live="polite">{copiado ? '¡Copiado!' : 'Copiar'}</span>
      </button>
    </div>
  );
}
