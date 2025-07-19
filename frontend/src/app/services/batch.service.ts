import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Batch, BatchStatus } from '../models/inventory.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BatchService {
  private apiUrl = `${environment.apiBase}/batch`;

  constructor(private http: HttpClient) { }

  // Obtener todos los lotes
  getAllBatches(): Observable<Batch[]> {
    return this.http.get<Batch[]>(this.apiUrl);
  }

  // Obtener lote por ID
  getBatchById(id: number): Observable<Batch> {
    return this.http.get<Batch>(`${this.apiUrl}/${id}`);
  }

  // Obtener lotes por bodega
  getBatchesByWarehouse(warehouseId: number): Observable<Batch[]> {
    return this.http.get<Batch[]>(`${this.apiUrl}/warehouse/${warehouseId}`);
  }

  // Obtener lotes activos
  getActiveBatches(): Observable<Batch[]> {
    return this.http.get<Batch[]>(`${this.apiUrl}/active`);
  }

  // Crear lote
  createBatch(batch: Batch): Observable<Batch> {
    return this.http.post<Batch>(this.apiUrl, batch);
  }

  // Actualizar lote
  updateBatch(id: number, batch: Batch): Observable<Batch> {
    return this.http.put<Batch>(`${this.apiUrl}/${id}`, batch);
  }

  // Eliminar lote
  deleteBatch(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
