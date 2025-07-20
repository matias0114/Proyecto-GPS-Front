import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MenuComponent } from './components/menu/menu.component';
import { HttpClientModule } from '@angular/common/http';  // ← añadido
import { InventarioComponent } from './components/inventario/inventario.component';
import { PreciosComponent } from './components/precios/precios.component';
import { PacientesComponent } from './components/pacientes/pacientes.component';
import { FacturasComponent } from './components/facturas/facturas.component';
import { HistorialPacienteComponent } from './components/historial-pacientes/historial-pacientes.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComprasComponent } from './components/compras/compras.component';
import { GuiasDespachoComponent } from './components/guias-despacho/guias-despacho.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ReportesComponent } from './components/reportes/reportes.component';

@NgModule({
  declarations: [
    AppComponent,
    MenuComponent,
    InventarioComponent,
    PreciosComponent,
    PacientesComponent,
    FacturasComponent,
    HistorialPacienteComponent,
    ComprasComponent,
    GuiasDespachoComponent,
    DashboardComponent,
    ReportesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
