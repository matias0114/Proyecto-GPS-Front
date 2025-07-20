import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  DashboardDTO, 
  FacturaReporteDTO, 
  ProductoMovimientoDTO, 
  ReporteRequest 
} from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.endpoints.dashboard;

  constructor(private http: HttpClient) { }

  /**
   * Obtener métricas principales del dashboard
   */
  getDashboardMetrics(): Observable<DashboardDTO> {
    return this.http.get<DashboardDTO>(`${this.apiUrl}/metricas`);
  }

  /**
   * Obtener productos con mayor movimiento
   */
  getProductosConMayorMovimiento(limit?: number): Observable<ProductoMovimientoDTO[]> {
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }
    return this.http.get<ProductoMovimientoDTO[]>(`${this.apiUrl}/productos-movimiento`, { params });
  }

  /**
   * Obtener reporte de facturas
   */
  getReporteFacturas(request: ReporteRequest): Observable<FacturaReporteDTO[]> {
    return this.http.post<FacturaReporteDTO[]>(`${this.apiUrl}/reportes/facturas`, request);
  }

  /**
   * Obtener reporte de compras
   */
  getReporteCompras(request: ReporteRequest): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/reportes/compras`, request);
  }

  /**
   * Obtener reporte de productos
   */
  getReporteProductos(request: ReporteRequest): Observable<ProductoMovimientoDTO[]> {
    return this.http.post<ProductoMovimientoDTO[]>(`${this.apiUrl}/reportes/productos`, request);
  }

  /**
   * Descargar reporte de facturas en Excel
   */
  descargarReporteFacturasExcel(request: ReporteRequest): Observable<Blob> {
    const requestWithExcel = { ...request, formato: 'excel' };
    return this.http.post(`${this.apiUrl}/reportes/facturas/export`, requestWithExcel, {
      responseType: 'blob'
    });
  }

  /**
   * Descargar reporte de compras en Excel
   */
  descargarReporteComprasExcel(request: ReporteRequest): Observable<Blob> {
    const requestWithExcel = { ...request, formato: 'excel' };
    return this.http.post(`${this.apiUrl}/reportes/compras/export`, requestWithExcel, {
      responseType: 'blob'
    });
  }

  /**
   * Descargar reporte de productos en Excel
   */
  descargarReporteProductosExcel(request: ReporteRequest): Observable<Blob> {
    const requestWithExcel = { ...request, formato: 'excel' };
    return this.http.post(`${this.apiUrl}/reportes/productos/export`, requestWithExcel, {
      responseType: 'blob'
    });
  }

  /**
   * Método auxiliar para descargar archivos
   */
  descargarArchivo(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
