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
  // Información adicional para la venta
  inventarios?: {
    inventoryId: number;
    batchId: number;
    warehouseId: number;
    stockDisponible: number;
  }[];
}

export interface ItemVenta {
  productoId: number;
  productName?: string;  // Agregamos el nombre del producto
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface VentaRequest {
  patientRut?: string;
  patientName?: string;
  paymentMethod: string;
  observations?: string;
  subtotal: number;
  taxes: number;
  totalAmount: number;
  saleItems: {
    productId: number;
    batchId: number;
    warehouseId: number;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
}

export interface VentaResponse {
  id: number;
  numeroVenta: string;
  fecha: string;
  clienteRut?: string;
  clienteNombre?: string;
  patientRut?: string;
  patientName?: string;
  items: ItemVenta[];
  subtotal: number;
  impuestos: number;
  taxes?: number;
  total: number;
  totalAmount?: number;
  metodoPago: string;
  paymentMethod?: string;
  estado: string;
  status?: string;
  observaciones?: string;
  observations?: string;
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
      
      console.log('🏷️ Buscando precio para producto:', {
        id: id,
        nombre: producto.nombre,
        precioBase: producto.precio
      });
      
      // Estrategia múltiple para obtener el precio correcto
      this.obtenerPrecioProducto(id, producto).then((precio) => {
        console.log('💰 Precio final asignado:', precio);
        
        itemControl.patchValue({
          precioUnitario: precio.valor
        });
        this.calcularSubtotalItem(index);
        
        // Mostrar mensaje informativo
        if (precio.origen !== 'precio base') {
          this.showMessage(`Precio aplicado desde ${precio.origen}: ${this.formatCurrency(precio.valor)}`, 'success');
        }
      }).catch((error) => {
        console.error('❌ Error obteniendo precio:', error);
        // Fallback final: usar precio base
        itemControl.patchValue({
          precioUnitario: producto.precio
        });
        this.calcularSubtotalItem(index);
        this.showMessage('Error obteniendo precio, usando precio base del producto', 'error');
      });
    }
  }

  /**
   * Obtiene el precio de un producto probando diferentes fuentes
   */
  private async obtenerPrecioProducto(productoId: number, producto: any): Promise<{valor: number, origen: string}> {
    try {
      // Primer intento: consultar listas de precios específicas del producto
      console.log('🔍 Intentando obtener precio desde listas específicas del producto...');
      const listas = await this.ventaService.obtenerPrecioActualProducto(productoId).toPromise();
      
      if (listas && listas.length > 0) {
        console.log('📋 Listas específicas encontradas:', listas);
        const precio = this.buscarPrecioVigente(listas);
        if (precio) {
          return precio;
        }
      }
      
      // Segundo intento: consultar todas las listas de precios vigentes
      console.log('🔍 Intentando obtener precio desde listas generales...');
      const listasGenerales = await this.ventaService.obtenerPreciosActuales().toPromise();
      
      if (listasGenerales && listasGenerales.length > 0) {
        console.log('📋 Listas generales encontradas:', listasGenerales);
        // Filtrar por producto
        const listasDelProducto = listasGenerales.filter((lista: any) => 
          lista.product?.id === productoId || lista.productId === productoId
        );
        
        if (listasDelProducto.length > 0) {
          console.log('📋 Listas filtradas por producto:', listasDelProducto);
          const precio = this.buscarPrecioVigente(listasDelProducto);
          if (precio) {
            return precio;
          }
        }
      }
      
      // Fallback: usar precio base del producto
      console.log('🔄 Usando precio base del producto como fallback');
      return {
        valor: producto.precio,
        origen: 'precio base del producto'
      };
      
    } catch (error) {
      console.error('❌ Error en obtenerPrecioProducto:', error);
      // Fallback final
      return {
        valor: producto.precio,
        origen: 'precio base del producto (error en consulta)'
      };
    }
  }

