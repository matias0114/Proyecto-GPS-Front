import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PacientesService } from '../../services/pacientes.service';
import { Paciente } from '../../models/paciente.model';

@Component({
  selector: 'app-pacientes',
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.css']
})
export class PacientesComponent implements OnInit {
  formularioPaciente!: FormGroup;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private pacientesService: PacientesService
  ) {}

  ngOnInit(): void {
    this.formularioPaciente = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      dni: ['', Validators.required],
      fechaNacimiento: ['', Validators.required],
      direccion: [''],
      telefono: ['']
    });
  }

  onSubmit(): void {
    console.log('onSubmit disparado', this.formularioPaciente.value, this.formularioPaciente.valid);
    if (this.formularioPaciente.invalid) {
      this.errorMessage = 'Por favor corrige los campos en rojo.';
      return;
    }
    this.pacientesService.crearPaciente(this.formularioPaciente.value).subscribe({
      next: p => {
        this.successMessage = `Paciente ${p.nombre} ${p.apellido} registrado.`;
        this.errorMessage = '';
        this.formularioPaciente.reset();
      },
      error: err => {
        console.error('Error en back:', err);
        this.errorMessage = 'Ocurrió un error al registrar el paciente.';
        this.successMessage = '';
      }
    });
  }
}
