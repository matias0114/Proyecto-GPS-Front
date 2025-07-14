import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { HistorialClinico } from '../models/historial-clinico.model';
import { Paciente } from '../models/paciente.model';

@Injectable({
  providedIn: 'root'
})
export class HistorialClinicoService {
  private apiUrl = `${environment.apiBase}/historial-clinico`;

  constructor(private http: HttpClient) { }

  buscarPacientePorRut(rut: string): Observable<Paciente> {
    const rutFormateado = rut.replace(/\./g, '').replace(/-/g, '').slice(0, -1) + '-' + rut.slice(-1);
    return this.http.get<Paciente>(`${environment.apiBase}/pacientes/${rutFormateado}`);
  }

  crearHistorialClinico(historial: HistorialClinico): Observable<HistorialClinico> {
    // Primero buscar el id del paciente por su RUT
    return this.http.get<Paciente>(`${environment.apiBase}/pacientes/${historial.pacienteRut}`).pipe(
      switchMap(paciente => {
        // Una vez que tenemos el id del paciente, crear el historial
        return this.http.post<HistorialClinico>(
          `${environment.apiBase}/pacientes/${paciente.id}/historiales`,
          {
            fecha: historial.fecha,
            diagnostico: historial.diagnostico,
            tratamiento: historial.tratamiento,
            observaciones: historial.observaciones,
            medicamentosRecetados: historial.medicamentosRecetados
          }
        );
      })
    );
  }
}
