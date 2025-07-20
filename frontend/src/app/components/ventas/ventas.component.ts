import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { 
  Venta, 
  VentaCreateDTO, 
  VentaItemCreateDTO, 
  InventarioResponse, 
  ProductoDisponible, 
  BodegaDisponible 
} from '../../models/venta.model';
import { Paciente } from '../../models/paciente.model';
import { VentaService } from '../../services/venta.service';
import { PacientesService } from '../../services/pacientes.service';

@Component({
  selector: 'app-ventas',
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.css']
})
export class VentasComponent implements OnInit {
  formularioVenta!: FormGroup;
  ventas: Venta[] = [];
  ventasFiltradas: Venta[] = [];
  
  // Datos para selecciones
  productosDisponibles: ProductoDisponible[] = [];
  bodegasDisponibles: BodegaDisponible[] = [];
  inventariosDisponibles: InventarioResponse[][] = []; // Array de arrays para cada item
  inventariosSeleccionados: (InventarioResponse | null)[] = [];
  
  // Estados del componente
  loading = false;
  message = '';
  messageType: 'success' | 'error' | '' = '';
  showFormPanel = true;
  showFilters = false;
  mostrarVentasDeHoy = false;
  
  // Información del paciente
  pacienteEncontrado: Paciente | null = null;
  
  // Warnings y validaciones
  stockWarnings: string[] = [];
  preciosEstimados: number[] = [];
  
  // Resumen de venta
  resumenVenta: {
    subtotal: number;
    discountAmount: number;
    discountPercentage: number;
    totalAmount: number;
  } | null = null;
  
  // Filtros
  filtros = {
    patientRut: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  };
  
  // Modal
  ventaSeleccionada: Venta | null = null;

  constructor(
    private fb: FormBuilder,
    private ventaService: VentaService,
    private pacientesService: PacientesService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadInitialData();
    this.cargarVentas();
  }

  // ========== INICIALIZACIÓN ==========

  private initializeForm(): void {
    this.formularioVenta = this.fb.group({
      patientRut: ['', [
        Validators.required, 
        this.rutValidator.bind(this)
      ]],
      saleItems: this.fb.array([
        this.createSaleItemGroup()
      ])
    });

    // Suscribirse a cambios para actualizar resumen
    this.formularioVenta.valueChanges.subscribe(() => {
      this.calcularResumenVenta();
    });
  }

  private loadInitialData(): void {
    this.cargarProductosDisponibles();
    this.cargarBodegasDisponibles();
  }

  // ========== GETTERS ==========

  get saleItemsArray(): FormArray {
    return this.formularioVenta.get('saleItems') as FormArray;
  }

  // ========== VALIDADORES ==========

  private rutValidator(control: any) {
    if (!control.value) return null;
    
    const rutValido = this.ventaService.validarRutChileno(control.value);
    return rutValido ? null : { rutInvalido: true };
  }

  // ========== MANEJO DEL FORMULARIO ==========

  private createSaleItemGroup(): FormGroup {
    return this.fb.group({
      productId: ['', Validators.required],
      warehouseId: ['', Validators.required],
      batchId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });
  }

  agregarItem(): void {
    this.saleItemsArray.push(this.createSaleItemGroup());
    this.inventariosDisponibles.push([]);
    this.inventariosSeleccionados.push(null);
    this.stockWarnings.push('');
    this.preciosEstimados.push(0);
  }

  removerItem(index: number): void {
    if (this.saleItemsArray.length > 1) {
      this.saleItemsArray.removeAt(index);
      this.inventariosDisponibles.splice(index, 1);
      this.inventariosSeleccionados.splice(index, 1);
      this.stockWarnings.splice(index, 1);
      this.preciosEstimados.splice(index, 1);
    }
  }

  // ========== CARGA DE DATOS ==========

  private cargarProductosDisponibles(): void {
    this.ventaService.obtenerProductosDisponibles().subscribe({
      next: (productos) => {
        this.productosDisponibles = productos;
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        this.showMessage('Error cargando productos disponibles', 'error');
      }
    });
  }

  private cargarBodegasDisponibles(): void {
    this.ventaService.obtenerBodegasDisponibles().subscribe({
      next: (bodegas) => {
        this.bodegasDisponibles = bodegas;
      },
      error: (error) => {
        console.error('Error cargando bodegas:', error);
        this.showMessage('Error cargando bodegas disponibles', 'error');
      }
    });
  }

  private cargarVentas(): void {
    this.loading = true;
    
    const observable = this.mostrarVentasDeHoy 
      ? this.ventaService.obtenerVentasDeHoy() 
      : this.ventaService.obtenerTodas();
    
    observable.subscribe({
      next: (ventas) => {
        this.ventas = ventas;
        this.aplicarFiltros();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando ventas:', error);
        this.showMessage('Error cargando ventas', 'error');
        this.loading = false;
      }
    });
  }

