---
tags: [burritos, decisiones]
---
# Registro de decisiones

Formato: fecha · decisión · por qué · alternativas descartadas.

### 2026-10-28 · Mercado Pago principal, Stripe detrás de interruptor
Stripe no abre cuentas de negocios en Argentina; MP es más barato y conocido para clientes locales. Stripe queda listo pero apagado. Descartado: Stripe como principal.

### 2026-10-28 · Monorepo con admin como app separada
El admin tiene que estar totalmente separado y seguro. Comparten solo `packages/shared` (tipos y precios). Descartado: ruta `/admin` dentro de la tienda.

### 2026-10-28 · Precio calculado solo en servidor
Evita pedidos manipulados. La misma función se usa en el cliente solo para mostrar.

### 2026-10-28 · Armador primero en 2D, después 3D
El 2D es el fallback obligatorio y permite probar toda la lógica sin esperar los modelos.

### 2026-10-28 · Email opcional, teléfono obligatorio
El contacto real es por WhatsApp/teléfono.

### 2026-10-28 · Límites de ingredientes en la base
Así el dueño los cambia desde el admin sin tocar código.

### 2026-10-28 · Supabase de desarrollo en la nube, sin Docker
La base local de Supabase necesita Docker, y en Windows eso pide WSL y reinicio. Usamos un proyecto gratis de desarrollo (`burritos-dev`, São Paulo) y aplicamos migraciones con el MCP de Supabase. Las migraciones igual viven en `supabase/migrations/`. Descartado por ahora: Docker + `supabase start`.

### 2026-10-28 · shadcn con Base UI
Es la opción recomendada actual del CLI de shadcn (preset `nova`). Descartado: Radix (el propio shadcn ofrece migrar de Radix a Base).

### 2026-10-28 · TypeScript 6, no 7
`@astrojs/check` todavía no soporta TypeScript 7. Volver a mirar cuando lo soporte.

### 2026-10-28 · Validación del armado separada del precio
`validarArmado` (en `shared/armador/schema.ts`) devuelve todos los errores juntos; `pricing.ts` la usa y tira `PedidoInvalidoError`. El pedido que manda el cliente no tiene campos de precio: Zod los descarta.

### 2026-10-28 · `config_negocio` es de lectura pública y no guarda secretos
El asesor de Supabase marcó la vista `config_publica` con permisos de su creador (security definer) como error. Todo lo que hay en `config_negocio` se le muestra al cliente (alias, CVU, WhatsApp), así que la tabla tiene una política de lectura pública y la vista corre con los permisos del que consulta (`security_invoker`). **Las claves y tokens van siempre en variables de entorno, nunca en esta tabla.**

### 2026-10-28 · `ver_pedido` pública a propósito
Es una función con permisos de su creador que el asesor marca como aviso. Es intencional: solo devuelve datos con el id y el token de 36 caracteres hex. Solo la puede llamar `anon` (la tienda).

### 2026-10-29 · El "3D" son renders `.avif`, sin WebGL
El armador apila los renders 3D de Max (íconos `.avif` livianos) sobre la tortilla. Carga rápido y anda en cualquier celular. Descartado: React Three Fiber (5–10× más pesado, va a saltos en celulares baratos) y modelos `.glb` (no existen). Ver [[superpowers/specs/2026-10-28-armador-hero-design|diseño]].

### 2026-10-29 · Opciones en grilla, no en carrusel
Pedido de Max. La grilla muestra todo de un vistazo, no hay que descubrir que se desliza y cada tarjeta es un botón grande y quieto: mejor para gente mayor. Cuando el escenario sale de la pantalla, una franja arriba muestra el plato en miniatura, "Relleno X/N" y el precio, para que cada toque se vea. Descartado: carrusel con perspectiva (del diseño de Claude Design).

### 2026-10-29 · Mis combos y carrito en el celular, sin cuenta
`localStorage` con try/catch (máx. 10 combos). Al cargar, todo se valida contra el catálogo actual y se avisa qué ingrediente ya no está. Los precios se recalculan siempre; nunca se guardan.

### 2026-10-29 · Catálogo de ejemplo rearmado en `burritos-dev`
La base de desarrollo no tenía pedidos: se vació el catálogo viejo (tapa/proteína/relleno/agregado) y se cargó el nuevo con `seed.sql`. Imágenes con nombre = `slug` del ingrediente; si falta el `.avif`, se usa el `.svg` provisorio.

