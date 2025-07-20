import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { FacturaReporteDTO, ProductoMovimientoDTO, ReporteRequest } from '../../models/dashboard.model';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Control de estado
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Datos de reportes
  reporteFacturas: FacturaReporteDTO[] = [];
  reporteProductos: ProductoMovimientoDTO[] = [];
  reporteCompras: any[] = [];

  // Filtros de búsqueda
  filtros: ReporteRequest = {
    fechaInicio: '',
    fechaFin: '',
    categoria: '',
    proveedor: '',
    formato: 'json'
  };

  // Tab activo
  activeTab = 'facturas';

  // Opciones de filtro
  categorias: string[] = [
    'Medicamentos',
    'Suplementos',
    'Cuidado Personal',
    'Primeros Auxilios',
    'Vitaminas',
    'Otros'
  ];

  proveedores: string[] = [
    'Proveedor A',
    'Proveedor B', 
    'Proveedor C',
    'Laboratorio XYZ',
    'Farmacéutica ABC'
  ];

  constructor(private dashboardService: DashboardService) {
    // Establecer fechas por defecto (último mes)
    const hoy = new Date();
    const hace30dias = new Date();
    hace30dias.setDate(hoy.getDate() - 30);

    this.filtros.fechaFin = this.formatDateForInput(hoy);
    this.filtros.fechaInicio = this.formatDateForInput(hace30dias);
  }

  ngOnInit(): void {
    this.loadReporteFacturas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatDateForApi(dateString: string): string {
    return new Date(dateString).toISOString();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.clearMessages();
    
    switch (tab) {
      case 'facturas':
        this.loadReporteFacturas();
        break;
      case 'compras':
        this.loadReporteCompras();
        break;
      case 'productos':
        this.loadReporteProductos();
        break;
    }
  }

  loadReporteFacturas(): void {
    this.loading = true;
    this.clearMessages();

    const request: ReporteRequest = {
      fechaInicio: this.formatDateForApi(this.filtros.fechaInicio),
      fechaFin: this.formatDateForApi(this.filtros.fechaFin),
      categoria: this.filtros.categoria || undefined,
      proveedor: this.filtros.proveedor || undefined,
      formato: 'json'
    };

    this.dashboardService.getReporteFacturas(request)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error cargando reporte de facturas:', error);
          this.error = 'Error al cargar el reporte de facturas';
          return of([]);
        })
      )
      .subscribe(data => {
        this.loading = false;
        this.reporteFacturas = data;
        if (data.length === 0) {
          this.error = 'No se encontraron facturas para los criterios seleccionados';
        }
      });
  }

  loadReporteCompras(): void {
    this.loading = true;
    this.clearMessages();

    const request: ReporteRequest = {
      fechaInicio: this.formatDateForApi(this.filtros.fechaInicio),
      fechaFin: this.formatDateForApi(this.filtros.fechaFin),
      categoria: this.filtros.categoria || undefined,
      proveedor: this.filtros.proveedor || undefined,
      formato: 'json'
    };

    this.dashboardService.getReporteCompras(request)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error cargando reporte de compras:', error);
          this.error = 'Error al cargar el reporte de compras';
          return of([]);
        })
      )
      .subscribe(data => {
        this.loading = false;
        this.reporteCompras = data;
        if (data.length === 0) {
          this.error = 'No se encontraron compras para los criterios seleccionados';
        }
      });
  }

  loadReporteProductos(): void {
    this.loading = true;
    this.clearMessages();

    const request: ReporteRequest = {
      fechaInicio: this.formatDateForApi(this.filtros.fechaInicio),
      fechaFin: this.formatDateForApi(this.filtros.fechaFin),
      categoria: this.filtros.categoria || undefined,
      proveedor: this.filtros.proveedor || undefined,
      formato: 'json'
    };

    this.dashboardService.getReporteProductos(request)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error cargando reporte de productos:', error);
          this.error = 'Error al cargar el reporte de productos';
          return of([]);
        })
      )
      .subscribe(data => {
        this.loading = false;
        this.reporteProductos = data;
        if (data.length === 0) {
          this.error = 'No se encontraron productos para los criterios seleccionados';
        }
      });
  }

  buscarReportes(): void {
    switch (this.activeTab) {
      case 'facturas':
        this.loadReporteFacturas();
        break;
      case 'compras':
        this.loadReporteCompras();
        break;
      case 'productos':
        this.loadReporteProductos();
        break;
    }
  }

  limpiarFiltros(): void {
    this.filtros.categoria = '';
    this.filtros.proveedor = '';
    
    // Restablecer fechas al último mes
    const hoy = new Date();
    const hace30dias = new Date();
    hace30dias.setDate(hoy.getDate() - 30);
    
    this.filtros.fechaFin = this.formatDateForInput(hoy);
    this.filtros.fechaInicio = this.formatDateForInput(hace30dias);
    
    this.buscarReportes();
  }

  descargarExcel(): void {
    this.loading = true;
    this.clearMessages();

    const request: ReporteRequest = {
      fechaInicio: this.formatDateForApi(this.filtros.fechaInicio),
      fechaFin: this.formatDateForApi(this.filtros.fechaFin),
      categoria: this.filtros.categoria || undefined,
      proveedor: this.filtros.proveedor || undefined,
      formato: 'excel'
    };

    let downloadObservable;
    let fileName = '';

    switch (this.activeTab) {
      case 'facturas':
        downloadObservable = this.dashboardService.descargarReporteFacturasExcel(request);
        fileName = `reporte-facturas-${this.formatDateForInput(new Date())}.xlsx`;
        break;
      case 'compras':
        downloadObservable = this.dashboardService.descargarReporteComprasExcel(request);
        fileName = `reporte-compras-${this.formatDateForInput(new Date())}.xlsx`;
        break;
      case 'productos':
        downloadObservable = this.dashboardService.descargarReporteProductosExcel(request);
        fileName = `reporte-productos-${this.formatDateForInput(new Date())}.xlsx`;
        break;
      default:
        this.loading = false;
        this.error = 'Tipo de reporte no válido';
        return;
    }

    downloadObservable
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error descargando Excel:', error);
          this.error = 'Error al generar el archivo Excel';
          return of(null);
        })
      )
      .subscribe(blob => {
        this.loading = false;
        if (blob) {
          this.dashboardService.descargarArchivo(blob, fileName);
          this.successMessage = 'Archivo Excel descargado exitosamente';
          setTimeout(() => this.clearMessages(), 3000);
        }
      });
  }

  clearMessages(): void {
    this.error = null;
    this.successMessage = null;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatNumber(num: number): string {
    return new Intl.NumberFormat('es-CL').format(num);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-CL');
  }

  getTotalFacturas(): number {
    return this.reporteFacturas.reduce((total, factura) => total + factura.montoTotal, 0);
  }
}
