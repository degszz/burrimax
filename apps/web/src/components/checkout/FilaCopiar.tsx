import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

/** Un dato con su botón "Copiar" (cambia a "¡Copiado!" un momento). Va dentro de un <dl>. */
export function FilaCopiar({ etiqueta, valor, mostrar, onCopiar }: { etiqueta: string; valor: string; mostrar?: string; onCopiar?: () => void }) {
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
