import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PriceList } from '../models/price-list.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PriceListService {
  private apiUrl = `${environment.apiBase}/pricelist`;

  constructor(private http: HttpClient) { }

  // Obtener todas las listas de precios
  getAllPriceLists(): Observable<PriceList[]> {
    return this.http.get<PriceList[]>(this.apiUrl);
  }

  // Obtener precios actuales
  getCurrentPrices(): Observable<PriceList[]> {
    return this.http.get<PriceList[]>(`${this.apiUrl}/current`);
  }

  // Obtener lista de precios por ID
  getPriceListById(id: number): Observable<PriceList> {
    return this.http.get<PriceList>(`${this.apiUrl}/${id}`);
  }

  // Obtener precios por producto
  getPricesByProductId(productId: number): Observable<PriceList[]> {
    return this.http.get<PriceList[]>(`${this.apiUrl}/product/${productId}`);
  }

  // Obtener precios por fecha
  getPricesByDate(date: string): Observable<PriceList[]> {
    return this.http.get<PriceList[]>(`${this.apiUrl}/date/${date}`);
  }

  // Actualizar lista de precios
  updatePriceList(id: number, priceList: PriceList): Observable<PriceList> {
    console.log(`Actualizando precio con ID: ${id}`);
    console.log('Datos enviados:', priceList);
    return this.http.put<PriceList>(`${this.apiUrl}/${id}`, priceList)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Crear lista de precios
  createPriceList(priceList: PriceList): Observable<PriceList> {
    console.log('Creando nuevo precio');
    console.log('Datos enviados:', priceList);
    return this.http.post<PriceList>(this.apiUrl, priceList)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Error en PriceListService:', error);
    
    let errorMessage = 'Error desconocido';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error del cliente: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Error del servidor: ${error.status} - ${error.message}`;
      if (error.error && error.error.message) {
        errorMessage += ` - ${error.error.message}`;
      }
      if (error.error && error.error.details) {
        errorMessage += ` - ${error.error.details}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // Eliminar lista de precios
  deletePriceList(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
