import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-facturas',
  templateUrl: './facturas.component.html'
})
export class FacturasComponent {
  formularioFactura = this.fb.group({
    numeroFactura: [''],
    proveedor: [''],
    fechaEmision: [''],
    tipoDocumento: [''],
    productos: ['']
  });

  tiposDocumento = ['Factura', 'Guía de Despacho'];

  constructor(private fb: FormBuilder) {}
}