### 2026-10-30 · Admin: sesión httpOnly, MFA también en la base, tablero por consulta
- La sesión del admin vive en cookies **httpOnly** (`@supabase/ssr` 0.12.7 en el servidor): el JavaScript del navegador nunca ve el token. Por eso el tablero no usa Realtime en el navegador: **consulta cada 8 s** a su propio servidor (suficiente para una cocina, más simple y sin exponer el token). Si hace falta instantáneo, se suma Realtime desde el servidor.
- `es_admin()` ahora exige rol admin **y** sesión con MFA (`aal2`). Una contraseña filtrada no alcanza ni llamando a la API directo.
- Estados y pagos se cambian solo con `cambiar_estado_pedido` y `marcar_pagado` (validan transiciones, motivo al cancelar, "en camino" solo delivery, Mercado Pago solo por webhook) y registran historial con usuario.
- Horarios: `config_negocio.modo_apertura` (automatico/abierto/cerrado) + `horarios` por día; la cuenta "¿abierto ahora?" está en `packages/shared/horarios.ts` con hora de Argentina y se usa en la tienda y en el endpoint de pedidos. El negocio quedó en "abierto" a mano hasta que se carguen los horarios reales.

### 2026-10-30 · Transferencia: alias y monto para copiar, y Mercado Pago como camino "automático"
- Mercado Pago **no tiene un link oficial** para abrir "Transferir" con el alias puesto. Lo más parecido y mejor es el botón **Mercado Pago (Checkout Pro)**: abre la app con el monto y el destinatario cargados, se paga con saldo, tarjeta o cuotas, y el pedido pasa a "pagado" solo por webhook (sin comprobante). Ya está programado; se prende con `MP_ACCESS_TOKEN` y `MP_WEBHOOK_SECRET` en Vercel.
- Transferencia común: la pantalla de "¡Listo!" ya no salta sola a WhatsApp; muestra **Monto / Alias / CVU con "Copiar"** y "Abrir Mercado Pago", y después "Mandar el pedido por WhatsApp". Se activa cuando se cargue el alias en `config_negocio`.

### 2026-10-30 · "Ver en mi mesa" en 3D real
`<model-viewer>` con AR nativo; se activa sola cuando existen `public/modelos/burrito.glb` y `.usdz`. Ver [[Planes/Fase 8 - Contenido visual con IA]].

### 2026-10-30 · Metadatos, vista previa al compartir y Google
- Marca en un solo lugar (`lib/marca.ts`): nombre provisorio **Burrimax**, frase, descripción, ciudad, redes, dominio. `Base.astro` arma título, descripción, canónica, Open Graph + Twitter (lo que muestra WhatsApp al compartir el link), íconos y manifest.
- `public/og.png` 1200×630 (~260 KB, por debajo del límite de 300 KB que se recomienda para WhatsApp): el plato armado con los ingredientes reales de la tienda, nombre, "Armá tu burrito a tu gusto" y papas. Se generó con Edge en modo sin ventana desde un HTML (no hay librería de imágenes en el repo).
- Google: ficha `Restaurant` (schema.org) en la portada, `robots.txt` y `sitemap.xml` generados desde la marca; checkout y seguimiento con `noindex`.

### 2026-10-30 · Si la web no puede guardar el pedido, igual sale por WhatsApp
Mientras falte `SUPABASE_SECRET_KEY` en Vercel, `POST /api/pedidos` responde 503. Con efectivo o transferencia, el checkout manda igual el pedido por WhatsApp (sin número ni link de seguimiento), así se puede vender desde ya. Con la clave cargada vuelve el flujo completo (pedido guardado + número + seguimiento).

### 2026-10-30 · Versión para computadora (desde 1024px)
Mobile first, pero ahora en PC se aprovecha el ancho (`max-w-6xl`): hero en dos columnas (título/foto/botones | armador de muestra), combos en 3–4 columnas, y el armador con el **plato grande a la izquierda** y tamaño + pasos + carrusel + "Siguiente" a la derecha (la barra deja de ser fija y va dentro de la columna). En el celular el orden se mantiene con `display: contents` + `order`. El carrusel suma **flechas** cuando hay mouse (`pointer: fine`), porque no se puede deslizar con el dedo. Checkout y seguimiento siguen en una columna angosta (formularios).

