import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Warehouse } from '../models/inventory.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WarehouseService {
  private apiUrl = `${environment.apiBase}/warehouse`;

  constructor(private http: HttpClient) { }

  // Obtener todas las bodegas
  getAllWarehouses(): Observable<Warehouse[]> {
    return this.http.get<Warehouse[]>(this.apiUrl);
  }

  // Obtener bodega por ID
  getWarehouseById(id: number): Observable<Warehouse> {
    return this.http.get<Warehouse>(`${this.apiUrl}/${id}`);
  }

  // Crear bodega
  createWarehouse(warehouse: Warehouse): Observable<Warehouse> {
    return this.http.post<Warehouse>(this.apiUrl, warehouse);
  }

  // Actualizar bodega
  updateWarehouse(id: number, warehouse: Warehouse): Observable<Warehouse> {
    return this.http.put<Warehouse>(`${this.apiUrl}/${id}`, warehouse);
  }

  // Eliminar bodega
  deleteWarehouse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
