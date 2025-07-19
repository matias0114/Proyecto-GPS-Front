import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
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

  // Crear lista de precios
  createPriceList(priceList: PriceList): Observable<PriceList> {
    return this.http.post<PriceList>(this.apiUrl, priceList);
  }

  // Actualizar lista de precios
  updatePriceList(id: number, priceList: PriceList): Observable<PriceList> {
    return this.http.put<PriceList>(`${this.apiUrl}/${id}`, priceList);
  }

  // Eliminar lista de precios
  deletePriceList(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
