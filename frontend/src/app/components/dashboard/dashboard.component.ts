import { Component, OnInit, OnDestroy } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardDTO, ProductoMovimientoDTO, ChartData } from '../../models/dashboard.model';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  dashboardData: DashboardDTO | null = null;
  loading = false;
  error: string | null = null;

  // Datos para gráficos
  facturasChartData: ChartData | null = null;
  productosTopMovimiento: ProductoMovimientoDTO[] = [];

  // Configuración de gráficos
  chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Facturas Últimos 12 Meses'
      }
    }
  };

  chartColors = {
    primary: 'rgba(54, 162, 235, 0.8)',
    primaryBorder: 'rgba(54, 162, 235, 1)',
    success: 'rgba(75, 192, 192, 0.8)',
    successBorder: 'rgba(75, 192, 192, 1)',
    warning: 'rgba(255, 206, 86, 0.8)',
    warningBorder: 'rgba(255, 206, 86, 1)',
    danger: 'rgba(255, 99, 132, 0.8)',
    dangerBorder: 'rgba(255, 99, 132, 1)'
  };

  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadProductosTopMovimiento();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    this.dashboardService.getDashboardMetrics()
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error cargando datos del dashboard:', error);
          this.error = 'Error al cargar los datos del dashboard';
          return of(null);
        })
      )
      .subscribe(data => {
        this.loading = false;
        if (data) {
          this.dashboardData = data;
          this.prepareChartData(data);
        }
      });
  }

  loadProductosTopMovimiento(): void {
    this.dashboardService.getProductosConMayorMovimiento(10)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error cargando productos top:', error);
          return of([]);
        })
      )
      .subscribe(productos => {
        this.productosTopMovimiento = productos;
      });
  }

  prepareChartData(data: DashboardDTO): void {
    if (data.facturasUltimos12Meses && data.facturasUltimos12Meses.length > 0) {
      const labels = data.facturasUltimos12Meses.map(item => item[0]);
      const values = data.facturasUltimos12Meses.map(item => item[1]);

      this.facturasChartData = {
        labels,
        datasets: [{
          label: 'Facturas por Mes',
          data: values,
          backgroundColor: this.chartColors.primary,
          borderColor: this.chartColors.primaryBorder,
          borderWidth: 2
        }]
      };
    }
  }

  refreshData(): void {
    this.loadDashboardData();
    this.loadProductosTopMovimiento();
  }

  // Métodos auxiliares para mostrar porcentajes y estadísticas
  getFacturasProgress(): number {
    if (!this.dashboardData || this.dashboardData.totalFacturas === 0) return 0;
    return (this.dashboardData.facturasMesActual / this.dashboardData.totalFacturas) * 100;
  }

  getComprasProgress(): number {
    if (!this.dashboardData || this.dashboardData.totalCompras === 0) return 0;
    return (this.dashboardData.comprasRecibidas / this.dashboardData.totalCompras) * 100;
  }

  getProductosActivosProgress(): number {
    if (!this.dashboardData || this.dashboardData.totalProductos === 0) return 0;
    return (this.dashboardData.productosActivos / this.dashboardData.totalProductos) * 100;
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
}
