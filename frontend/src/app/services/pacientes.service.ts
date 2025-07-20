import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paciente } from '../models/paciente.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PacientesService {
  private apiUrl = `${environment.endpoints.backend}/pacientes`;

  constructor(private http: HttpClient) { }

  crearPaciente(p: Paciente): Observable<Paciente> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const pacienteData = {
      ...p,
      esBeneficiario: p.esBeneficiario || false,
      tipoBeneficio: p.esBeneficiario ? p.tipoBeneficio : null
    };
    return this.http.post<Paciente>(this.apiUrl, pacienteData, { headers });
  }

  buscarPorRut(rut: string): Observable<Paciente> {
    // Asegurar que el RUT no tenga puntos para la búsqueda
    const rutSinPuntos = rut.replace(/\./g, '');
    return this.http.get<Paciente>(`${this.apiUrl}/${encodeURIComponent(rutSinPuntos)}`);
  }

  obtenerTodos(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(this.apiUrl);
  }
}
