import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html'
})
export class InventarioComponent {
  formularioInventario = this.fb.group({
    nombreProducto: [''],
    codigo: [''],
    cantidad: [0],
    fechaIngreso: [''],
    bodega: [''],
    lote: ['']
  });

  bodegas = ['Central', 'Norte', 'Sur'];

  constructor(private fb: FormBuilder) {}
}
