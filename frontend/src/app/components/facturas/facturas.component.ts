import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Factura } from '../../models/factura.model';
import { FacturaService } from '../../services/facturas.service';

@Component({
  selector: 'app-facturas',
  templateUrl: './facturas.component.html',
  styleUrls: ['./facturas.component.css']
})
export class FacturasComponent implements OnInit {
  formulario!: FormGroup;
  facturas: Factura[] = [];
  successMessage = '';
  errorMessage = '';

  comprasIds: number[] = [];

  constructor(
    private fb: FormBuilder,
    private facturaService: FacturaService
  ) {}

  ngOnInit(): void {
    this.formulario = this.fb.group({
      numeroFactura: ['', Validators.required],
      compraId: [null, Validators.required],
      montoTotal: [null, [Validators.required, Validators.min(0.01)]],
      rutProveedor: ['', Validators.required]
    });
    this.cargarFacturas();
    // Opcional: cargar compras para dropdown
    this.facturaService.obtenerTodas().subscribe(); // o usar CompraService
  }

  cargarFacturas() {
    this.facturaService.obtenerTodas()
      .subscribe(list => this.facturas = list,
                 () => this.errorMessage = 'Error cargando facturas');
  }

  onSubmit() {
    if (this.formulario.invalid) {
      this.errorMessage = 'Completa todos los campos.';
      return;
    }
    const f: Factura = this.formulario.value;
    this.facturaService.crear(f)
      .subscribe({
        next: fac => {
          this.successMessage = `Factura ${fac.numeroFactura} creada.`;
          this.formulario.reset();
          this.cargarFacturas();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: () => {
          this.errorMessage = 'Error al crear la factura.';
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
  }

  eliminar(id: number) {
    if (!confirm('¿Eliminar esta factura?')) return;
    this.facturaService.eliminar(id)
      .subscribe(() => this.cargarFacturas(),
                 () => this.errorMessage = 'Error eliminando factura');
  }
}
