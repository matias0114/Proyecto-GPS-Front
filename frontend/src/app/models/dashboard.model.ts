export interface DashboardDTO {
  totalFacturas: number;
  facturasMesActual: number;
  montoTotalFacturas: number;
  montoFacturasMesActual: number;
  
  totalCompras: number;
  comprasPendientes: number;
  comprasRecibidas: number;
  montoTotalCompras: number;
  
  totalProductos: number;
  productosActivos: number;
  productosSinMovimiento: number;
  
  facturasUltimos12Meses: [string, number][]; // Array de [mes, cantidad]
  productosConMayorMovimiento: ProductoMovimientoDTO[];
}

export interface ProductoMovimientoDTO {
  productoId: number;
  codigo: string;
  nombre: string;
  categoria: string;
  laboratorio: string;
  totalMovimiento: number;
  montoTotal: number;
  activo: boolean;
}

export interface FacturaReporteDTO {
  id: number;
  numeroFactura: string;
  fechaEmision: string;
  montoTotal: number;
  rutProveedor: string;
  proveedor: string;
  compraId: number;
}

export interface ReporteRequest {
  fechaInicio: string;
  fechaFin: string;
  categoria?: string;
  proveedor?: string;
  formato?: 'json' | 'excel';
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  }[];
}
