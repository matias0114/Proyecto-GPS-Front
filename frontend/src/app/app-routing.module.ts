// src/app/app-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { InventarioComponent } from './components/inventario/inventario.component';
import { FacturasComponent } from './components/facturas/facturas.component';
import { HistorialPacienteComponent } from './components/historial-pacientes/historial-pacientes.component';
import { MenuComponent } from './components/menu/menu.component';
import { PacientesComponent } from './components/pacientes/pacientes.component';
import { PreciosComponent } from './components/precios/precios.component';

const routes: Routes = [
  { path: '', redirectTo: '/menu', pathMatch: 'full' },
  { path: 'menu', component: MenuComponent },
  { path: 'inventario', component: InventarioComponent },
  { path: 'pacientes', component: PacientesComponent },
  { path: 'historial-pacientes', component: HistorialPacienteComponent },
  { path: 'facturas', component: FacturasComponent },
  { path: 'precios', component: PreciosComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