### 2026-10-30 · URL y clave publicable de Supabase con valor por defecto
En Vercel la tienda mostraba "No pudimos cargar el menú": en Astro las `PUBLIC_*` se graban al compilar y no estaban cargadas. Como la URL y la clave **publicable** no son secretas, `lib/supabasePublico.ts` las tiene por defecto (las variables, si existen, mandan). La clave secreta sigue solo en variables del servidor.

### 2026-10-30 · Animaciones que responden a lo que tocás + armador que nunca se pisa
- **Animaciones** (solo como respuesta a un toque, nunca solas): la tarjeta elegida se aplasta y vuelve, aparece el tilde verde, el plato se hunde apenas cuando le cae algo, laten el contador de relleno, el precio del encabezado y el paso actual, el paso nuevo entra desde el lado hacia donde vas y "Siguiente" da un saltito cuando se habilita. Hook `lib/useLatido.ts`; keyframes en `global.css`. Todas se apagan con `prefers-reduced-motion`.
- **Nada pisa la barra de abajo**: la barra publica su alto real (`--alto-barra`) y el armador ocupa `100dvh - barra`. El plato es lo único elástico (cuadrado del lado más corto, con container queries); el carrusel se dimensiona también por alto (`22dvh`). En pantallas bajas (≤720px) se ocultan el subtítulo del paso y el rótulo "Armá tu burrito", y la foto de la tarjeta es más chica. Probado a 375×667 y 375×812.

### 2026-10-30 · Pedido por WhatsApp con pantalla de "¡Listo!"
Con efectivo o transferencia, el botón final es **"Enviar pedido por WhatsApp"** (verde). Primero el pedido se guarda igual por `POST /api/pedidos` (el precio lo sigue calculando el servidor); después aparece un tilde grande con el número de pedido y a los 1,8 s se abre WhatsApp (`wa.me`) con el mensaje ya escrito: detalle de cada burrito, entrega, pago, total y link de seguimiento. Si el salto no anda, hay botón "Abrir WhatsApp". Mercado Pago sigue yendo a pagar. Texto en `lib/mensajeWhatsapp.ts` (con test).

### 2026-10-30 · Carrusel coverflow aunque el celular tenga "reducir movimiento"
La tarjeta del centro se agranda y las de los costados se achican y se desenfocan. Tamaño y desenfoque siguen al dedo (no es una animación), así que se aplican siempre; con `prefers-reduced-motion` solo se saca el giro en perspectiva. Antes con esa opción no se veía nada del efecto (Windows con animaciones apagadas la activa).

### 2026-10-30 · Armador en una pantalla, con carrusel
Pedido de Max (vuelve al carrusel de los bocetos; reemplaza la decisión de la grilla). Al entrar a armar, todo entra en 100dvh en el celular: encabezado con el pedido (plato en miniatura, relleno, salsas, precio; la flecha vuelve a los combos), "Armá tu burrito" + Simple/Doble **solo hasta que elegís** (vuelve con "Atrás" desde el paso 1), el plato sin tarjeta con los carteles de relleno y papas (más grande cuando ya elegiste el tamaño), la línea de pasos y el carrusel. La barra de abajo tiene alto fijo.

### 2026-10-30 · "Tu burrito" primero en los combos de la casa
Pedido de Max: el último burrito que la persona terminó de armar (al llegar a "¡Listo!", al agregarlo o al guardarlo) se guarda en el celular (`lib/ultimoBurrito.ts`) y va primero en la grilla, marcado en verde; después los recomendados. Reemplaza la sección fija "Tus combos", que ahora se abre con un botón. Abrir un combo de la casa con "Cambiarle algo" no lo convierte en "tuyo" hasta que lo agregues o lo guardes.

### 2026-10-29 · Pedidos por la función `crear_pedido` y Mercado Pago solo con credenciales
`POST /api/pedidos` valida con `pedidoSchema`, recalcula con `calcularPedido` y guarda todo (pedido, ítems con snapshots, ingredientes con porciones e historial) en una sola transacción con la función `crear_pedido`, que solo puede ejecutar el servidor con la clave secreta. Mercado Pago aparece en el checkout solo si está prendido en `config_negocio` **y** el servidor tiene `MP_ACCESS_TOKEN`. El webhook marca un evento como procesado recién después de actualizar el pedido (si falla, responde 500 y Mercado Pago reintenta). Descartado: react-hook-form (el formulario es chico; alcanza con estado + Zod).

