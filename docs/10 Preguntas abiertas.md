---
tags: [burritos, pendientes]
---
# Preguntas abiertas

## Negocio
- [ ] Nombre del emprendimiento, logo y colores (hoy dice `[NOMBRE]`)
- [x] Ingredientes: tortilla maíz (sin TACC) o trigo · salsas · carne pollo/vaca/cerdo/pescado · vegetales (ver [[02 Reglas de negocio]])
- [ ] Precios base con papas: simple (hoy $9.000) y doble (hoy $13.500)
- [ ] ¿Pescado o maíz llevan costo extra? (hoy todos $0)
- [x] Límites: simple 2 carnes + hasta 4 vegetales; doble 4 carnes + hasta 6 vegetales; hasta 2 salsas
- [x] La doble tapa usa dos tortillas del mismo tipo
- [ ] Doble tapa con tortilla que tenga costo extra: ¿se cobra una vez o dos? (hoy: una vez)
- [x] Salsas: las 14 de las imágenes de Max (2026-10-29)
- [ ] Imágenes de salsas en más resolución: hoy son de ~146 px; para pantallas de alta densidad conviene 512×512
- [ ] Imagen de cerdo (`apps/web/public/armador/cerdo.avif`)
- [ ] **¿Qué salsas son sin TACC?** Por precaución hoy están todas como NO confirmadas (`sin_tacc = false`)
- [ ] Foto definitiva del burrito cerrado: la actual tiene **marca de agua de banco de fotos** (no se puede publicar). Idea: generarla en Firefly como las papas
- [ ] Foto del burrito cerrado **doble tapa** (`burrito-cerrado-doble.avif`)
- [ ] Foto del burrito cerrado con **tortilla de maíz** (`burrito-cerrado-maiz.avif`; hoy se simula con un tono más amarillo)
- [ ] Combos: ¿cuáles? (ej. burrito + bebida + nachos)
- [ ] ¿Hay retiro en el local además de delivery?
- [ ] Zonas de envío y costos
- [ ] Horarios
- [ ] ¿Cuánto tiempo se espera una transferencia antes de cancelar?

## Pagos
- [ ] ¿Cuenta de Mercado Pago a nombre de quién? (credenciales de producción)
- [ ] ¿Stripe se va a usar realmente? ¿Hay o habrá empresa en el exterior?
- [ ] ¿La transferencia es al alias de MP o a un banco? Cargar **alias, CVU y titular** en `config_negocio` (hoy vacíos: el seguimiento dice "te pasamos el alias por WhatsApp")
- [ ] **Número de WhatsApp** del local en `config_negocio.whatsapp` (hoy `[A CONFIRMAR]`: los botones de WhatsApp no aparecen)
- [ ] Claves del servidor: `SUPABASE_SECRET_KEY`, `MP_ACCESS_TOKEN` (prueba) y después `MP_WEBHOOK_SECRET` (ver `.env.example`)

## Contenido con IA (Fase 8, secundaria) → [[Planes/Fase 8 - Contenido visual con IA]]
- [ ] ¿Se crea la cuenta de Higgsfield? Presupuesto aprox. US$10–15
- [ ] Las 7 fotos del proceso (plancha → tortilla → carne → vegetales → armado → enrollado → plato con papas)
- [ ] Fotos del burrito cerrado en plato, simple y doble (para la realidad aumentada)
- [ ] ¿El paseo va en página propia `/como-lo-hacemos` (recomendado) o como sección de la home?

## Imágenes
- [x] Renders 3D en `.avif` (los hace Max)
- [ ] Render del burrito enrollado simple y doble + papas (hoy es una ilustración provisoria)

## Técnico
- [ ] Dominio
- [ ] ¿Notificar al cliente por WhatsApp automáticamente? (API de WhatsApp Business = costo)
