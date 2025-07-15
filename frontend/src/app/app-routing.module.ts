import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Importación de componentes
import { MenuComponent } from './components/menu/menu.component';
import { PacientesComponent } from './components/pacientes/pacientes.component';
import { HistorialPacienteComponent } from './components/historial-pacientes/historial-pacientes.component';
import { InventarioComponent } from './components/inventario/inventario.component';
import { FacturasComponent } from './components/facturas/facturas.component';
import { ComprasComponent } from './components/compras/compras.component';
import { PreciosComponent } from './components/precios/precios.component';
import { GuiasDespachoComponent } from './components/guias-despacho/guias-despacho.component';

// Definir rutas
const routes: Routes = [
  { path: '', redirectTo: '/menu', pathMatch: 'full' },
  { path: 'menu', component: MenuComponent },
  { path: 'pacientes', component: PacientesComponent },
  { path: 'historial-pacientes', component: HistorialPacienteComponent },
  { path: 'inventario', component: InventarioComponent },
  { path: 'facturas', component: FacturasComponent },
  { path: 'compras', component: ComprasComponent },
  { path: 'precios', component: PreciosComponent },
  { path: 'guias-despacho', component: GuiasDespachoComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],  // Asegúrate de usar forRoot()
  exports: [RouterModule]
})
export class AppRoutingModule {}
