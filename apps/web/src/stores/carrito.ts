import { CANTIDAD_MAXIMA_POR_ITEM, precioVistaPrevia, type Armado, type Catalogo } from '@burritos/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { almacenSeguro } from '../lib/almacenLocal';
import { limpiarContraCatalogo } from '../lib/armador/reglas';

// Carrito persistente. Solo guarda armados: el precio se recalcula siempre con
// el catálogo actual (y en la Fase 2, en el servidor).

export interface ItemCarrito {
  id: string;
  armado: Armado;
  /** id → nombre al agregarlo, para avisar si algo sale del menú. */
  nombres: Record<string, string>;
}

interface EstadoCarrito {
  items: ItemCarrito[];
  agregar: (armado: Armado, nombres: Record<string, string>) => string;
  reemplazar: (id: string, armado: Armado, nombres: Record<string, string>) => void;
  cambiarCantidad: (id: string, cantidad: number) => void;
  quitar: (id: string) => void;
  cantidadBurritos: () => number;
  total: (catalogo: Catalogo) => number;
  /** Saca lo que ya no está en el menú. Devuelve los nombres quitados. */
  actualizarConCatalogo: (catalogo: Catalogo) => string[];
}

export const useCarrito = create<EstadoCarrito>()(
  persist(
    (set, get) => ({
      items: [],

      agregar: (armado, nombres) => {
        const id = crypto.randomUUID();
        set({ items: [...get().items, { id, armado, nombres }] });
        return id;
      },

      reemplazar: (id, armado, nombres) =>
        set({ items: get().items.map((item) => (item.id === id ? { ...item, armado, nombres } : item)) }),

      cambiarCantidad: (id, cantidad) => {
        if (cantidad <= 0) {
          get().quitar(id);
          return;
        }
        const tope = Math.min(cantidad, CANTIDAD_MAXIMA_POR_ITEM);
        set({ items: get().items.map((item) => (item.id === id ? { ...item, armado: { ...item.armado, cantidad: tope } } : item)) });
      },

      quitar: (id) => set({ items: get().items.filter((item) => item.id !== id) }),

      cantidadBurritos: () => get().items.reduce((suma, item) => suma + item.armado.cantidad, 0),

      total: (catalogo) =>
        get().items.reduce((suma, item) => suma + precioVistaPrevia(item.armado, catalogo) * item.armado.cantidad, 0),

      actualizarConCatalogo: (catalogo) => {
        const quitados: string[] = [];
        const items = get().items.map((item) => {
          const limpio = limpiarContraCatalogo(item.armado, catalogo, item.nombres);
          quitados.push(...limpio.quitados);
          return { ...item, armado: limpio.armado };
        });
        set({ items });
        return [...new Set(quitados)];
      },
    }),
    {
      name: 'burritos:carrito:v1',
      skipHydration: true,
      storage: createJSONStorage(() => almacenSeguro),
      partialize: ({ items }) => ({ items }),
    },
  ),
);
