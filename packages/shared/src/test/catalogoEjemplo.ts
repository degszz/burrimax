import type { Catalogo, IngredienteCatalogo } from '../catalogo';
import type { CategoriaSlug } from '../constantes';

// Catálogo chico para tests. Los precios son inventados.
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

export const IDS = {
  simple: id(1),
  doble: id(2),
  maiz: id(10),
  trigo: id(11),
  espinacaInactiva: id(12),
  guacamole: id(20),
  pico: id(21),
  crema: id(22),
  pollo: id(30),
  vaca: id(31),
  pescado: id(32),
  lechuga: id(40),
  tomate: id(41),
  cebolla: id(42),
  choclo: id(43),
  zanahoria: id(44),
  repollo: id(45),
  huevo: id(46),
  comboClasico: id(60),
  bebidaInactiva: id(61),
  zonaCentro: id(70),
  zonaInactiva: id(71),
  noExiste: id(999),
};

const ingrediente = (
  id: string,
  categoria: CategoriaSlug,
  nombre: string,
  precioExtra = 0,
  activo = true,
): IngredienteCatalogo => ({
  id,
  slug: nombre.toLowerCase(),
  categoria,
  nombre,
  precioExtra,
  activo,
  sinTacc: false,
  imagenUrl: null,
  colorHex: null,
  orden: 0,
});

export const catalogoEjemplo: Catalogo = {
  tamanos: [
    {
      id: IDS.simple,
      slug: 'simple',
      nombre: 'Simple',
      cantTapas: 1,
      precioBase: 9000,
      minimos: { tortilla: 1, salsa: 0, carne: 2, vegetal: 0 },
      maximos: { tortilla: 1, salsa: 2, carne: 2, vegetal: 4 },
      activo: true,
      orden: 1,
    },
    {
      id: IDS.doble,
      slug: 'doble',
      nombre: 'Doble tapa',
      cantTapas: 2,
      precioBase: 13500,
      minimos: { tortilla: 1, salsa: 0, carne: 4, vegetal: 0 },
      maximos: { tortilla: 1, salsa: 2, carne: 4, vegetal: 6 },
      activo: true,
      orden: 2,
    },
  ],
  categorias: {
    tortilla: { nombre: 'Tortilla', paso: 1, permiteRepetir: false },
    salsa: { nombre: 'Salsas', paso: 2, permiteRepetir: false },
    carne: { nombre: 'Carne', paso: 3, permiteRepetir: true },
    vegetal: { nombre: 'Vegetales', paso: 4, permiteRepetir: false },
  },
  ingredientes: [
    ingrediente(IDS.maiz, 'tortilla', 'Maíz'),
    ingrediente(IDS.trigo, 'tortilla', 'Trigo'),
    ingrediente(IDS.espinacaInactiva, 'tortilla', 'Espinaca', 0, false),
    ingrediente(IDS.guacamole, 'salsa', 'Guacamole'),
    ingrediente(IDS.pico, 'salsa', 'Pico'),
    ingrediente(IDS.crema, 'salsa', 'Crema'),
    ingrediente(IDS.pollo, 'carne', 'Pollo'),
    ingrediente(IDS.vaca, 'carne', 'Vaca'),
    ingrediente(IDS.pescado, 'carne', 'Pescado', 500),
    ingrediente(IDS.lechuga, 'vegetal', 'Lechuga'),
    ingrediente(IDS.tomate, 'vegetal', 'Tomate'),
    ingrediente(IDS.cebolla, 'vegetal', 'Cebolla'),
    ingrediente(IDS.choclo, 'vegetal', 'Choclo'),
    ingrediente(IDS.zanahoria, 'vegetal', 'Zanahoria'),
    ingrediente(IDS.repollo, 'vegetal', 'Repollo'),
    ingrediente(IDS.huevo, 'vegetal', 'Huevo'),
  ],
  productos: [
    { id: IDS.comboClasico, nombre: 'Combo clásico', precio: 10500, activo: true },
    { id: IDS.bebidaInactiva, nombre: 'Gaseosa', precio: 2000, activo: false },
  ],
  zonasEnvio: [
    { id: IDS.zonaCentro, nombre: 'Centro', costo: 1500, activo: true },
    { id: IDS.zonaInactiva, nombre: 'Afueras', costo: 3000, activo: false },
  ],
};
