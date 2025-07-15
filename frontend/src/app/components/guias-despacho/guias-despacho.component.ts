import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GuiaDespacho } from '../../models/guia-despacho.model';
import { GuiaDespachoService } from '../../services/guia-despacho.service';

@Component({
  selector: 'app-guias-despacho',
  templateUrl: './guias-despacho.component.html',
  styleUrls: ['./guias-despacho.component.css']
})
export class GuiasDespachoComponent implements OnInit {
  formulario!: FormGroup;
  guias: GuiaDespacho[] = [];
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private guiaService: GuiaDespachoService
  ) {}

  ngOnInit(): void {
    this.formulario = this.fb.group({
      numeroGuia: ['', Validators.required],
      facturaId: [null, Validators.required],
      transportista: ['', Validators.required],
      estado: ['PENDIENTE', Validators.required]
    });
    this.cargarGuias();
  }

  cargarGuias() {
    this.guiaService.obtenerTodas()
      .subscribe(list => this.guias = list,
                 () => this.errorMessage = 'Error cargando guías');
  }

  onSubmit() {
    if (this.formulario.invalid) {
      this.errorMessage = 'Completa todos los campos.';
      return;
    }
    const g: GuiaDespacho = this.formulario.value;
    this.guiaService.crear(g)
      .subscribe({
        next: guia => {
          this.successMessage = `Guía ${guia.numeroGuia} creada.`;
          this.formulario.reset({ estado: 'PENDIENTE' });
          this.cargarGuias();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: () => {
          this.errorMessage = 'Error al crear la guía.';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
  }

  eliminar(id: number) {
    if (!confirm('¿Eliminar esta guía?')) return;
    this.guiaService.eliminar(id)
      .subscribe(() => this.cargarGuias(),
                 () => this.errorMessage = 'Error eliminando guía');
  }
}