  /**
   * Busca el precio vigente en una lista de precios
   */
  private buscarPrecioVigente(listas: any[]): {valor: number, origen: string} | null {
    const fechaActual = new Date();
    
    // Filtrar listas activas y vigentes, ordenar por fecha más reciente
    const listasVigentes = listas
      .filter(lista => {
        if (!lista.active) {
          console.log('❌ Lista inactiva:', lista.id, lista.name);
          return false;
        }
        
        const validFrom = lista.validFrom ? new Date(lista.validFrom) : null;
        const validTo = lista.validTo ? new Date(lista.validTo) : null;
        
        const estaVigente = (validFrom === null || fechaActual >= validFrom) &&
                          (validTo === null || fechaActual <= validTo);
        
        console.log('🔍 Evaluando lista:', {
          id: lista.id,
          name: lista.name,
          costPrice: lista.costPrice,
          salePrice: lista.salePrice,
          active: lista.active,
          validFrom: validFrom,
          validTo: validTo,
          fechaActual: fechaActual,
          estaVigente: estaVigente
        });
        
        return estaVigente;
      })
      .sort((a, b) => {
        // Ordenar por fecha de creación/validación más reciente
        const dateA = a.validFrom ? new Date(a.validFrom).getTime() : 0;
        const dateB = b.validFrom ? new Date(b.validFrom).getTime() : 0;
        return dateB - dateA;
      });
    
    if (listasVigentes.length > 0) {
      const listaSeleccionada = listasVigentes[0]; // Tomar la más reciente
      
      // USAR costPrice en lugar de salePrice según el PriceListDTO
      if (listaSeleccionada.costPrice && Number(listaSeleccionada.costPrice) > 0) {
        console.log('✅ Precio costPrice encontrado en lista vigente:', {
          costPrice: listaSeleccionada.costPrice,
          salePrice: listaSeleccionada.salePrice,
          lista: listaSeleccionada.name,
          listaId: listaSeleccionada.id
        });
        
        return {
          valor: Number(listaSeleccionada.costPrice),
          origen: `lista "${listaSeleccionada.name}" (costPrice)`
        };
      } else if (listaSeleccionada.salePrice && Number(listaSeleccionada.salePrice) > 0) {
        // Fallback a salePrice si costPrice no está disponible
        console.log('⚠️ Usando salePrice como fallback (costPrice no disponible):', {
          salePrice: listaSeleccionada.salePrice,
          lista: listaSeleccionada.name,
          listaId: listaSeleccionada.id
        });
        
        return {
          valor: Number(listaSeleccionada.salePrice),
          origen: `lista "${listaSeleccionada.name}" (salePrice fallback)`
        };
      } else {
        console.log('⚠️ Lista vigente sin costPrice ni salePrice válidos:', listaSeleccionada);
      }
    } else {
      console.log('❌ No se encontraron listas de precios vigentes');
    }
    
    return null;
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
        // Procesamos inventarios con estructura anidada
        const productosMap = new Map<number, ProductoVenta>();
        
        inventarios.forEach((inventario: any) => {
          // Acceder a la información del producto desde la estructura anidada
          const producto = inventario.batch?.product;
          if (!producto) {
            console.warn('Inventario sin información de producto:', inventario);
            return;
          }
          
          const productoId = producto.id;
          const stockActual = Number(inventario.currentStock) || 0;
          
          console.log(`Procesando inventario para producto ${productoId}:`, {
            productoId: productoId,
            codigo: producto.code,
            nombre: producto.name,
            precio: producto.price,
            stockActual: stockActual,
            bodega: inventario.warehouse?.name,
            lote: inventario.batch?.batchNumber
          });
          
          if (productosMap.has(productoId)) {
            // Si el producto ya existe, sumar el stock y agregar inventario
            const productoExistente = productosMap.get(productoId)!;
            productoExistente.stock += stockActual;
            productoExistente.inventarios!.push({
              inventoryId: inventario.id,
              batchId: inventario.batchId,
              warehouseId: inventario.warehouseId,
              stockDisponible: stockActual
            });
          } else {
            // Crear nuevo producto
            productosMap.set(productoId, {
              id: productoId,
              codigo: producto.code || '',
              nombre: producto.name || 'Producto sin nombre',
              precio: Number(producto.price) || 0,
              stock: stockActual,
              categoria: producto.category || 'General',
              inventarios: [{
                inventoryId: inventario.id,
                batchId: inventario.batchId,
                warehouseId: inventario.warehouseId,
                stockDisponible: stockActual
              }]
            });
          }
        });

        this.productosDisponibles = Array.from(productosMap.values());
        console.log('Productos disponibles procesados:', this.productosDisponibles);
        
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
          categoria: producto.category || 'General',
          inventarios: [] // Sin inventarios
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

  /**
   * Intenta obtener el precio correcto de un producto para el historial
   */
  private async obtenerPrecioParaHistorial(productId: number): Promise<number> {
    try {
      // Intentar obtener el precio desde las listas de precios
      const listas = await this.ventaService.obtenerPrecioActualProducto(productId).toPromise();
      
      if (listas && listas.length > 0) {
        const precio = this.buscarPrecioVigente(listas);
        if (precio && precio.valor > 0) {
          console.log(`✅ Precio de lista encontrado para producto ${productId}:`, precio.valor);
          return precio.valor;
        }
      }
      
      // Fallback: buscar en productos disponibles
      const producto = this.productosDisponibles.find(p => p.id === productId);
      if (producto && producto.precio > 0) {
        console.log(`🔄 Usando precio base para producto ${productId}:`, producto.precio);
        return producto.precio;
      }
      
      console.log(`⚠️ No se pudo obtener precio para producto ${productId}, usando fallback`);
      return 1000; // Fallback genérico
      
    } catch (error) {
      console.error(`❌ Error obteniendo precio para producto ${productId}:`, error);
      return 1000; // Fallback genérico
    }
  }

  private cargarVentasRealizadas(): void {
    this.ventaService.obtenerTodas().subscribe({
      next: async (ventas: any[]) => {
        console.log('Ventas recibidas del backend:', ventas);
        
        // Adaptamos la respuesta del backend a nuestro modelo
        this.ventasRealizadas = await Promise.all(ventas.map(async (venta: any) => {
          console.log('Procesando venta:', venta);
          
          // Mapear los items de la venta
          const items = await Promise.all((venta.saleItems || []).map(async (item: any) => {
            console.log('Procesando item detallado:', {
              original: item,
              productId: item.productId,
              productName: item.productName,
              productCode: item.productCode,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice
            });
            
            // SIEMPRE recalcular el precio desde las listas de precios para el historial
            console.log(`🔧 Recalculando precio para producto ${item.productId} desde listas de precios...`);
            
            // Obtener el precio correcto desde las listas de precios (costPrice)
            const precioCorrectoListas = await this.obtenerPrecioParaHistorial(item.productId);
            const precioUnitarioReal = precioCorrectoListas;
            const subtotalReal = precioCorrectoListas * (item.quantity || 1);
            
            console.log(`✅ Precio aplicado desde listas para producto ${item.productId}:`, {
              precioBackend: item.unitPrice,
              precioListasPrecios: precioUnitarioReal,
              cantidad: item.quantity,
              subtotalCalculado: subtotalReal,
              subtotalBackend: item.totalPrice
            });
            
            return {
              productoId: item.productId,
              productName: item.productName || item.productCode || `Producto ${item.productId}`,
              cantidad: item.quantity,
              precioUnitario: precioUnitarioReal,
              subtotal: subtotalReal
            };
          }));
          
          // CALCULAR TOTALES CORRECTAMENTE DESDE LOS ITEMS (ignorar backend completamente)
          const subtotalCalculado = items.reduce((sum: number, item: any) => sum + (item.subtotal || 0), 0);
          const ivaCalculado = subtotalCalculado * 0.19;
          const totalCalculado = subtotalCalculado + ivaCalculado;
          
          console.log('💰 FORZANDO cálculo correcto de totales (ignorando backend):', {
            ventaId: venta.id,
            itemsSubtotales: items.map((i: any) => ({ productId: i.productoId, subtotal: i.subtotal })),
            subtotalCalculado: subtotalCalculado,
            ivaCalculado: ivaCalculado,
            totalCalculado: totalCalculado,
            valoresBackend: {
              subtotal: venta.subtotal,
              taxes: venta.taxes,
              totalAmount: venta.totalAmount
            }
          });
          
          return {
            id: venta.id,
            numeroVenta: `V-${venta.id.toString().padStart(6, '0')}`,
            fecha: venta.saleDate || new Date().toISOString(),
            clienteRut: venta.patientRut,
            clienteNombre: venta.patientName,
            items: items,
            subtotal: subtotalCalculado,
            impuestos: ivaCalculado,
            total: totalCalculado,
            metodoPago: venta.paymentMethod || venta.metodoPago || 'EFECTIVO',
            estado: venta.status || 'COMPLETED',
            observaciones: venta.observations || venta.observaciones || ''
          };
        }));
        
        console.log('Ventas procesadas con cálculos corregidos:', this.ventasRealizadas);
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
      patientName: this.formularioVenta.get('clienteNombre')?.value || '',
      paymentMethod: this.formularioVenta.get('metodoPago')?.value || 'EFECTIVO',
      observations: this.formularioVenta.get('observaciones')?.value || '',
      subtotal: this.subtotal,
      taxes: this.impuestos,
      totalAmount: this.total,
      saleItems: itemsValidos.map((item: any) => {
        const producto = this.productosDisponibles.find(p => p.id === item.productoId);
        
        // Obtener el inventario con más stock disponible para este producto
        let inventarioSeleccionado = null;
        if (producto && producto.inventarios && producto.inventarios.length > 0) {
          inventarioSeleccionado = producto.inventarios
            .filter(inv => inv.stockDisponible >= item.cantidad)
            .sort((a, b) => b.stockDisponible - a.stockDisponible)[0];
          
          // Si no hay inventario con stock suficiente, tomar el que más stock tenga
          if (!inventarioSeleccionado) {
            inventarioSeleccionado = producto.inventarios
              .sort((a, b) => b.stockDisponible - a.stockDisponible)[0];
          }
        }
        
        return {
          productId: item.productoId,
          batchId: inventarioSeleccionado?.batchId || 1,
          warehouseId: inventarioSeleccionado?.warehouseId || 1,
          quantity: item.cantidad,
          unitPrice: item.precioUnitario,
          totalPrice: item.subtotal
        };
      })
    };

    console.log('🚀 Enviando venta al backend con detalles completos:', {
      subtotalFormulario: this.subtotal,
      impuestosFormulario: this.impuestos,
      totalFormulario: this.total,
      itemsDetalle: itemsValidos.map((item: any) => ({
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal
      })),
      ventaCreateDTO: ventaCreateDTO
    });

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
    console.log('getProductoNombre llamado con:', { productoId, item });
    
    // Si el item ya tiene el nombre del producto (desde saleItems), lo usamos
    if (item && (item.productName || item.productCode)) {
      const nombre = item.productName || item.productCode;
      console.log('Usando nombre del item:', nombre);
      return nombre;
    }
    
    // Si no, lo buscamos en la lista de productos disponibles
    const producto = this.productosDisponibles.find(p => p.id === productoId);
    if (producto) {
      const nombre = producto.nombre || `Producto ${productoId}`;
      console.log('Encontrado en productos disponibles:', nombre);
      return nombre;
    }
    
    // Fallback con ID del producto
    const fallback = `Producto ${productoId}`;
    console.log('Usando fallback:', fallback);
    return fallback;
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
