import { MARCA, urlInstagram } from '@/lib/marca';
import { IconoInstagram, IconoWhatsapp } from './IconosRedes';

/** Pie discreto de la portada: logo chico, nombre, redes y el año. */
export function PieDePagina({ whatsapp }: { whatsapp: string | null }) {
  const instagram = urlInstagram();
  const redes = [
    whatsapp && { href: `https://api.whatsapp.com/send?phone=${whatsapp.replace(/\D/g, '')}`, texto: 'WhatsApp', icono: <IconoWhatsapp className="size-4" /> },
    instagram && { href: instagram, texto: 'Instagram', icono: <IconoInstagram className="size-4" /> },
  ].filter(Boolean) as { href: string; texto: string; icono: React.ReactNode }[];

  return (
    <footer className="mx-auto mt-10 max-w-md px-4 pt-5 pb-8 text-sm text-tinta-suave lg:max-w-6xl">
      <div className="flex flex-col items-center gap-3 border-t-2 border-dashed border-tinta/15 pt-5 text-center sm:flex-row sm:text-left">
        <img src="/logo.webp" alt="" width={40} height={40} loading="lazy" className="size-10 shrink-0 opacity-90" />
        <p className="leading-snug">
          <span className="font-heading text-base font-extrabold text-tinta">{MARCA.nombre}</span>
          <br />
          {MARCA.bajada}
        </p>
        {redes.length > 0 && (
          <nav aria-label="Redes" className="flex gap-1 sm:ml-auto">
            {redes.map((r) => (
              <a
                key={r.texto}
                href={r.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center gap-1.5 rounded-xl px-3 font-bold hover:bg-tinta/5 hover:text-tinta"
              >
                {r.icono} {r.texto}
              </a>
            ))}
          </nav>
        )}
      </div>
      <p className="mt-3 text-center text-xs opacity-80 sm:text-left">
        © {new Date().getFullYear()} {MARCA.nombre} · Papas fritas incluidas en cada burrito
      </p>
    </footer>
  );
}
