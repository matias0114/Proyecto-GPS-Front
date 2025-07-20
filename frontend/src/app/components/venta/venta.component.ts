import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { VentaService } from '../../services/venta.service';
import { PacientesService } from '../../services/pacientes.service';

export interface ProductoVenta {
  id: number;
  codigo: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
}

export interface ItemVenta {
  productoId: number;
  productName?: string;  // Agregamos el nombre del producto
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface VentaRequest {
  clienteRut?: string;
  clienteNombre?: string;
  items: ItemVenta[];
  total: number;
  metodoPago: string;
  observaciones?: string;
}

export interface VentaResponse {
  id: number;
  numeroVenta: string;
  fecha: string;
  clienteRut?: string;
  clienteNombre?: string;
  items: ItemVenta[];
  subtotal: number;
  impuestos: number;
  total: number;
  metodoPago: string;
  estado: string;
  observaciones?: string;
}

@Component({
  selector: 'app-venta',
  templateUrl: './venta.component.html',
  styleUrls: ['./venta.component.css']
})
export class VentaComponent implements OnInit {
  formularioVenta: FormGroup;
  productosDisponibles: ProductoVenta[] = [];
  ventasRealizadas: VentaResponse[] = [];
  
  // Estados del componente
  loading = false;
  message = '';
  messageType: 'success' | 'error' | '' = '';
  showFormPanel = true;
  showVentasPanel = false;
  
  // Variables de cálculo
  subtotal = 0;
  impuestos = 0;
  total = 0;
  
  // Métodos de pago disponibles
  metodosPago = [
    { value: 'EFECTIVO', label: 'Efectivo' },
    { value: 'TARJETA_DEBITO', label: 'Tarjeta de Débito' },
    { value: 'TARJETA_CREDITO', label: 'Tarjeta de Crédito' },
    { value: 'TRANSFERENCIA', label: 'Transferencia Bancaria' }
  ];

  constructor(
    private fb: FormBuilder,
    private ventaService: VentaService,
    private pacientesService: PacientesService
  ) {
    this.formularioVenta = this.fb.group({
      clienteRut: ['', Validators.required],
      clienteNombre: [''],
      metodoPago: ['EFECTIVO', Validators.required],
      observaciones: [''],
      items: this.fb.array([this.crearItemVenta()])
    });
  }

  ngOnInit(): void {
    this.cargarProductosDisponibles();
    this.cargarVentasRealizadas();
    this.setupFormSubscriptions();
  }

  // ========== GETTERS ==========
  get itemsArray(): FormArray {
    return this.formularioVenta.get('items') as FormArray;
  }

  // ========== INICIALIZACIÓN ==========
  private setupFormSubscriptions(): void {
    // Suscribirse a cambios en los items para recalcular totales
    this.itemsArray.valueChanges.subscribe(() => {
      this.calcularTotales();
    });
  }

  private crearItemVenta(): FormGroup {
    return this.fb.group({
      productoId: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioUnitario: [0],
      subtotal: [0]
    });
  }

  // ========== MANEJO DE CLIENTE ==========
  onRutChange(): void {
    const rut = this.formularioVenta.get('clienteRut')?.value;
    if (!rut) {
      this.formularioVenta.patchValue({ clienteNombre: '' });
      return;
    }

    // Validar formato del RUT
    if (!this.ventaService.validarRutChileno(rut)) {
      this.formularioVenta.get('clienteRut')?.setErrors({ invalidRut: true });
      this.formularioVenta.patchValue({ clienteNombre: '' });
      return;
    }

    // Formatear el RUT para mostrar en la UI
    const rutFormateado = this.ventaService.formatearRut(rut);
    this.formularioVenta.patchValue({ clienteRut: rutFormateado });

    // Quitar puntos del RUT para la búsqueda en el backend
    const rutParaBusqueda = rutFormateado.replace(/\./g, '');

    // Buscar el paciente directamente en el servicio de pacientes
    this.pacientesService.buscarPorRut(rutParaBusqueda).subscribe({
      next: (paciente: any) => {
        if (paciente && paciente.nombre) {
          const nombreCompleto = `${paciente.nombre} ${paciente.apellido || ''}`.trim();
          this.formularioVenta.patchValue({ clienteNombre: nombreCompleto });
          this.showMessage(`Paciente encontrado: ${nombreCompleto}`, 'success');
        } else {
          this.formularioVenta.patchValue({ clienteNombre: '' });
          this.showMessage('Paciente no encontrado en el sistema.', 'error');
        }
      },
      error: (error: any) => {
        console.error('Error buscando paciente:', error);
        this.formularioVenta.patchValue({ clienteNombre: '' });
        if (error.status === 404) {
          this.showMessage('Paciente no encontrado. Se creará uno nuevo al procesar la venta.', 'error');
        } else {
          this.showMessage('Error al buscar información del paciente', 'error');
        }
      }
    });
  }

