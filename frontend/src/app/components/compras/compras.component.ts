import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Compra } from '../../models/compra.model';
import { CompraService } from '../../services/compra.service';

@Component({
  selector: 'app-compras',
  templateUrl: './compras.component.html',
  styleUrls: ['./compras.component.css']
})
export class ComprasComponent implements OnInit {
  formulario!: FormGroup;
  compras: Compra[] = [];
  successMessage = '';
  errorMessage = '';

  estados = ['PENDIENTE', 'APROBADA', 'CANCELADA'];

  constructor(
    private fb: FormBuilder,
    private compraService: CompraService
  ) {}

  ngOnInit(): void {
    this.formulario = this.fb.group({
      numeroOrden: ['', Validators.required],
      montoTotal: [null, [Validators.required, Validators.min(0.01)]],
      proveedor: ['', Validators.required],
      estado: ['PENDIENTE']
    });
    this.cargarCompras();
  }

  cargarCompras() {
    this.compraService.obtenerTodas()
      .subscribe(list => this.compras = list,
                 () => this.errorMessage = 'Error cargando compras');
  }

  onSubmit() {
    if (this.formulario.invalid) {
      this.errorMessage = 'Por favor completa todos los campos.';
      return;
    }
    const data: Compra = this.formulario.value;
    this.compraService.crearCompra(data)
      .subscribe({
        next: c => {
          this.successMessage = `Compra ${c.numeroOrden} creada.`;
          this.formulario.reset({ estado: 'PENDIENTE' });
          this.cargarCompras();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: () => {
          this.errorMessage = 'No se pudo crear la compra.';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
  }

  eliminar(id: number) {
    if (!confirm('¿Eliminar esta compra?')) return;
    this.compraService.eliminarCompra(id)
      .subscribe(() => this.cargarCompras(),
                 () => this.errorMessage = 'Error eliminando compra');
  }
}
