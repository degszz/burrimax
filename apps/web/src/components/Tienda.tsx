import { contarRelleno, validarArmado, type Armado, type Catalogo, type TamanoCatalogo } from '@burritos/shared';
import { useEffect, useMemo, useState } from 'react';
import { BarraPasos } from './armador/BarraPasos';
import { BarraSiguiente } from './armador/BarraSiguiente';
import { Carrusel } from './armador/Carrusel';
import { DialogoCambioTamano } from './armador/DialogoCambioTamano';
import { Escenario } from './armador/Escenario';
import { PasoListo } from './armador/PasoListo';
import { SelectorTamano } from './armador/SelectorTamano';
import { TarjetaIngrediente } from './armador/TarjetaIngrediente';
import { Encabezado } from './tienda/Encabezado';
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
import * as misCombos from '@/lib/misCombos';
import { precioVistaPrevia } from '@burritos/shared';
import { armadoActual, useArmador } from '@/stores/armador';
import { useCarrito } from '@/stores/carrito';

interface Props {
  catalogo: Catalogo;
  abierto: boolean;
}

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

export default function Tienda({ catalogo, abierto }: Props) {
  const estado = useArmador();
  const carrito = useCarrito();
  const [listo, setListo] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [destino, setDestino] = useState<TamanoCatalogo | null>(null);
  const [combos, setCombos] = useState<misCombos.ComboGuardado[]>([]);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const primerTamano = catalogo.tamanos[0]!;

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
      setListo(true);
    });
  }, []);

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

  // Hasta dónde se puede saltar con la barra de pasos: el primer paso que bloquea.
  const alcanzable = (() => {
    for (const p of [1, 2, 3, 4] as PasoDeCategoria[]) if (motivoBloqueo(p, armado, catalogo)) return p as Paso;
    return 5 as Paso;
  })();

  function subir() {
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function irAPaso(p: Paso) {
    estado.irAPaso(p);
    subir();
  }

  function elegirTamano(t: TamanoCatalogo) {
    if (t.id === armado.tamanoId) return;
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
    if (estado.editandoItemId) {
      carrito.reemplazar(estado.editandoItemId, armado, nombres);
      avisar('¡Listo! Guardamos los cambios.');
    } else {
      carrito.agregar(armado, nombres);
      avisar('¡Listo! Lo sumamos a tu pedido.');
    }
    estado.reset(armado.tamanoId);
    setCarritoAbierto(true);
  }

  function guardarEnCelular() {
    const combo = misCombos.guardar(armado, estado.nombre, nombresDe(armado, catalogo));
    if (!combo) {
      avisar('No pudimos guardarlo en este celular. Revisá que no estés en modo privado.');
      return;
    }
    setCombos(misCombos.listar());
    avisar(`Guardado como "${combo.nombre}" en Mis combos.`);
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
      subir();
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

  return (
    <div className={paso < 5 ? 'pb-40' : 'pb-6'}>
      <Encabezado abierto={abierto} cantidadEnCarrito={listo ? carrito.cantidadBurritos() : 0} onAbrirCarrito={() => setCarritoAbierto(true)} />

      <main className="mx-auto max-w-md space-y-4">
        <SelectorTamano tamanos={catalogo.tamanos} elegidoId={armado.tamanoId} onElegir={elegirTamano} />

        {paso < 5 ? (
          <>
            <Escenario armado={armado} catalogo={catalogo} />
            <BarraPasos actual={paso} alcanzable={alcanzable} onIr={irAPaso} />
            <PasoActual
              paso={paso as PasoDeCategoria}
              armado={armado}
              catalogo={catalogo}
              tamano={tamano}
              ingredientes={ingredientesPorPaso[paso as PasoDeCategoria]}
            />
          </>
        ) : (
          <>
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
          </>
        )}

        <MisCombos
          combos={combos}
          catalogo={catalogo}
          onPedir={pedirDeNuevo}
          onEditar={(combo) => {
            cargarCombo(combo);
            subir();
          }}
          onBorrar={borrarCombo}
          onVolverArriba={subir}
        />
      </main>

      {paso < 5 && (
        <BarraSiguiente
          precio={precio}
          motivo={motivo}
          mensajeOk={mensajeOk}
          puedeVolver={paso > 1}
          onSiguiente={() => irAPaso((paso + 1) as Paso)}
          onAnterior={() => irAPaso((paso - 1) as Paso)}
        />
      )}

      <PanelCarrito
        abierto={carritoAbierto}
        catalogo={catalogo}
        onCerrar={() => setCarritoAbierto(false)}
        onEditar={(item) => {
          estado.cargar(item.armado, item.id);
          setCarritoAbierto(false);
          subir();
        }}
        onArmarOtro={() => {
          estado.reset(armado.tamanoId);
          setCarritoAbierto(false);
          subir();
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

  const subtitulo =
    paso === 1 ? (
      <>
        Tocá una para elegirla · <b>elegí 1</b>
      </>
    ) : paso === 3 ? (
      <>
        Van <b>{tamano.minimos.carne} porciones</b> · podés repetir la misma
      </>
    ) : (
      <>
        Hasta <b>{maximo}</b> · son opcionales
      </>
    );

  const pista = lleno ? (porciones ? 'Podés repetir la misma' : 'Sacá uno para cambiarlo') : 'Deslizá para ver más';

  return (
    <section aria-labelledby="titulo-paso" className="animate-aparecer" key={paso}>
      <div className="px-4">
        <h1 id="titulo-paso" className="text-4xl font-extrabold">
          {TITULOS[paso]}
        </h1>
        {lleno ? (
          <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-verde-claro px-3 py-0.5 font-bold text-verde">
            ✓ Llegaste al máximo ({elegidos}/{maximo})
          </p>
        ) : (
          <p className="mt-1 text-lg text-tinta-suave">{subtitulo}</p>
        )}
      </div>
      <Carrusel
        items={ingredientes}
        clave={(i) => i.id}
        etiqueta={TITULOS[paso]}
        pista={pista}
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
