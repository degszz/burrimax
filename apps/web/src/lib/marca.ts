// Datos de la marca que se muestran en la tienda. Todo [A CONFIRMAR] con Max
// (ver docs/10 Preguntas abiertas.md). El WhatsApp de pedidos sale de
// config_negocio; acá va solo lo que todavía no está en la base.

export const MARCA = {
  nombre: '[NOMBRE]',
  /** Título del hero (pedido de Max). */
  frase: 'Burrito a tu Gusto',
  /** Usuario de Instagram sin @. Vacío = no se muestra el botón. */
  instagram: '',
} as const;

export function urlInstagram(): string | null {
  return MARCA.instagram ? `https://www.instagram.com/${MARCA.instagram}` : null;
}
