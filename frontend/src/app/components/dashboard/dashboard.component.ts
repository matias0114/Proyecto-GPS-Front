import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardDTO, ProductoMovimientoDTO, ChartData } from '../../models/dashboard.model';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('facturasChart', { static: false }) facturasChartRef!: ElementRef<HTMLCanvasElement>;
  
  private destroy$ = new Subject<void>();
  private chart: Chart | null = null;
  
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

  constructor(private dashboardService: DashboardService) { 
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadProductosTopMovimiento();
  }

  ngAfterViewInit(): void {
    // Esperar un ciclo de detección de cambios antes de crear el gráfico
    setTimeout(() => {
      if (this.facturasChartData) {
        this.createChart();
      }
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
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

      console.log('Chart data prepared:', this.facturasChartData);
      
      // Crear el gráfico después de que los datos estén listos
      // Usar setTimeout para asegurar que el ViewChild esté disponible
      setTimeout(() => {
        this.createChart();
      }, 100);
    } else {
      console.warn('No data available for chart');
    }
  }

  private createChart(): void {
    // Verificar que todos los elementos necesarios estén disponibles
    if (!this.facturasChartRef || !this.facturasChartRef.nativeElement || !this.facturasChartData) {
      console.warn('Chart elements not ready, retrying...');
      setTimeout(() => this.createChart(), 200);
      return;
    }

    // Destruir gráfico existente si existe
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const ctx = this.facturasChartRef.nativeElement.getContext('2d');
    if (!ctx) {
      console.error('Could not get 2D context from canvas');
      return;
    }

    try {
      const config: ChartConfiguration = {
        type: 'line' as ChartType,
        data: this.facturasChartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            intersect: false,
            mode: 'index'
          },
          plugins: {
            legend: {
              position: 'top' as const,
              labels: {
                color: '#333',
                font: {
                  size: 12
                }
              }
            },
            title: {
              display: true,
              text: 'Evolución de Facturas - Últimos 12 Meses',
              color: '#333',
              font: {
                size: 16,
                weight: 'bold'
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: '#666'
              },
              grid: {
                color: '#e0e0e0'
              }
            },
            x: {
              ticks: {
                color: '#666'
              },
              grid: {
                color: '#e0e0e0'
              }
            }
          },
          elements: {
            line: {
              tension: 0.4
            },
            point: {
              radius: 4,
              hoverRadius: 6
            }
          }
        }
      };

      this.chart = new Chart(ctx, config);
      console.log('Chart created successfully');
    } catch (error) {
      console.error('Error creating chart:', error);
    }
  }

  refreshData(): void {
    this.loadDashboardData();
    this.loadProductosTopMovimiento();
  }

  // Método público para recrear el gráfico manualmente si es necesario
  recreateChart(): void {
    console.log('Recreating chart manually...');
    if (this.facturasChartData) {
      this.createChart();
    } else {
      console.warn('No chart data available for recreation');
    }
  }

  // Método para verificar el estado del gráfico (útil para debugging)
  checkChartStatus(): void {
    console.log('Chart status:', {
      hasChartRef: !!this.facturasChartRef,
      hasChartData: !!this.facturasChartData,
      hasChart: !!this.chart,
      dashboardDataLoaded: !!this.dashboardData
    });
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

  // Métodos auxiliares para el template (evitar warnings de optional chaining)
  getChartDataPointsCount(): number {
    return this.facturasChartData?.datasets?.[0]?.data?.length || 0;
  }

  getChartLabelsCount(): number {
    return this.facturasChartData?.labels?.length || 0;
  }
}