  // ========== SELECCIONES EN FORMULARIO ==========

  buscarPaciente(): void {
    const rut = this.formularioVenta.get('patientRut')?.value;
    if (!rut || !this.ventaService.validarRutChileno(rut)) return;

    this.loading = true;
    
    // Quitar puntos del RUT para la búsqueda en el backend
    const rutParaBusqueda = rut.replace(/\./g, '');
    
    this.pacientesService.buscarPorRut(rutParaBusqueda).subscribe({
      next: (paciente: Paciente) => {
        this.pacienteEncontrado = paciente;
        this.loading = false;
        this.calcularResumenVenta(); // Recalcular con información de beneficiario
      },
      error: (error: any) => {
        console.error('Error buscando paciente:', error);
        this.showMessage('Paciente no encontrado', 'error');
        this.pacienteEncontrado = null;
        this.loading = false;
      }
    });
  }

  onProductoSeleccionado(itemIndex: number, event: any): void {
    const productId = event.target.value;
    if (!productId) return;

    // Limpiar selecciones dependientes
    const itemControl = this.saleItemsArray.at(itemIndex);
    itemControl.patchValue({
      warehouseId: '',
      batchId: ''
    });

    this.inventariosDisponibles[itemIndex] = [];
    this.inventariosSeleccionados[itemIndex] = null;
    this.stockWarnings[itemIndex] = '';
  }

  onBodegaSeleccionada(itemIndex: number, event: any): void {
    const warehouseId = event.target.value;
    const productId = this.saleItemsArray.at(itemIndex).get('productId')?.value;
    
    if (!warehouseId || !productId) return;

    // Limpiar lote seleccionado
    this.saleItemsArray.at(itemIndex).patchValue({ batchId: '' });

    // Cargar inventarios para esta combinación producto-bodega
    this.ventaService.obtenerInventariosPorBodega(Number(warehouseId)).subscribe({
      next: (inventarios) => {
        // Filtrar por producto
        this.inventariosDisponibles[itemIndex] = inventarios.filter(
          inv => inv.productId === Number(productId) && inv.currentStock > 0
        );
      },
      error: (error) => {
        console.error('Error cargando inventarios:', error);
        this.showMessage('Error cargando inventarios disponibles', 'error');
      }
    });
  }

  onLoteSeleccionado(itemIndex: number, event: any): void {
    const batchId = event.target.value;
    if (!batchId) return;

    const inventario = this.inventariosDisponibles[itemIndex].find(
      inv => inv.batchId === Number(batchId)
    );
    
    if (inventario) {
      this.inventariosSeleccionados[itemIndex] = inventario;
      this.preciosEstimados[itemIndex] = 1000; // Precio estimado, debería venir de un servicio
      this.validarStock(itemIndex);
    }
  }

  validarStock(itemIndex: number): void {
    const item = this.saleItemsArray.at(itemIndex);
    const cantidad = item.get('quantity')?.value;
    const inventario = this.inventariosSeleccionados[itemIndex];

    if (!inventario || !cantidad) {
      this.stockWarnings[itemIndex] = '';
      return;
    }

    if (cantidad > inventario.currentStock) {
      this.stockWarnings[itemIndex] = `Stock insuficiente. Disponible: ${inventario.currentStock}`;
    } else if (cantidad > inventario.currentStock * 0.8) {
      this.stockWarnings[itemIndex] = `Advertencia: Quedará poco stock (${inventario.currentStock - cantidad})`;
    } else {
      this.stockWarnings[itemIndex] = '';
    }
  }

  // ========== CÁLCULOS ==========

  private calcularResumenVenta(): void {
    if (!this.pacienteEncontrado) {
      this.resumenVenta = null;
      return;
    }

    let subtotal = 0;
    
    this.saleItemsArray.controls.forEach((itemControl, index) => {
      const cantidad = itemControl.get('quantity')?.value || 0;
      const precioUnitario = this.preciosEstimados[index] || 0;
      subtotal += cantidad * precioUnitario;
    });

    // Calcular descuento si es beneficiario
    let discountPercentage = 0;
    if (this.pacienteEncontrado.esBeneficiario) {
      discountPercentage = this.pacienteEncontrado.tipoBeneficio === 'ADULTO_MAYOR' ? 15 : 10;
    }

    const discountAmount = (subtotal * discountPercentage) / 100;
    const totalAmount = subtotal - discountAmount;

    this.resumenVenta = {
      subtotal,
      discountAmount,
      discountPercentage,
      totalAmount
    };
  }

  calcularTotalVentas(): number {
    return this.ventasFiltradas.reduce((total, venta) => total + venta.totalAmount, 0);
  }

  // ========== SUBMIT ==========

