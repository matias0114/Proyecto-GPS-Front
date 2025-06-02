import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-historial-paciente',
  templateUrl: './historial-pacientes.component.html'
})
export class HistorialPacienteComponent {
  formularioHistorial = this.fb.group({
    rut: [''],
    nombre: [''],
    fechaNacimiento: [''],
    enfermedades: [''],
    medicamentos: [''],
    observaciones: ['']
  });

  constructor(private fb: FormBuilder) {}
}
