import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-precios',
  templateUrl: './precios.component.html'
})
export class PreciosComponent {
  formularioPrecio = this.fb.group({
    nombreProducto: [''],
    codigo: [''],
    precio: [0],
    fechaVigencia: ['']
  });

  constructor(private fb: FormBuilder) {}
}
