export interface Compra {
  id?: number;
  numeroOrden: string;
  montoTotal: number;
  proveedor: string;
  estado?: string;
  fechaCompra?: string;  // si quieres mostrarla después
}