  onSubmit(): void {
    if (this.formularioVenta.invalid || !this.pacienteEncontrado) {
      this.showMessage('Por favor complete todos los campos requeridos', 'error');
      return;
    }

    // Validar stock para todos los items
    let stockValido = true;
    this.saleItemsArray.controls.forEach((_, index) => {
      this.validarStock(index);
      if (this.stockWarnings[index].includes('insuficiente')) {
        stockValido = false;
      }
    });

    if (!stockValido) {
      this.showMessage('Hay items con stock insuficiente. Revise las cantidades.', 'error');
      return;
    }

    this.loading = true;

    // Quitar puntos del RUT antes de enviar al backend
    const rutCliente = this.formularioVenta.get('patientRut')?.value;
    const rutSinPuntos = rutCliente ? rutCliente.replace(/\./g, '') : '';

    const ventaData: VentaCreateDTO = {
      patientRut: rutSinPuntos,
      saleItems: this.saleItemsArray.value as VentaItemCreateDTO[]
    };

    this.ventaService.crearVenta(ventaData).subscribe({
      next: (venta) => {
        this.showMessage(`Venta #${venta.id} creada exitosamente`, 'success');
        this.resetForm();
        this.cargarVentas();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error creando venta:', error);
        this.showMessage(error.message || 'Error al crear la venta', 'error');
        this.loading = false;
      }
    });
  }

  // ========== ACCIONES DE VENTA ==========

  cancelarVenta(ventaId: number): void {
    if (!confirm('¿Está seguro que desea cancelar esta venta?')) return;

    this.loading = true;
    this.ventaService.cancelarVenta(ventaId).subscribe({
      next: (venta) => {
        this.showMessage(`Venta #${venta.id} cancelada`, 'success');
        this.cargarVentas();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cancelando venta:', error);
        this.showMessage('Error al cancelar la venta', 'error');
        this.loading = false;
      }
    });
  }

  verDetalleVenta(venta: Venta): void {
    this.ventaSeleccionada = venta;
  }

  cerrarModalDetalle(): void {
    this.ventaSeleccionada = null;
  }

  // ========== FILTROS ==========

  toggleVentasDeHoy(): void {
    this.mostrarVentasDeHoy = !this.mostrarVentasDeHoy;
    this.cargarVentas();
  }

  toggleFiltros(): void {
    this.showFilters = !this.showFilters;
  }

  aplicarFiltros(): void {
    this.ventasFiltradas = this.ventas.filter(venta => {
      // Filtro por RUT
      if (this.filtros.patientRut && 
          !venta.patientRut.toLowerCase().includes(this.filtros.patientRut.toLowerCase())) {
        return false;
      }

      // Filtro por estado
      if (this.filtros.status && venta.status !== this.filtros.status) {
        return false;
      }

      // Filtro por fecha desde
      if (this.filtros.dateFrom) {
        const fechaVenta = new Date(venta.saleDate!);
        const fechaDesde = new Date(this.filtros.dateFrom);
        if (fechaVenta < fechaDesde) return false;
      }

      // Filtro por fecha hasta
      if (this.filtros.dateTo) {
        const fechaVenta = new Date(venta.saleDate!);
        const fechaHasta = new Date(this.filtros.dateTo);
        fechaHasta.setHours(23, 59, 59, 999); // Incluir todo el día
        if (fechaVenta > fechaHasta) return false;
      }

      return true;
    });
  }

  limpiarFiltros(): void {
    this.filtros = {
      patientRut: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    };
    this.aplicarFiltros();
  }

  // ========== CONTROLES DE INTERFAZ ==========

  toggleFormPanel(): void {
    this.showFormPanel = !this.showFormPanel;
  }

  resetForm(): void {
    this.formularioVenta.reset();
    this.formularioVenta.setControl('saleItems', this.fb.array([this.createSaleItemGroup()]));
    
    // Limpiar arrays auxiliares
    this.inventariosDisponibles = [[]];
    this.inventariosSeleccionados = [null];
    this.stockWarnings = [''];
    this.preciosEstimados = [0];
    this.pacienteEncontrado = null;
    this.resumenVenta = null;
  }

  // ========== UTILIDADES ==========

  isFieldInvalid(fieldName: string): boolean {
    const field = this.formularioVenta.get(fieldName);
    return field ? (field.invalid && (field.touched || field.dirty)) : false;
  }

  isItemFieldInvalid(itemIndex: number, fieldName: string): boolean {
    const field = this.saleItemsArray.at(itemIndex).get(fieldName);
    return field ? (field.invalid && (field.touched || field.dirty)) : false;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'PENDING': 'Pendiente',
      'COMPLETED': 'Completada',
      'CANCELLED': 'Cancelada'
    };
    return labels[status] || status;
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
    
    setTimeout(() => {
      this.message = '';
      this.messageType = '';
    }, 5000);
  }
}
