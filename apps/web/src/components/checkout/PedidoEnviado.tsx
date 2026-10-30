import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatoPesos } from '@/lib/formato';
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

/** Cuánto se ve el tilde antes de saltar a WhatsApp. */
const ESPERA_MS = 1800;

/**
 * Pantalla completa de "¡Listo!": un tilde grande que se dibuja y el número de
 * pedido. Con efectivo salta solo a WhatsApp con el mensaje ya escrito. Con
 * transferencia NO salta: primero muestra el alias y el monto para copiar con
 * un toque, y un botón para abrir Mercado Pago (o el banco) y pegarlo.
 */
export function PedidoEnviado({ numero, linkWhatsapp, urlSeguimiento, transferencia }: Props) {
  const conDatos = !!transferencia && !!(transferencia.alias || transferencia.cvu);

  useEffect(() => {
    if (conDatos) return;
    const espera = window.setTimeout(() => {
      window.location.href = linkWhatsapp;
    }, ESPERA_MS);
    return () => window.clearTimeout(espera);
  }, [linkWhatsapp, conDatos]);

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
                <FilaCopiar etiqueta="Monto" valor={String(transferencia.total)} mostrar={formatoPesos(transferencia.total)} />
                {transferencia.alias && <FilaCopiar etiqueta="Alias" valor={transferencia.alias} />}
                {transferencia.cvu && <FilaCopiar etiqueta="CVU" valor={transferencia.cvu} />}
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
              <IconoWhatsapp className="size-6 shrink-0" /> 2. Mandar el pedido por WhatsApp
            </a>
            <p className="mt-1.5 text-sm text-tinta-suave">Después mandanos el comprobante por el mismo chat.</p>
          </>
        ) : (
          <>
            <p className="mt-4 text-lg text-tinta-suave" aria-live="polite">
              <IconoWhatsapp className="mr-1 inline size-5 align-[-4px] text-verde" />
              Te llevamos a WhatsApp para mandarlo…
            </p>
            <a
              href={linkWhatsapp}
              className="juguete mt-6 flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-verde font-heading text-xl font-extrabold text-white shadow-[0_4px_0_var(--tinta)]"
            >
              <IconoWhatsapp className="size-6" /> Abrir WhatsApp
            </a>
          </>
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
function FilaCopiar({ etiqueta, valor, mostrar }: { etiqueta: string; valor: string; mostrar?: string }) {
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
