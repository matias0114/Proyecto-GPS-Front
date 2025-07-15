import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Compra } from '../models/compra.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CompraService {
  private apiUrl = `${environment.apiBase}/compras`;

  constructor(private http: HttpClient) { }

  crearCompra(c: Compra): Observable<Compra> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<Compra>(this.apiUrl, c, { headers });
  }

  obtenerTodas(): Observable<Compra[]> {
    return this.http.get<Compra[]>(this.apiUrl);
  }

  eliminarCompra(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  actualizarCompra(id: number, c: Compra): Observable<Compra> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<Compra>(`${this.apiUrl}/${id}`, c, { headers });
  }

  obtenerPorId(id: number): Observable<Compra> {
    return this.http.get<Compra>(`${this.apiUrl}/${id}`);
  }
}
