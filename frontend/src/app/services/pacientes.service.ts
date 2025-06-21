import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paciente } from '../models/paciente.model';

@Injectable({
  providedIn: 'root'
})
export class PacientesService {
  private apiUrl = 'http://localhost:8081/api/pacientes';

  constructor(private http: HttpClient) { }

  crearPaciente(p: Paciente): Observable<Paciente> {
    return this.http.post<Paciente>(this.apiUrl, p);
  }
}
