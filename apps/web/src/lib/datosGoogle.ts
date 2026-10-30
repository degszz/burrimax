import { MARCA, urlInstagram } from './marca';

interface Entrada {
  sitio: string;
  /** Solo dígitos, con código de país (5492271468521). */
  whatsapp: string | null;
  precioDesde: number | null;
}

/**
 * Ficha del negocio para Google (schema.org/Restaurant). Ayuda a que aparezca
 * como restaurante con su teléfono, zona y menú. Lo que falta se omite.
 */
export function datosRestaurante({ sitio, whatsapp, precioDesde }: Entrada): Record<string, unknown> {
  const instagram = urlInstagram();
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: MARCA.nombre,
    description: MARCA.descripcion,
    url: `${sitio}/`,
    image: `${sitio}/og.png?v=2`,
    logo: `${sitio}/icono-512.png`,
    servesCuisine: ['Mexicana', 'Tex-Mex', 'Burritos'],
    priceRange: '$$',
    currenciesAccepted: 'ARS',
    paymentAccepted: 'Efectivo, Transferencia, Mercado Pago',
    acceptsReservations: false,
    hasMenu: `${sitio}/`,
    ...(whatsapp ? { telephone: `+${whatsapp}` } : {}),
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'AR',
      addressRegion: MARCA.provincia,
      ...(MARCA.ciudad ? { addressLocality: MARCA.ciudad } : {}),
    },
    ...(MARCA.ciudad ? { areaServed: MARCA.ciudad } : {}),
    ...(instagram ? { sameAs: [instagram] } : {}),
    ...(precioDesde
      ? {
          makesOffer: {
            '@type': 'Offer',
            name: 'Burrito simple con papas fritas',
            price: precioDesde,
            priceCurrency: 'ARS',
          },
        }
      : {}),
    potentialAction: {
      '@type': 'OrderAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${sitio}/`, actionPlatform: ['http://schema.org/MobileWebPlatform', 'http://schema.org/DesktopWebPlatform'] },
      deliveryMethod: ['http://purl.org/goodrelations/v1#DeliveryModeOwnFleet', 'http://purl.org/goodrelations/v1#DeliveryModePickUp'],
    },
  };
}
