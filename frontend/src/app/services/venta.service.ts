import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { 
  Venta, 
  VentaCreateDTO, 
  InventarioResponse, 
  ProductoDisponible, 
  BodegaDisponible 
} from '../models/venta.model';

@Injectable({
  providedIn: 'root'
})
export class VentaService {
  // URL del microservicio de ventas
  private readonly baseUrl = 'http://localhost:8084/api/sales';
  private readonly inventoryQueryUrl = 'http://localhost:8084/api/inventory-query';

  constructor(private http: HttpClient) {}

  // ========== OPERACIONES DE VENTAS ==========

  /**
   * Crear una nueva venta
   */
  crearVenta(ventaData: VentaCreateDTO): Observable<Venta> {
    return this.http.post<Venta>(this.baseUrl, ventaData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener todas las ventas
   */
  obtenerTodas(): Observable<Venta[]> {
    return this.http.get<Venta[]>(this.baseUrl)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener venta por ID
   */
  obtenerPorId(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.baseUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener ventas por RUT de paciente
   */
  obtenerVentasPorPaciente(rut: string): Observable<Venta[]> {
    return this.http.get<Venta[]>(`${this.baseUrl}/patient/${rut}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener ventas del día actual
   */
  obtenerVentasDeHoy(): Observable<Venta[]> {
    return this.http.get<Venta[]>(`${this.baseUrl}/today`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Cancelar una venta
   */
  cancelarVenta(id: number): Observable<Venta> {
    return this.http.put<Venta>(`${this.baseUrl}/${id}/cancel`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener resumen de ventas por fecha
   */
  obtenerResumenVentas(fecha?: Date): Observable<any> {
    const params = fecha ? { params: { date: fecha.toISOString().split('T')[0] } } : {};
    return this.http.get<any>(`${this.baseUrl}/summary`, params)
      .pipe(catchError(this.handleError));
  }

  // ========== OPERACIONES DE INVENTARIO ==========

  /**
   * Obtener todos los inventarios disponibles
   */
  obtenerInventariosDisponibles(): Observable<InventarioResponse[]> {
    return this.http.get<InventarioResponse[]>(this.inventoryQueryUrl)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener inventarios por bodega
   */
  obtenerInventariosPorBodega(warehouseId: number): Observable<InventarioResponse[]> {
    return this.http.get<InventarioResponse[]>(`${this.inventoryQueryUrl}/warehouse/${warehouseId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener inventario específico por ID
   */
  obtenerInventarioPorId(inventoryId: number): Observable<InventarioResponse> {
    return this.http.get<InventarioResponse>(`${this.inventoryQueryUrl}/${inventoryId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Verificar disponibilidad de stock
   */
  verificarDisponibilidadStock(inventoryId: number, cantidadRequerida: number): Observable<any> {
    return this.http.get<any>(`${this.inventoryQueryUrl}/${inventoryId}/stock-check`, {
      params: { requiredQuantity: cantidadRequerida.toString() }
    }).pipe(catchError(this.handleError));
  }

  /**
   * Obtener productos disponibles
   */
  obtenerProductosDisponibles(): Observable<ProductoDisponible[]> {
    return this.http.get<ProductoDisponible[]>(`${this.inventoryQueryUrl}/products`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtener bodegas disponibles
   */
  obtenerBodegasDisponibles(): Observable<BodegaDisponible[]> {
    return this.http.get<BodegaDisponible[]>(`${this.inventoryQueryUrl}/warehouses`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Verificar estado del servicio de inventarios
   */
  verificarEstadoServicioInventario(): Observable<any> {
    return this.http.get<any>(`${this.inventoryQueryUrl}/service-health`)
      .pipe(catchError(this.handleError));
  }

  // ========== MANEJO DE ERRORES ==========

  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = '';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      const serverMessage = error.headers.get('Error-Message') || error.error?.message || error.message;
      
      switch (error.status) {
        case 400:
          errorMessage = `Solicitud inválida: ${serverMessage}`;
          break;
        case 404:
          errorMessage = 'Recurso no encontrado';
          break;
        case 500:
          errorMessage = `Error interno del servidor: ${serverMessage}`;
          break;
        case 503:
          errorMessage = 'Servicio no disponible. Intente más tarde.';
          break;
        default:
          errorMessage = `Error ${error.status}: ${serverMessage}`;
      }
    }

    console.error('Error en VentaService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  };

  // ========== UTILIDADES ==========

  /**
   * Calcular total de una venta considerando descuentos
   */
  calcularTotalVenta(subtotal: number, descuentoPorcentaje: number = 0): number {
    const descuentoMonto = (subtotal * descuentoPorcentaje) / 100;
    return subtotal - descuentoMonto;
  }

  /**
   * Validar RUT chileno
   */
  validarRutChileno(rut: string): boolean {
    if (!rut) return false;
    
    // Formato esperado: 12345678-9 o 12.345.678-9
    const rutLimpio = rut.replace(/[.\s]/g, '');
    const rutRegex = /^\d{7,8}-[\dkK]$/;
    
    if (!rutRegex.test(rutLimpio)) return false;
    
    const [numero, dv] = rutLimpio.split('-');
    let suma = 0;
    let multiplo = 2;
    
    for (let i = numero.length - 1; i >= 0; i--) {
      suma += parseInt(numero[i]) * multiplo;
      multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }
    
    const dvCalculado = 11 - (suma % 11);
    let dvEsperado = dvCalculado === 11 ? '0' : dvCalculado === 10 ? 'K' : dvCalculado.toString();
    
    return dvEsperado === dv.toUpperCase();
  }

  /**
   * Formatear RUT chileno
   */
  formatearRut(rut: string): string {
    if (!rut) return '';
    
    const rutLimpio = rut.replace(/[.\-\s]/g, '');
    if (rutLimpio.length < 2) return rut;
    
    const dv = rutLimpio.slice(-1);
    const numero = rutLimpio.slice(0, -1);
    
    // Agregar puntos cada 3 dígitos desde la derecha
    const numeroFormateado = numero.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${numeroFormateado}-${dv}`;
  }
}