  // ========== MANEJO DE ITEMS ==========
  agregarItem(): void {
    this.itemsArray.push(this.crearItemVenta());
  }

  removerItem(index: number): void {
    if (this.itemsArray.length > 1) {
      this.itemsArray.removeAt(index);
      this.calcularTotales();
    }
  }

  onProductoSeleccionado(index: number, productoId: string | number): void {
    const id = typeof productoId === 'string' ? parseInt(productoId) : productoId;
    const producto = this.productosDisponibles.find(p => p.id === id);
    if (producto) {
      const itemControl = this.itemsArray.at(index);
      itemControl.patchValue({
        precioUnitario: producto.precio
      });
      this.calcularSubtotalItem(index);
    }
  }

  onCantidadChanged(index: number): void {
    this.calcularSubtotalItem(index);
  }

  private calcularSubtotalItem(index: number): void {
    const itemControl = this.itemsArray.at(index);
    const cantidad = itemControl.get('cantidad')?.value || 0;
    const precioUnitario = itemControl.get('precioUnitario')?.value || 0;
    const subtotal = cantidad * precioUnitario;
    
    itemControl.patchValue({
      subtotal: subtotal
    }, { emitEvent: false });
    
    this.calcularTotales();
  }

  private calcularTotales(): void {
    this.subtotal = this.itemsArray.controls.reduce((total, item) => {
      return total + (item.get('subtotal')?.value || 0);
    }, 0);
    
    // IVA 19%
    this.impuestos = this.subtotal * 0.19;
    this.total = this.subtotal + this.impuestos;
  }

  // ========== CARGA DE DATOS ==========
  // Una vez que tengamos claro que los console.log funcionan, podemos limpiar esta función
  private async cargarProductosDisponibles(): Promise<void> {
    this.loading = true;
    
    try {
      // Primero intentamos cargar inventarios
      const inventarios = await this.ventaService.obtenerInventariosDisponibles().toPromise();
      console.log('Inventarios recibidos:', inventarios);
      
      if (inventarios && inventarios.length > 0) {
        // Procesamos inventarios
        const productosMap = new Map<number, ProductoVenta>();
        
        inventarios.forEach((inventario: any) => {
          const productoId = inventario.productId;
          const stockActual = Number(inventario.currentStock) || 0;
          
          console.log(`Procesando inventario para producto ${productoId}:`, {
            productId: inventario.productId,
            productName: inventario.productName,
            currentStock: inventario.currentStock,
            stockActual: stockActual
          });
          
          if (productosMap.has(productoId)) {
            const producto = productosMap.get(productoId)!;
            producto.stock += stockActual;
          } else {
            productosMap.set(productoId, {
              id: productoId,
              codigo: inventario.productCode || '',
              nombre: inventario.productName || 'Producto sin nombre',
              precio: 0,
              stock: stockActual,
              categoria: 'General'
            });
          }
        });

        this.productosDisponibles = Array.from(productosMap.values());
        console.log('Productos disponibles después de inventarios:', this.productosDisponibles);
        
        // Cargar precios
        try {
          const productos = await this.ventaService.obtenerProductosDisponibles().toPromise();
          productos?.forEach((producto: any) => {
            const productoEnStock = this.productosDisponibles.find(p => p.id === producto.id);
            if (productoEnStock) {
              productoEnStock.precio = producto.basePrice || 0;
            }
          });
          console.log('Productos disponibles después de precios:', this.productosDisponibles);
        } catch (error) {
          console.warn('Error cargando precios:', error);
        }
        
      } else {
        throw new Error('No se recibieron inventarios');
      }
      
    } catch (error) {
      console.error('Error cargando inventarios, usando fallback:', error);
      
      // Fallback: cargar productos directamente
      try {
        const productos = await this.ventaService.obtenerProductosDisponibles().toPromise();
        this.productosDisponibles = productos?.map((producto: any) => ({
          id: producto.id,
          codigo: producto.code || producto.productCode || '',
          nombre: producto.name || producto.productName || 'Producto sin nombre',
          precio: producto.basePrice || 0,
          stock: 0, // Sin información de stock
          categoria: producto.category || 'General'
        })) || [];
        
        this.showMessage('Productos cargados sin información de stock real', 'error');
        console.log('Productos en fallback:', this.productosDisponibles);
        
      } catch (fallbackError) {
        console.error('Error en fallback:', fallbackError);
        this.showMessage('Error al cargar productos disponibles', 'error');
      }
    } finally {
      this.loading = false;
    }
  }

