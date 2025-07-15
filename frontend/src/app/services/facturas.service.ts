import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Factura } from '../models/factura.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FacturaService {
  private apiUrl = `${environment.apiBase}/facturas`;

  constructor(private http: HttpClient) { }

  obtenerTodas(): Observable<Factura[]> {
    return this.http.get<Factura[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<Factura> {
    return this.http.get<Factura>(`${this.apiUrl}/${id}`);
  }

  crear(f: Factura): Observable<Factura> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<Factura>(this.apiUrl, f, { headers });
  }

  actualizar(id: number, f: Factura): Observable<Factura> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<Factura>(`${this.apiUrl}/${id}`, f, { headers });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
