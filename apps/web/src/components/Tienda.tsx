import { contarRelleno, validarArmado, type Armado, type Catalogo, type TamanoCatalogo } from '@burritos/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { BarraPasos } from './armador/BarraPasos';
import { BarraSiguiente } from './armador/BarraSiguiente';
import { Carrusel } from './armador/Carrusel';
import { DialogoCambioTamano } from './armador/DialogoCambioTamano';
import { Escenario } from './armador/Escenario';
import { PasoListo } from './armador/PasoListo';
import { ResumenFlotante } from './armador/ResumenFlotante';
import { SelectorTamano } from './armador/SelectorTamano';
import { TarjetaIngrediente } from './armador/TarjetaIngrediente';
import { CombosCasa } from './tienda/CombosCasa';
import { Encabezado } from './tienda/Encabezado';
import { HeroArmar } from './tienda/HeroArmar';
import { MisCombos } from './tienda/MisCombos';
import { PanelCarrito } from './tienda/PanelCarrito';
import {
  CATEGORIA_DEL_PASO,
  cuantas,
  excesoAlCambiar,
  limpiarContraCatalogo,
  motivoBloqueo,
  nombresDe,
  puedeAgregar,
  type Paso,
  type PasoDeCategoria,
} from '@/lib/armador/reglas';
import type { ComboCasa } from '@/lib/catalogo.server';
import * as misCombos from '@/lib/misCombos';
import { guardarUltimo, leerUltimo } from '@/lib/ultimoBurrito';
import { precioVistaPrevia } from '@burritos/shared';
import { armadoActual, useArmador } from '@/stores/armador';
import { useCarrito } from '@/stores/carrito';

interface Props {
  catalogo: Catalogo;
  combosCasa: ComboCasa[];
  abierto: boolean;
  /** Solo dígitos, o null si todavía no está cargado. */
  whatsapp: string | null;
}

// Ingredientes de la mini demostración del hero: alcanzan para llenar la zona
// (la primera fila y media se ve nítida, el resto queda desenfocado).
const SLUGS_DEMO = [
  'tortilla-trigo', 'guacamole', 'pollo',
  'vaca', 'choclo', 'tomate',
  'tortilla-maiz', 'cheddar', 'pescado',
  'lechuga', 'cebolla-morada', 'zanahoria',
  'barbacoa', 'morron', 'huevo',
];

interface Aviso {
  texto: string;
  accion?: { etiqueta: string; hacer: () => void };
}

const TITULOS: Record<PasoDeCategoria, string> = {
  1: 'Elegí tu tortilla',
  2: 'Elegí tus salsas',
  3: 'Elegí tu carne',
  4: 'Elegí tus vegetales',
};

