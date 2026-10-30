// Datos de la marca: TODO en un solo lugar. Cambiar el nombre, la ciudad o
// las redes acá actualiza la tienda, los títulos, la vista previa de
// WhatsApp/Instagram y los datos para Google.
// Todo [A CONFIRMAR] con Max (ver docs/10 Preguntas abiertas.md).
// El WhatsApp de pedidos sale de config_negocio (base de datos).

export const MARCA = {
  /** [A CONFIRMAR] Provisorio: igual que el repo y el dominio. */
  nombre: 'Burrimax',
  /** Título del hero (pedido de Max). */
  frase: 'Burrito a tu Gusto',
  /** Bajada corta: pestaña del navegador y vista previa de links. */
  bajada: 'Burritos armados a tu gusto, con papas fritas',
  /** 150–160 caracteres: lo que muestra Google debajo del título. */
  descripcion:
    'Armá tu burrito a tu gusto: tortilla, salsas, carne y vegetales, con papas fritas incluidas. Pedilo en un minuto desde el celular y te llega por WhatsApp.',
  /** [A CONFIRMAR] Ciudad y provincia (mejora la búsqueda local). Vacío = no se usa. */
  ciudad: '',
  provincia: 'Buenos Aires',
  /** Usuario de Instagram sin @. Vacío = no se muestra el botón. */
  instagram: '',
  /** Dirección pública de la web (sin barra final). */
  sitio: 'https://burrimax.vercel.app',
  colorFondo: '#FFF8EC',
  colorMarca: '#C9431F',
} as const;

export function urlInstagram(): string | null {
  return MARCA.instagram ? `https://www.instagram.com/${MARCA.instagram}` : null;
}

/** "Algo · Burrimax" (o solo el nombre si no hay página). */
export function tituloPagina(pagina?: string): string {
  return pagina ? `${pagina} · ${MARCA.nombre}` : `${MARCA.nombre} · ${MARCA.bajada}`;
}
