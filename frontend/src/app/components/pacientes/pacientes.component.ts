import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-pacientes',
  templateUrl: './pacientes.component.html'
})
export class PacientesComponent {
  formularioPaciente = this.fb.group({
    rut: [''],
    nombre: [''],
    direccion: [''],
    telefono: [''],
    correo: [''],
    fechaRegistro: ['']
  });

  constructor(private fb: FormBuilder) {}
}