  private cargarVentasRealizadas(): void {
    this.ventaService.obtenerTodas().subscribe({
      next: (ventas: any[]) => {
        // Adaptamos la respuesta del backend a nuestro modelo
        this.ventasRealizadas = ventas.map((venta: any) => ({
          id: venta.id,
          numeroVenta: `V-${venta.id.toString().padStart(6, '0')}`,
          fecha: venta.saleDate || new Date().toISOString(),
          clienteRut: venta.patientRut,
          clienteNombre: venta.patientName,
          items: (venta.saleItems || []).map((item: any) => ({
            productoId: item.productId,
            productName: item.productName,
            cantidad: item.quantity,
            precioUnitario: item.unitPrice,
            subtotal: item.totalPrice
          })),
          subtotal: venta.subtotal || 0,
          impuestos: (venta.totalAmount || 0) - (venta.subtotal || 0),
          total: venta.totalAmount || 0,
          metodoPago: 'EFECTIVO', // TODO: obtener método real
          estado: venta.status || 'COMPLETADA',
          observaciones: ''
        }));
      },
      error: (error: any) => {
        console.error('Error cargando ventas:', error);
        this.showMessage('Error al cargar historial de ventas', 'error');
      }
    });
  }

  // ========== ENVÍO DEL FORMULARIO ==========
  onSubmit(): void {
    if (this.formularioVenta.invalid) {
      this.markFormGroupTouched(this.formularioVenta);
      this.showMessage('Por favor complete todos los campos requeridos', 'error');
      return;
    }

    // Validar que haya al menos un item con cantidad > 0
    const items = this.itemsArray.value;
    const itemsValidos = items.filter((item: any) => item.productoId && item.cantidad > 0);
    
    if (itemsValidos.length === 0) {
      this.showMessage('Debe agregar al menos un producto a la venta', 'error');
      return;
    }

    // Validar stock disponible
    const itemsConStockInsuficiente = itemsValidos.filter((item: any) => {
      const producto = this.productosDisponibles.find(p => p.id === item.productoId);
      const stockInsuficiente = producto && item.cantidad > producto.stock;
      if (stockInsuficiente) {
        console.log(`Stock insuficiente - Producto: ${producto.nombre}, Solicitado: ${item.cantidad}, Disponible: ${producto.stock}`);
      }
      return stockInsuficiente;
    });

    if (itemsConStockInsuficiente.length > 0) {
      this.showMessage('Algunos productos no tienen stock suficiente', 'error');
      return;
    }

    this.loading = true;
    
    // Adaptar al formato esperado por el microservicio de ventas
    const rutCliente = this.formularioVenta.get('clienteRut')?.value;
    // Quitar puntos del RUT para enviar al backend
    const rutSinPuntos = rutCliente ? rutCliente.replace(/\./g, '') : '';
    
    const ventaCreateDTO = {
      patientRut: rutSinPuntos,
      saleItems: itemsValidos.map((item: any) => ({
        productId: item.productoId,
        batchId: 1, // TODO: obtener batch ID real desde el inventario
        warehouseId: 1, // TODO: obtener warehouse ID real desde el inventario
        quantity: item.cantidad
      }))
    };

    this.ventaService.crearVenta(ventaCreateDTO).subscribe({
      next: (venta: any) => {
        this.loading = false;
        const numeroVenta = `V-${venta.id.toString().padStart(6, '0')}`;
        this.showMessage(`Venta procesada exitosamente. Número: ${numeroVenta}`, 'success');
        this.resetForm();
        this.cargarVentasRealizadas();
        this.cargarProductosDisponibles(); // Actualizar stock
      },
      error: (error: any) => {
        this.loading = false;
        console.error('Error procesando venta:', error);
        this.showMessage('Error al procesar la venta', 'error');
      }
    });
  }

