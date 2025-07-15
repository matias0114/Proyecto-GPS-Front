export interface Factura {
  id?: number;
  numeroFactura: string;
  compraId: number;
  montoTotal: number;
  rutProveedor: string;
  fechaEmision?: string;
}