export default function Tienda({ catalogo, combosCasa, abierto, whatsapp }: Props) {
  const estado = useArmador();
  const carrito = useCarrito();
  const [listo, setListo] = useState(false);
  // El armador arranca cerrado: la portada invita, y abajo están los combos.
  const [armadorAbierto, setArmadorAbierto] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [destino, setDestino] = useState<TamanoCatalogo | null>(null);
  const [combos, setCombos] = useState<misCombos.ComboGuardado[]>([]);
  const [guardadosAbiertos, setGuardadosAbiertos] = useState(false);
  // El último que la persona terminó de armar: va primero en los combos.
  const [tuBurrito, setTuBurrito] = useState<Armado | null>(null);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const escenario = useRef<HTMLDivElement>(null);
  const [escenarioALaVista, setEscenarioALaVista] = useState(true);

  const primerTamano = catalogo.tamanos[0]!;

  // Si el escenario sale de la pantalla mientras se elige, aparece el resumen flotante.
  useEffect(() => {
    const nodo = escenario.current;
    if (!nodo) return;
    const observador = new IntersectionObserver(([entrada]) => setEscenarioALaVista(entrada!.isIntersecting), {
      rootMargin: '-40% 0px 0px 0px',
    });
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [estado.paso === 5, armadorAbierto]);

  // Recupera lo guardado en el celular y lo pone al día con el menú actual.
  useEffect(() => {
    Promise.all([useArmador.persist.rehydrate(), useCarrito.persist.rehydrate()]).then(() => {
      const actual = armadoActual(useArmador.getState());
      if (!actual) {
        useArmador.getState().reset(primerTamano.id);
      } else {
        const { armado, quitados } = limpiarContraCatalogo(actual, catalogo);
        useArmador.setState({ tamanoId: armado.tamanoId, seleccion: armado.seleccion });
        if (quitados.length) avisar(`Ya no tenemos ${quitados.join(', ')}: lo sacamos de tu burrito.`);
      }
      const quitadosCarrito = useCarrito.getState().actualizarConCatalogo(catalogo);
      if (quitadosCarrito.length) avisar(`Ya no tenemos ${quitadosCarrito.join(', ')}: lo sacamos de tu pedido.`);
      setCombos(misCombos.listar());
      setTuBurrito(leerUltimo(catalogo));
      setListo(true);
    });
  }, []);

  function recordarTuyo(a: Armado) {
    if (validarArmado(a, catalogo).length) return;
    guardarUltimo(a);
    setTuBurrito({ ...a, cantidad: 1 });
  }

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), aviso.accion ? 6000 : 4000);
    return () => clearTimeout(t);
  }, [aviso]);

  function avisar(texto: string, accion?: Aviso['accion']) {
    setAviso({ texto, accion });
  }

  const armado: Armado = armadoActual(estado) ?? {
    tamanoId: primerTamano.id,
    seleccion: estado.seleccion,
    cantidad: estado.cantidad,
  };
  const tamano = catalogo.tamanos.find((t) => t.id === armado.tamanoId) ?? primerTamano;
  const paso = estado.paso;
  const precio = precioVistaPrevia(armado, catalogo);

  const ingredientesPorPaso = useMemo(() => {
    const porPaso = {} as Record<PasoDeCategoria, Catalogo['ingredientes']>;
    for (const p of [1, 2, 3, 4] as PasoDeCategoria[]) {
      porPaso[p] = catalogo.ingredientes.filter((i) => i.categoria === CATEGORIA_DEL_PASO[p]);
    }
    return porPaso;
  }, [catalogo]);

  const ingredientesDemo = useMemo(() => {
    const elegidos = SLUGS_DEMO.map((s) => catalogo.ingredientes.find((i) => i.slug === s)).filter((i) => !!i);
    return elegidos.length >= 9 ? elegidos : catalogo.ingredientes.slice(0, SLUGS_DEMO.length);
  }, [catalogo]);

  // Hasta dónde se puede saltar con la barra de pasos: el primer paso que bloquea.
  const alcanzable = (() => {
    for (const p of [1, 2, 3, 4] as PasoDeCategoria[]) if (motivoBloqueo(p, armado, catalogo)) return p as Paso;
    return 5 as Paso;
  })();

  function subir() {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function abrirArmador() {
    setArmadorAbierto(true);
    subir();
  }

  // Hay algo elegido (o se está editando): vale la pena ofrecer "Borrar".
  const enCurso =
    estado.seleccion.tortilla.length + estado.seleccion.salsa.length + estado.seleccion.carne.length + estado.seleccion.vegetal.length >
      0 || !!estado.editandoItemId;

  function borrarArmado() {
    const previo = useArmador.getState();
    const copia = {
      paso: previo.paso,
      tamanoId: previo.tamanoId,
      seleccion: previo.seleccion,
      cantidad: previo.cantidad,
      nombre: previo.nombre,
      editandoItemId: previo.editandoItemId,
    };
    estado.reset(armado.tamanoId);
    subir();
    avisar('Borramos tu burrito.', {
      etiqueta: 'Deshacer',
      hacer: () => {
        useArmador.setState(copia);
        setAviso(null);
      },
    });
  }

  function agregarComboCasa(armadoCombo: Armado, nombre: string) {
    carrito.agregar({ ...armadoCombo, nombrePersonalizado: nombre }, nombresDe(armadoCombo, catalogo));
    avisar(`Sumamos "${nombre}" a tu pedido.`, {
      etiqueta: 'Ver pedido',
      hacer: () => {
        setCarritoAbierto(true);
        setAviso(null);
      },
    });
  }

  function personalizarComboCasa(armadoCombo: Armado) {
    estado.cargar(armadoCombo);
    abrirArmador();
  }

  function irAPaso(p: Paso) {
    estado.irAPaso(p);
    subir();
  }

  function elegirTamano(t: TamanoCatalogo) {
    if (t.id === armado.tamanoId) {
      estado.setTamanoConfirmado(true);
      return;
    }
    if (excesoAlCambiar(armado, t).length) {
      setDestino(t);
      return;
    }
    estado.elegirTamano(t.id);
    const conNuevoTamano = { ...armado, tamanoId: t.id };
    if (paso === 5 && motivoBloqueo(3, conNuevoTamano, catalogo)) {
      estado.irAPaso(3);
      avisar(`Para la ${t.nombre.toLowerCase()} van ${t.minimos.carne} porciones de carne.`);
    }
  }

  function agregarAlPedido() {
    if (validarArmado(armado, catalogo).length) {
      avisar('A tu burrito le falta algo. Revisá los pasos.');
      return;
    }
    const nombres = nombresDe(armado, catalogo);
    recordarTuyo(armado);
    if (estado.editandoItemId) {
      carrito.reemplazar(estado.editandoItemId, armado, nombres);
      avisar('¡Listo! Guardamos los cambios.');
    } else {
      carrito.agregar(armado, nombres);
      avisar('¡Listo! Lo sumamos a tu pedido.');
    }
    estado.reset(armado.tamanoId);
    setArmadorAbierto(false);
    setCarritoAbierto(true);
  }

  function guardarEnCelular() {
    const combo = misCombos.guardar(armado, estado.nombre, nombresDe(armado, catalogo));
    if (!combo) {
      avisar('No pudimos guardarlo en este celular. Revisá que no estés en modo privado.');
      return;
    }
    setCombos(misCombos.listar());
    recordarTuyo({ ...armado, nombrePersonalizado: combo.nombre });
    avisar(`Guardado como "${combo.nombre}" en tus combos.`);
  }

  function cargarCombo(combo: misCombos.ComboGuardado, editandoItemId: string | null = null) {
    const { armado: limpio, quitados } = limpiarContraCatalogo(combo.armado, catalogo, combo.nombres);
    estado.cargar({ ...limpio, nombrePersonalizado: combo.nombre }, editandoItemId);
    if (quitados.length) avisar(`Ya no tenemos ${quitados.join(', ')}: lo sacamos.`);
    return { limpio, quitados };
  }

  function pedirDeNuevo(combo: misCombos.ComboGuardado) {
    const { armado: limpio, quitados } = limpiarContraCatalogo(combo.armado, catalogo, combo.nombres);
    const conNombre = { ...limpio, nombrePersonalizado: combo.nombre, cantidad: 1 };
    if (quitados.length || validarArmado(conNombre, catalogo).length) {
      // Algo cambió en el menú: que lo revise en el armador antes de sumarlo.
      cargarCombo(combo);
      estado.irAPaso(alcanzableDe(conNombre));
      abrirArmador();
      return;
    }
    carrito.agregar(conNombre, nombresDe(conNombre, catalogo));
    avisar(`Sumamos "${combo.nombre}" a tu pedido.`);
    setCarritoAbierto(true);
  }

  function alcanzableDe(a: Armado): Paso {
    for (const p of [1, 2, 3, 4] as PasoDeCategoria[]) if (motivoBloqueo(p, a, catalogo)) return p;
    return 5;
  }

  function borrarCombo(combo: misCombos.ComboGuardado) {
    misCombos.borrar(combo.id);
    setCombos(misCombos.listar());
    avisar(`Borramos "${combo.nombre}".`, {
      etiqueta: 'Deshacer',
      hacer: () => {
        misCombos.guardar(combo.armado, combo.nombre, combo.nombres);
        setCombos(misCombos.listar());
        setAviso(null);
      },
    });
  }

  const motivo = paso < 5 ? motivoBloqueo(paso as PasoDeCategoria, armado, catalogo) : null;
  const mensajeOk = paso < 5 && !motivo ? mensajeDelPaso(paso as PasoDeCategoria, armado, tamano) : null;

  const armando = armadorAbierto && paso < 5;

  return (
    <div className={armando ? 'pb-48' : 'pb-10'}>
      {/* Encabezado + portada = una pantalla justa */}
      {/* Armando: encabezado + armador ocupan justo la pantalla menos la barra de abajo */}
      <div
        className={cn(
          'mx-auto flex max-w-md flex-col',
          armando ? 'h-[calc(100dvh-var(--alto-barra,8.5rem))]' : !armadorAbierto && 'min-h-dvh',
        )}
      >
        {armadorAbierto ? (
          // Armando: el encabezado es el pedido en curso; la flecha vuelve a los combos.
          <ResumenFlotante visible encabezado armado={armado} catalogo={catalogo} onVer={() => setArmadorAbierto(false)} />
        ) : (
          <Encabezado abierto={abierto} cantidadEnCarrito={listo ? carrito.cantidadBurritos() : 0} onAbrirCarrito={() => setCarritoAbierto(true)} />
        )}
        {!armadorAbierto && (
          <HeroArmar
            className="flex-1"
            precioDesde={primerTamano.precioBase}
            enCurso={listo && enCurso}
            demo={ingredientesDemo}
            whatsapp={whatsapp}
            onArmar={abrirArmador}
          />
        )}
        {armando && (
          // El plato es lo único elástico: se achica para que el carrusel nunca pise la barra.
          <section id="armador" aria-label="Armá tu burrito" className="flex min-h-0 flex-1 flex-col gap-2 pt-1 pb-1">
            {/* Simple o doble: se elige una vez y desaparece; vuelve con "Atrás" desde el paso 1 */}
            {!estado.tamanoConfirmado && (
              <div className="shrink-0 space-y-1.5">
                <p className="px-4 font-heading text-xl font-extrabold [@media(max-height:720px)]:sr-only">Armá tu burrito</p>
                <SelectorTamano tamanos={catalogo.tamanos} elegidoId={armado.tamanoId} onElegir={elegirTamano} />
              </div>
            )}
            <div ref={escenario} className="flex min-h-0 flex-1 flex-col">
              <Escenario armado={armado} catalogo={catalogo} />
            </div>
            <div className="shrink-0">
              <BarraPasos actual={paso} alcanzable={alcanzable} onIr={irAPaso} />
            </div>
            <div className="shrink-0">
              <PasoActual
                paso={paso as PasoDeCategoria}
                armado={armado}
                catalogo={catalogo}
                tamano={tamano}
                ingredientes={ingredientesPorPaso[paso as PasoDeCategoria]}
              />
            </div>
          </section>
        )}
      </div>

      <main className="mx-auto max-w-md space-y-4">
        {armadorAbierto && paso === 5 && (
          <section id="armador" aria-label="Tu burrito está listo" className="space-y-2 pt-1">
            <BarraPasos actual={5} alcanzable={5} onIr={irAPaso} />
            <PasoListo
              armado={armado}
              catalogo={catalogo}
              nombre={estado.nombre}
              editando={!!estado.editandoItemId}
              onCambiar={(p) => irAPaso(p)}
              onCantidad={estado.setCantidad}
              onNombre={estado.setNombre}
              onAgregar={agregarAlPedido}
              onGuardar={guardarEnCelular}
            />
            <button
              type="button"
              onClick={borrarArmado}
              className="mx-auto -mt-4 flex min-h-11 items-center px-3 text-base font-semibold text-tinta-suave underline underline-offset-4"
            >
              Borrar y empezar de nuevo
            </button>
          </section>
        )}

        {/* Tu último burrito va primero en la grilla; los guardados, a un toque */}
        <CombosCasa
          combos={combosCasa}
          catalogo={catalogo}
          tuBurrito={listo ? tuBurrito : null}
          guardados={combos.length}
          guardadosAbiertos={guardadosAbiertos}
          onAgregar={agregarComboCasa}
          onPersonalizar={personalizarComboCasa}
          onVerGuardados={() => setGuardadosAbiertos((v) => !v)}
        />

        {guardadosAbiertos && (
          <MisCombos
            combos={combos}
            catalogo={catalogo}
            onPedir={pedirDeNuevo}
            onEditar={(combo) => {
              cargarCombo(combo);
              abrirArmador();
            }}
            onBorrar={borrarCombo}
          />
        )}
      </main>

      {armando && (
        <BarraSiguiente
          precio={precio}
          motivo={motivo}
          mensajeOk={mensajeOk}
          puedeVolver={paso > 1 || estado.tamanoConfirmado}
          puedeBorrar={enCurso}
          onSiguiente={() => {
            // Terminó de armarlo: pasa a ser "Tu burrito" en los combos.
            if (paso === 4) recordarTuyo(armado);
            // Avanzar sin tocar simple/doble cuenta como elegido.
            if (!estado.tamanoConfirmado) estado.setTamanoConfirmado(true);
            irAPaso((paso + 1) as Paso);
          }}
          onAnterior={() => {
            // Desde el primer paso, "Atrás" vuelve a mostrar simple o doble.
            if (paso === 1) estado.setTamanoConfirmado(false);
            else irAPaso((paso - 1) as Paso);
          }}
          onBorrar={borrarArmado}
        />
      )}

      <PanelCarrito
        abierto={carritoAbierto}
        catalogo={catalogo}
        onCerrar={() => setCarritoAbierto(false)}
        onEditar={(item) => {
          estado.cargar(item.armado, item.id);
          setCarritoAbierto(false);
          abrirArmador();
        }}
        onArmarOtro={() => {
          estado.reset(armado.tamanoId);
          setCarritoAbierto(false);
          abrirArmador();
        }}
      />

      <DialogoCambioTamano
        armado={armado}
        destino={destino}
        catalogo={catalogo}
        onCancelar={() => setDestino(null)}
        onConfirmar={(seleccion) => {
          estado.elegirTamano(destino!.id);
          estado.setSeleccion(seleccion);
          setDestino(null);
        }}
      />

      {aviso && (
        <div
          role="status"
          className="animate-aparecer fixed inset-x-4 top-4 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-2xl border-[2.5px] border-tinta bg-tinta px-4 py-3 font-bold text-white shadow-[0_4px_0_rgba(0,0,0,.25)]"
        >
          <span className="flex-1">{aviso.texto}</span>
          {aviso.accion && (
            <button type="button" onClick={aviso.accion.hacer} className="min-h-11 rounded-xl bg-amarillo px-3 font-extrabold text-tinta">
              {aviso.accion.etiqueta}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function mensajeDelPaso(paso: PasoDeCategoria, armado: Armado, tamano: TamanoCatalogo): string | null {
  if (paso === 1) return '¡Buena elección! Ahora, las salsas';
  if (paso === 2) return armado.seleccion.salsa.length ? '¡Rico! Ahora, la carne' : 'Las salsas son opcionales';
  if (paso === 3) return '¡Carne lista! Ahora, los vegetales';
  return contarRelleno(armado) >= tamano.maximos.carne + tamano.maximos.vegetal || armado.seleccion.vegetal.length
    ? '¡Todo listo! Mirá cómo quedó'
    : 'Los vegetales son opcionales';
}

interface PasoActualProps {
  paso: PasoDeCategoria;
  armado: Armado;
  catalogo: Catalogo;
  tamano: TamanoCatalogo;
  ingredientes: Catalogo['ingredientes'];
}

function PasoActual({ paso, armado, catalogo, tamano, ingredientes }: PasoActualProps) {
  const { alternar, sumarPorcion, restarPorcion } = useArmador();
  const categoria = CATEGORIA_DEL_PASO[paso];
  const elegidos = cuantas(armado, categoria);
  const maximo = tamano.maximos[categoria];
  const lleno = categoria !== 'tortilla' && elegidos >= maximo;
  const porciones = catalogo.categorias[categoria].permiteRepetir;

  // El paso nuevo entra desde el lado hacia donde vas (adelante: derecha).
  const pasoAnterior = useRef(paso);
  const haciaAtras = paso < pasoAnterior.current;
  useEffect(() => {
    pasoAnterior.current = paso;
  }, [paso]);

  // El subtítulo dice siempre cuánto llevás y cuánto entra.
  const subtitulo =
    paso === 1 ? (
      <>
        Tocá la que quieras · <b>elegí 1</b>
      </>
    ) : paso === 3 ? (
      <>
        Llevás <b>{elegidos} de {tamano.minimos.carne} porciones</b> · podés repetir la misma
      </>
    ) : (
      <>
        Elegiste <b>{elegidos} de {maximo}</b> · son opcionales
      </>
    );

  return (
    <section aria-labelledby="titulo-paso" className={haciaAtras ? 'animate-entrar-izq' : 'animate-entrar-der'} key={paso}>
      <div className="px-4">
        <h1 id="titulo-paso" className="text-2xl font-extrabold">
          {TITULOS[paso]}
        </h1>
        {lleno ? (
          <p className="mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-verde-claro px-3 py-0.5 text-sm font-bold text-verde">
            ✓ Llegaste al máximo ({elegidos}/{maximo}){porciones ? '' : ' · tocá uno para cambiarlo'}
          </p>
        ) : (
          <p className="text-base text-tinta-suave [@media(max-height:720px)]:hidden">{subtitulo}</p>
        )}
      </div>
      <Carrusel
        items={ingredientes}
        clave={(i) => i.id}
        etiqueta={TITULOS[paso]}
        pista={lleno ? (porciones ? 'Podés repetir la misma' : 'Sacá uno para cambiarlo') : 'Deslizá para ver más'}
        render={(ingrediente) => {
          const cantidad = cuantas(armado, categoria, ingrediente.id);
          return (
            <TarjetaIngrediente
              ingrediente={ingrediente}
              cantidad={cantidad}
              apagada={lleno && cantidad === 0}
              porciones={porciones}
              puedeSumar={puedeAgregar(armado, categoria, catalogo)}
              prioridad={paso === 1}
              onTocar={() => alternar(categoria, ingrediente.id, catalogo)}
              onSumar={() => sumarPorcion(ingrediente.id, catalogo)}
              onRestar={() => restarPorcion(ingrediente.id)}
            />
          );
        }}
      />
    </section>
  );
}
