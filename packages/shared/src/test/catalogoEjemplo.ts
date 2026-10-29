import type { Catalogo } from '../catalogo';

// Catálogo chico para tests. Los precios son inventados.
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

export const IDS = {
  simple: id(1),
  doble: id(2),
  harina: id(10),
  sinTacc: id(11),
  espinacaInactiva: id(12),
  carne: id(20),
  pollo: id(21),
  arroz: id(30),
  porotos: id(31),
  lechuga: id(32),
  tomate: id(33),
  cebolla: id(34),
  queso: id(35),
  guacamole: id(40),
  picante: id(41),
  extraQueso: id(50),
  panceta: id(51),
  comboClasico: id(60),
  bebidaInactiva: id(61),
  zonaCentro: id(70),
  zonaInactiva: id(71),
  noExiste: id(999),
};

export const catalogoEjemplo: Catalogo = {
  tamanos: [
    {
      id: IDS.simple,
      slug: 'simple',
      nombre: 'Simple',
      cantTapas: 1,
      precioBase: 6000,
      maximos: { tapa: 1, proteina: 1, relleno: 4, salsa: 2, agregado: 3 },
      activo: true,
    },
    {
      id: IDS.doble,
      slug: 'doble',
      nombre: 'Doble tapa',
      cantTapas: 2,
      precioBase: 9000,
      maximos: { tapa: 1, proteina: 2, relleno: 6, salsa: 3, agregado: 5 },
      activo: true,
    },
  ],
  minimos: { tapa: 1, proteina: 1, relleno: 0, salsa: 0, agregado: 0 },
  ingredientes: [
    { id: IDS.harina, categoria: 'tapa', nombre: 'Harina común', precioExtra: 0, activo: true },
    { id: IDS.sinTacc, categoria: 'tapa', nombre: 'Sin TACC', precioExtra: 800, activo: true },
    { id: IDS.espinacaInactiva, categoria: 'tapa', nombre: 'Espinaca', precioExtra: 0, activo: false },
    { id: IDS.carne, categoria: 'proteina', nombre: 'Carne picada', precioExtra: 0, activo: true },
    { id: IDS.pollo, categoria: 'proteina', nombre: 'Pollo', precioExtra: 0, activo: true },
    { id: IDS.arroz, categoria: 'relleno', nombre: 'Arroz', precioExtra: 0, activo: true },
    { id: IDS.porotos, categoria: 'relleno', nombre: 'Porotos negros', precioExtra: 0, activo: true },
    { id: IDS.lechuga, categoria: 'relleno', nombre: 'Lechuga', precioExtra: 0, activo: true },
    { id: IDS.tomate, categoria: 'relleno', nombre: 'Tomate', precioExtra: 0, activo: true },
    { id: IDS.cebolla, categoria: 'relleno', nombre: 'Cebolla', precioExtra: 0, activo: true },
    { id: IDS.queso, categoria: 'relleno', nombre: 'Queso', precioExtra: 0, activo: true },
    { id: IDS.guacamole, categoria: 'salsa', nombre: 'Guacamole', precioExtra: 0, activo: true },
    { id: IDS.picante, categoria: 'salsa', nombre: 'Picante suave', precioExtra: 0, activo: true },
    { id: IDS.extraQueso, categoria: 'agregado', nombre: 'Extra queso', precioExtra: 700, activo: true },
    { id: IDS.panceta, categoria: 'agregado', nombre: 'Panceta', precioExtra: 1000, activo: true },
  ],
  productos: [
    { id: IDS.comboClasico, nombre: 'Combo clásico', precio: 12000, activo: true },
    { id: IDS.bebidaInactiva, nombre: 'Gaseosa', precio: 2000, activo: false },
  ],
  zonasEnvio: [
    { id: IDS.zonaCentro, nombre: 'Centro', costo: 1500, activo: true },
    { id: IDS.zonaInactiva, nombre: 'Afueras', costo: 3000, activo: false },
  ],
};
