import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { HistorialClinicoService } from '../../services/historial-clinico.service';
import { Paciente } from '../../models/paciente.model';
import { HistorialClinico } from '../../models/historial-clinico.model';

@Component({
  selector: 'app-historial-paciente',
  templateUrl: './historial-pacientes.component.html',
  styleUrls: ['./historial-pacientes.component.css']
})
export class HistorialPacienteComponent {
  pacienteEncontrado: Paciente | null = null;
  mensajeError: string = '';
  busquedaRealizada: boolean = false;
  cargando: boolean = false;
  maxDate: string = new Date().toISOString().slice(0, 16);
  historiales: HistorialClinico[] = [];

  formularioBusqueda = this.fb.group({
    rutBusqueda: ['', [
      Validators.required, 
      Validators.pattern(/^(\d{1,2}(?:\.\d{3}){2}|[\d]{7,8})[-][0-9kK]{1}$/)
    ]]
  });

  formularioHistorial = this.fb.group({
    diagnostico: ['', Validators.required],
    fecha: [new Date().toISOString().slice(0, 16), Validators.required],
    observaciones: ['', Validators.required],
    tratamiento: ['', Validators.required],
    medicamentosRecetados: ['', Validators.required]
  });

  constructor(
    private fb: FormBuilder,
    private historialService: HistorialClinicoService
  ) {
    // Suscribirse a cambios en el formulario para debugging
    this.formularioBusqueda.get('rutBusqueda')?.valueChanges.subscribe(value => {
      console.log('Valor del RUT:', value);
      console.log('Estado del formulario:', this.formularioBusqueda.valid);
      console.log('Errores:', this.formularioBusqueda.get('rutBusqueda')?.errors);
    });
  }

  buscarPaciente() {
    if (this.formularioBusqueda.valid) {
      this.cargando = true;
      this.mensajeError = '';
      const rutConFormato = this.formularioBusqueda.get('rutBusqueda')?.value || '';
      
      if (!rutConFormato) {
        this.mensajeError = 'Por favor, ingrese un RUT válido';
        return;
      }
      
      console.log('RUT ingresado:', rutConFormato);
      
      this.historialService.buscarPacientePorRut(rutConFormato).subscribe({
        next: (paciente) => {
          this.pacienteEncontrado = paciente;
          this.busquedaRealizada = true;
          // Una vez que encontramos al paciente, buscamos sus historiales
          this.historialService.obtenerHistorialesPorPaciente(paciente.id!).subscribe({
            next: (historiales) => {
              this.historiales = historiales;
              this.cargando = false;
              this.mensajeError = '';
            },
            error: (error) => {
              console.error('Error al obtener historiales:', error);
              this.mensajeError = 'Ocurrió un error al obtener los historiales del paciente.';
              this.cargando = false;
            }
          });
        },
        error: (error) => {
          console.error('Error al buscar paciente:', error);
          this.pacienteEncontrado = null;
          this.historiales = [];
          this.busquedaRealizada = true;
          this.cargando = false;
          if (error.status === 404) {
            this.mensajeError = 'No se encontró ningún paciente con el RUT especificado';
          } else {
            this.mensajeError = 'Ocurrió un error al buscar el paciente. Por favor, intente nuevamente.';
          }
        }
      });
    } else {
      this.mensajeError = 'Por favor, ingrese un RUT válido en formato XX.XXX.XXX-X o XXXXXXXX-X';
    }
  }

  guardarHistorial() {
    if (this.formularioHistorial.valid && this.pacienteEncontrado) {
      // Obtener el valor de la fecha
      const fechaInput = this.formularioHistorial.get('fecha')?.value;
      if (!fechaInput) {
        alert('Por favor, seleccione una fecha de consulta');
        return;
      }
      // Asegurarse de que la fecha está en el formato correcto
      const fecha = new Date(fechaInput);

      const historialClinico = {
        diagnostico: this.formularioHistorial.get('diagnostico')?.value ?? '',
        fecha: fecha.toISOString(),
        observaciones: this.formularioHistorial.get('observaciones')?.value ?? '',
        tratamiento: this.formularioHistorial.get('tratamiento')?.value ?? '',
        medicamentosRecetados: this.formularioHistorial.get('medicamentosRecetados')?.value ?? '',
        pacienteRut: this.pacienteEncontrado.rut // Usar rut en lugar de dni
      };

      console.log('Enviando historial:', historialClinico); // Para debugging

      this.cargando = true;
      this.historialService.crearHistorialClinico(historialClinico).subscribe({
        next: (response) => {
          alert('Historial clínico guardado exitosamente');
          this.formularioHistorial.reset();
          this.cargando = false;
        },
        error: (error) => {
          this.cargando = false;
          console.error('Error completo:', error); // Mostrar el error completo para debugging
          alert('Error al guardar el historial clínico. Por favor, verifica los datos e intenta nuevamente.');
        }
      });
    }
  }

  get rutInvalido(): boolean {
    const control = this.formularioBusqueda.get('rutBusqueda');
    return control ? (control.invalid && (control.touched || control.dirty)) : false;
  }

  get mensajeValidacionRut(): string {
    const control = this.formularioBusqueda.get('rutBusqueda');
    if (control?.errors) {
      if (control.errors['required']) {
        return 'El RUT es requerido';
      }
      if (control.errors['pattern']) {
        return 'El formato del RUT debe ser XX.XXX.XXX-X o XXXXXXXX-X';
      }
    }
    return '';
  }
}