### 2026-10-29 · Home con el armador opcional y los combos de la casa abajo
Pedido de Max: no obligar a armar. El hero invita ("Armar el mío") y el armador se abre en el mismo lugar; abajo van los combos propios guardados (fijados arriba) y los combos de la casa con papas, que se pueden agregar directo o abrir en el armador para cambiarles algo. Los combos de la casa se arman desde `productos` + `producto_ingredientes` y se ocultan si su receta deja de ser válida.

### 2026-10-29 · Salsas sin TACC: todas "no confirmado" hasta que Max diga
Por seguridad de celíacos, `sin_tacc = false` en las 14 salsas hasta tener la lista. Nunca marcar algo como sin TACC sin confirmación.

### 2026-10-29 · Final con foto del burrito cerrado + papas, y "Verlo en mi mesa" con la cámara
Cualquier combinación termina cerrada y con papas, así que el paso "¡Listo!" usa una foto fija (`burrito-cerrado*.avif` + `papas.avif`). Busca primero la versión de doble/maíz y si no existe usa la base. "Verlo en mi mesa" abre la cámara y pone esa foto encima (se mueve y se agranda, y saca foto para compartir). No queda anclado a la mesa: eso necesita el modelo 3D (ver [[Planes/Fase 8 - Contenido visual con IA]]).

### 2026-10-29 · Salsas como manchas untadas
En el escenario cada salsa es una mancha de su color, con borde irregular y brillo, debajo de carnes y vegetales (pedido de Max: más realista, sin borde negro).

### 2026-10-28 · El `precio_extra` de la tapa se cobra una vez, también en la doble
Regla de ejemplo hasta que se confirme (ver [[10 Preguntas abiertas]]).

### 2026-10-30 · Avisos push al celular del admin
Web Push estándar (VAPID): el panel registra `sw.js` y guarda la suscripción en `push_suscripciones` (RLS: solo las del admin con MFA). La tienda, al crear un pedido, manda el aviso con `web-push` 3.6.7 (máx. 4 s, nunca frena el pedido; borra suscripciones vencidas). La clave pública está en el código; la **privada (`VAPID_PRIVATE_KEY`) solo en variables del servidor de la tienda**. En iPhone (iOS 16.4+) los avisos solo funcionan con el panel instalado en la pantalla de inicio (manifest propio del admin).

### 2026-10-30 · Después de pedir: a WhatsApp solo y "Instalar la app"
La pantalla de "¡Listo!" salta sola a WhatsApp con cuenta regresiva (3 s; 8 s con transferencia para copiar el alias, y copiar suma tiempo). Mientras, ofrece instalar la tienda: botón con el evento `beforeinstallprompt` (guardado en `Base.astro`), o instrucciones para iPhone (Compartir → Agregar a inicio) y Android (⋮ → Agregar a la pantalla principal). Si toca instalar, la cuenta se pausa.

### 2026-10-30 · Pantalla de Pagos en el admin, con un solo schema para pantalla y servidor
- Los medios de pago y los datos de transferencia se editan en `/pagos`, no en un "Configuración" genérico: Horarios ya es otra pantalla y cada una se entiende en 3 segundos.
- `packages/shared/src/configNegocio.ts` valida el formulario y `POST /api/config/pagos`: alias de 6 a 20 caracteres (letras sin ñ ni tildes, números, `.` y `-`), CVU de 22 números, titular de 2 letras o más, vacío = no cargado, y al menos un medio de pago prendido.
- Los **dígitos verificadores del CVU solo avisan, no rechazan**: no pudimos confirmar con el texto oficial del BCRA que todos los CVU de billeteras cierren con la cuenta del CBU, y bloquear una cuenta válida deja sin cobrar por transferencia.
- Mercado Pago se puede prender, pero la tienda lo ofrece solo si además existe `MP_ACCESS_TOKEN` en el servidor (la pantalla lo avisa). Solo se guardan datos públicos: **nunca claves** (la tabla es de lectura pública).
- Sin migración: las columnas ya existían y la tienda ya leía alias, CVU, titular y medios activos de `config_publica`.
- Descartado: editar desde acá el WhatsApp (ya está confirmado y un error rompe el envío de pedidos) y `pago_stripe_activo` (sigue detrás de su propio interruptor).
