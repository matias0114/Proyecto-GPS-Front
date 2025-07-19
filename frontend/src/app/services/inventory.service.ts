import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Inventory, InventoryDTO, UpdateInventoryDTO, Warehouse, Batch } from '../models/inventory.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = `${environment.apiBase}/inventory`;

  constructor(private http: HttpClient) { }

  // Obtener todos los inventarios
  getAllInventories(): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(this.apiUrl);
  }

  // Crear inventario por barrido
  createSweepInventory(inventoryDTO: InventoryDTO): Observable<Inventory> {
    return this.http.post<Inventory>(`${this.apiUrl}/sweep`, inventoryDTO);
  }

  // Crear inventario selectivo
  createSelectiveInventory(inventoryDTO: InventoryDTO): Observable<Inventory> {
    return this.http.post<Inventory>(`${this.apiUrl}/selective`, inventoryDTO);
  }

  // Crear inventario general
  createGeneralInventory(warehouseId: number): Observable<Inventory[]> {
    return this.http.post<Inventory[]>(`${this.apiUrl}/general/${warehouseId}`, {});
  }

  // Obtener stock por bodega
  getStockByWarehouse(warehouseId: number): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${this.apiUrl}/warehouse/${warehouseId}`);
  }

  // Obtener stock por lote
  getStockByBatch(batchId: number): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${this.apiUrl}/batch/${batchId}`);
  }

  // Actualizar inventario
  updateInventory(inventoryId: number, updateData: UpdateInventoryDTO): Observable<Inventory> {
    return this.http.put<Inventory>(`${this.apiUrl}/${inventoryId}`, updateData);
  }

  // Eliminar inventario
  deleteInventory(inventoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${inventoryId}`);
  }
}
