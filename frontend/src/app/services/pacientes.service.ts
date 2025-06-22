import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paciente } from '../models/paciente.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PacientesService {
  private apiUrl = `${environment.apiBase}/pacientes`;

  constructor(private http: HttpClient) { }

  crearPaciente(p: Paciente): Observable<Paciente> {
    return this.http.post<Paciente>(this.apiUrl, p);
  }
}