  // ========== UTILIDADES ==========
  resetForm(): void {
    this.formularioVenta.reset({
      clienteRut: '',
      clienteNombre: '',
      metodoPago: 'EFECTIVO',
      observaciones: ''
    });
    
    // Limpiar array de items y agregar uno nuevo
    while (this.itemsArray.length > 1) {
      this.itemsArray.removeAt(1);
    }
    this.itemsArray.at(0).reset({
      productoId: '',
      cantidad: 1,
      precioUnitario: 0,
      subtotal: 0
    });
    
    this.calcularTotales();
  }

  toggleFormPanel(): void {
    this.showFormPanel = !this.showFormPanel;
  }

  toggleVentasPanel(): void {
    this.showVentasPanel = !this.showVentasPanel;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          }
        });
      }
    });
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
      this.messageType = '';
    }, 5000);
  }

  // ========== MÉTODOS PARA TEMPLATE ==========
  isFieldInvalid(fieldName: string): boolean {
    const field = this.formularioVenta.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isItemFieldInvalid(index: number, fieldName: string): boolean {
    const itemControl = this.itemsArray.at(index);
    const field = itemControl.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getProductoNombre(productoId: number, item?: any): string {
    // Si el item ya tiene el nombre del producto (desde saleItems), lo usamos
    if (item && item.productName) {
      return item.productName;
    }
    // Si no, lo buscamos en la lista de productos disponibles
    const producto = this.productosDisponibles.find(p => p.id === productoId);
    return producto ? producto.nombre : 'Producto no encontrado';
  }

  getProductoStock(productoId: number | string): number {
    const id = typeof productoId === 'string' ? parseInt(productoId) : productoId;
    const producto = this.productosDisponibles.find(p => p.id === id);
    const stock = producto ? producto.stock : 0;
    console.log(`getProductoStock(${productoId}): producto encontrado:`, producto, `stock: ${stock}`);
    return stock;
  }

  // Función auxiliar para debug del stock warning
  shouldShowStockWarning(itemIndex: number): boolean {
    const itemControl = this.itemsArray.at(itemIndex);
    const productoId = itemControl.get('productoId')?.value;
    const cantidad = itemControl.get('cantidad')?.value;
    
    if (!productoId || !cantidad) {
      return false;
    }
    
    const stockDisponible = this.getProductoStock(productoId);
    const cantidadSolicitada = Number(cantidad);
    const shouldShow = cantidadSolicitada > stockDisponible;
    
    console.log(`Stock warning debug - Producto: ${productoId}, Cantidad: ${cantidadSolicitada}, Stock: ${stockDisponible}, Show warning: ${shouldShow}`);
    
    return shouldShow;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(value);
  }
}
