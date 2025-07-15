import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GuiaDespacho } from '../models/guia-despacho.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GuiaDespachoService {
  private apiUrl = `${environment.apiBase}/guias-despacho`;

  constructor(private http: HttpClient) { }

  obtenerTodas(): Observable<GuiaDespacho[]> {
    return this.http.get<GuiaDespacho[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<GuiaDespacho> {
    return this.http.get<GuiaDespacho>(`${this.apiUrl}/${id}`);
  }

  crear(g: GuiaDespacho): Observable<GuiaDespacho> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<GuiaDespacho>(this.apiUrl, g, { headers });
  }

  actualizar(id: number, g: GuiaDespacho): Observable<GuiaDespacho> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.put<GuiaDespacho>(`${this.apiUrl}/${id}`, g, { headers });
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
