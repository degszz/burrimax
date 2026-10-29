import type { Armado, Catalogo, CategoriaSlug } from '@burritos/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { almacenSeguro } from '../lib/almacenLocal';
import { puedeAgregar, type Paso } from '../lib/armador/reglas';

// El burrito que se está armando. Se guarda en el celular para no perderlo si
// se cierra la pestaña. Las acciones que agregan reciben el catálogo para
// respetar los límites del tamaño.

type Seleccion = Armado['seleccion'];

const SELECCION_VACIA: Seleccion = { tortilla: [], salsa: [], carne: [], vegetal: [] };

interface EstadoArmador {
  paso: Paso;
  tamanoId: string | null;
  seleccion: Seleccion;
  cantidad: number;
  nombre: string;
  /** Si se está editando un ítem del carrito, su id. */
  editandoItemId: string | null;

  elegirTamano: (tamanoId: string) => void;
  setSeleccion: (seleccion: Seleccion) => void;
  alternar: (categoria: CategoriaSlug, ingredienteId: string, catalogo: Catalogo) => void;
  sumarPorcion: (ingredienteId: string, catalogo: Catalogo) => void;
  restarPorcion: (ingredienteId: string) => void;
  irAPaso: (paso: Paso) => void;
  siguiente: () => void;
  anterior: () => void;
  setCantidad: (cantidad: number) => void;
  setNombre: (nombre: string) => void;
  cargar: (armado: Armado, editandoItemId?: string | null) => void;
  reset: (tamanoId: string | null) => void;
}

export const useArmador = create<EstadoArmador>()(
  persist(
    (set, get) => {
      const armado = () => armadoActual(get());

      return {
        paso: 1,
        tamanoId: null,
        seleccion: SELECCION_VACIA,
        cantidad: 1,
        nombre: '',
        editandoItemId: null,

        elegirTamano: (tamanoId) => set({ tamanoId }),
        setSeleccion: (seleccion) => set({ seleccion }),

        alternar: (categoria, ingredienteId, catalogo) => {
          const { seleccion } = get();
          const elegidos = seleccion[categoria];
          if (elegidos.includes(ingredienteId)) {
            set({ seleccion: { ...seleccion, [categoria]: elegidos.filter((id) => id !== ingredienteId) } });
            return;
          }
          if (categoria === 'tortilla') {
            set({ seleccion: { ...seleccion, tortilla: [ingredienteId] } });
            return;
          }
          const actual = armado();
          if (actual && puedeAgregar(actual, categoria, catalogo)) {
            set({ seleccion: { ...seleccion, [categoria]: [...elegidos, ingredienteId] } });
          }
        },

        sumarPorcion: (ingredienteId, catalogo) => {
          const actual = armado();
          if (!actual || !puedeAgregar(actual, 'carne', catalogo)) return;
          const { seleccion } = get();
          set({ seleccion: { ...seleccion, carne: [...seleccion.carne, ingredienteId] } });
        },

        restarPorcion: (ingredienteId) => {
          const { seleccion } = get();
          const indice = seleccion.carne.lastIndexOf(ingredienteId);
          if (indice === -1) return;
          set({ seleccion: { ...seleccion, carne: seleccion.carne.filter((_, i) => i !== indice) } });
        },

        irAPaso: (paso) => set({ paso }),
        siguiente: () => set({ paso: Math.min(5, get().paso + 1) as Paso }),
        anterior: () => set({ paso: Math.max(1, get().paso - 1) as Paso }),
        setCantidad: (cantidad) => set({ cantidad: Math.min(20, Math.max(1, cantidad)) }),
        setNombre: (nombre) => set({ nombre: nombre.slice(0, 40) }),

        cargar: (armado, editandoItemId = null) =>
          set({
            tamanoId: armado.tamanoId,
            seleccion: { ...SELECCION_VACIA, ...armado.seleccion },
            cantidad: armado.cantidad,
            nombre: armado.nombrePersonalizado ?? '',
            editandoItemId,
            paso: 5,
          }),

        reset: (tamanoId) =>
          set({ paso: 1, tamanoId, seleccion: SELECCION_VACIA, cantidad: 1, nombre: '', editandoItemId: null }),
      };
    },
    {
      name: 'burritos:armador:v1',
      // Se rehidrata al montar la isla, para que el HTML del servidor coincida.
      skipHydration: true,
      storage: createJSONStorage(() => almacenSeguro),
      partialize: ({ paso, tamanoId, seleccion, cantidad, nombre, editandoItemId }) => ({
        paso,
        tamanoId,
        seleccion,
        cantidad,
        nombre,
        editandoItemId,
      }),
    },
  ),
);

/** El armado como lo entienden `shared` y el carrito, o `null` si todavía no hay tamaño. */
export function armadoActual(estado: Pick<EstadoArmador, 'tamanoId' | 'seleccion' | 'cantidad' | 'nombre'>): Armado | null {
  if (!estado.tamanoId) return null;
  const nombre = estado.nombre.trim();
  return {
    tamanoId: estado.tamanoId,
    seleccion: estado.seleccion,
    cantidad: estado.cantidad,
    ...(nombre ? { nombrePersonalizado: nombre } : {}),
  };
}
