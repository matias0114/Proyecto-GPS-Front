import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
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
      nombre: ['', [Validators.required, this.nombreApellidoValidator]],
      apellido: ['', [Validators.required, this.nombreApellidoValidator]],
      dni: ['', [Validators.required, this.rutChilenoValidator]],
      fechaNacimiento: ['', Validators.required],
      direccion: [''],
      telefono: ['+56', [Validators.required, this.telefonoChilenoValidator]],
    });
  }

  // Validador personalizado para RUT chileno
  rutChilenoValidator(control: AbstractControl) {
    const rut = control.value;
    if (!rut) return null;
    const rutRegex = /^\d{7,8}-[\dkK]$/;
    if (!rutRegex.test(rut)) {
      return { rutInvalido: true };
    }
    const [num, dv] = rut.split('-');
    let suma = 0, multiplo = 2;
    for (let i = num.length - 1; i >= 0; i--) {
      suma += parseInt(num[i]) * multiplo;
      multiplo = multiplo === 7 ? 2 : multiplo + 1;
    }
    const dvEsperado = 11 - (suma % 11);
    let dvCalc = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
    if (dvCalc !== dv.toUpperCase()) {
      return { rutInvalido: true };
    }
    return null;
  }

  // Validador para nombre y apellido (solo letras, espacios y tildes)
  nombreApellidoValidator(control: AbstractControl) {
    const value = control.value;
    if (!value) return null;
    // Permite letras, espacios, tildes y ñ/Ñ
    const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñüÜ\s'-]+$/;
    if (!regex.test(value)) {
      return { nombreApellidoInvalido: true };
    }
    return null;
  }

  // Validador para teléfono chileno
  telefonoChilenoValidator(control: AbstractControl) {
    const value = control.value;
    if (!value) return null;
    // Debe empezar con +56 y luego 9 dígitos (ej: +56912345678)
    const regex = /^\+56\s?9\d{8}$/;
    if (!regex.test(value.replace(/\s/g, ''))) {
      return { telefonoInvalido: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.formularioPaciente.invalid) {
      if (this.formularioPaciente.get('dni')?.errors?.['rutInvalido']) {
        this.errorMessage = 'Ingrese un RUT chileno válido.';
      } else if (this.formularioPaciente.get('nombre')?.errors?.['nombreApellidoInvalido']) {
        this.errorMessage = 'El nombre solo debe contener letras y espacios.';
      } else if (this.formularioPaciente.get('apellido')?.errors?.['nombreApellidoInvalido']) {
        this.errorMessage = 'El apellido solo debe contener letras y espacios.';
      } else if (this.formularioPaciente.get('telefono')?.errors?.['telefonoInvalido']) {
        this.errorMessage = 'El teléfono debe tener formato chileno: +56 9XXXXXXXX.';
      } else {
        this.errorMessage = 'Por favor corrige los campos en rojo.';
      }
      return;
    }
    this.pacientesService.crearPaciente(this.formularioPaciente.value).subscribe({
      next: p => {
        this.successMessage = `Paciente ${p.nombre} ${p.apellido} registrado.`;
        this.errorMessage = '';
        this.formularioPaciente.reset({ telefono: '+56' });
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: err => {
        this.errorMessage = 'Ocurrió un error al registrar el paciente.';
        this.successMessage = '';
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      }
    });
  }
}
