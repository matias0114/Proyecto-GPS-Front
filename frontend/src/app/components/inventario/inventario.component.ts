import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InventoryService } from '../../services/inventory.service';
import { ProductService } from '../../services/product.service';
import { WarehouseService } from '../../services/warehouse.service';
import { BatchService } from '../../services/batch.service';
import { Inventory, InventoryDTO, UpdateInventoryDTO, Warehouse, Batch } from '../../models/inventory.model';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent implements OnInit {
  formularioInventario: FormGroup;
  inventarios: Inventory[] = [];
  productos: Product[] = [];
  bodegas: Warehouse[] = [];
  lotes: Batch[] = [];
  selectedProducto: Product | null = null;
  selectedBodega: Warehouse | null = null;
  selectedLote: Batch | null = null;
  editingInventoryId: number | null = null;
  inventoryTypes = [
    { value: 'GENERAL', label: 'General' },
    { value: 'SELECTIVO', label: 'Selectivo' },
    { value: 'BARRIDO', label: 'Barrido' }
  ];
  loading = false;
  message = '';
  messageType: 'success' | 'error' | '' = '';

  constructor(
    private fb: FormBuilder,
    private inventoryService: InventoryService,
    private productService: ProductService,
    private warehouseService: WarehouseService,
    private batchService: BatchService
  ) {
    this.formularioInventario = this.fb.group({
      codigo: [''],
      nombreProducto: [''],
      cantidad: [0],
      ubicacion: [''],
      tipoCarga: ['GENERAL', [Validators.required]],
      batchId: [''],
      warehouseId: ['', [Validators.required]],
      lote: ['']
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.setupFormSubscriptions();
  }

  private loadInitialData(): void {
    this.loadProducts();
    this.loadWarehouses();
    this.loadInventories();
    this.loadActiveBatches();
  }

  private setupFormSubscriptions(): void {
    // Suscribirse a cambios en el tipo de carga para actualizar validaciones
    this.formularioInventario.get('tipoCarga')?.valueChanges.subscribe(tipoCarga => {
      this.updateFormValidations(tipoCarga);
    });

    // Suscribirse a cambios en el código del producto
    this.formularioInventario.get('codigo')?.valueChanges.subscribe(codigo => {
      if (codigo) {
        this.searchProductByCode(codigo);
      }
    });

    // Suscribirse a cambios en la bodega para filtrar lotes
    this.formularioInventario.get('warehouseId')?.valueChanges.subscribe(warehouseId => {
      if (warehouseId) {
        this.loadBatchesByWarehouse(warehouseId);
        this.selectedBodega = this.bodegas.find(b => b.id === Number(warehouseId)) || null;
      }
    });

    // Aplicar validaciones iniciales
    this.updateFormValidations('GENERAL');
  }

  private updateFormValidations(tipoCarga: string): void {
    const codigoControl = this.formularioInventario.get('codigo');
    const nombreProductoControl = this.formularioInventario.get('nombreProducto');
    const cantidadControl = this.formularioInventario.get('cantidad');
    const batchIdControl = this.formularioInventario.get('batchId');

    // Limpiar validadores existentes
    codigoControl?.clearValidators();
    nombreProductoControl?.clearValidators();
    cantidadControl?.clearValidators();
    batchIdControl?.clearValidators();

    if (tipoCarga === 'SELECTIVO' || tipoCarga === 'BARRIDO') {
      // Para inventario selectivo y barrido, estos campos son requeridos
      codigoControl?.setValidators([Validators.required]);
      nombreProductoControl?.setValidators([Validators.required]);
      cantidadControl?.setValidators([Validators.required, Validators.min(0)]);
      batchIdControl?.setValidators([Validators.required]);
    }
    // Para inventario general, no se requieren campos específicos del producto

    // Actualizar estado de validación
    codigoControl?.updateValueAndValidity();
    nombreProductoControl?.updateValueAndValidity();
    cantidadControl?.updateValueAndValidity();
    batchIdControl?.updateValueAndValidity();
  }

  private loadProducts(): void {
    this.productService.getAllProducts().subscribe({
      next: (productos) => {
        this.productos = productos;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.showMessage('Error al cargar productos', 'error');
      }
    });
  }

  private loadWarehouses(): void {
    this.warehouseService.getAllWarehouses().subscribe({
      next: (bodegas) => {
        this.bodegas = bodegas;
      },
      error: (error) => {
        console.error('Error al cargar bodegas:', error);
        this.showMessage('Error al cargar bodegas', 'error');
      }
    });
  }

  private loadInventories(): void {
    this.inventoryService.getAllInventories().subscribe({
      next: (inventarios) => {
        this.inventarios = inventarios;
      },
      error: (error) => {
        console.error('Error al cargar inventarios:', error);
        this.showMessage('Error al cargar inventarios', 'error');
      }
    });
  }

  private loadActiveBatches(): void {
    this.batchService.getActiveBatches().subscribe({
      next: (lotes) => {
        this.lotes = lotes;
      },
      error: (error) => {
        console.error('Error al cargar lotes:', error);
      }
    });
  }

  private loadBatchesByWarehouse(warehouseId: number): void {
    this.batchService.getBatchesByWarehouse(warehouseId).subscribe({
      next: (lotes) => {
        this.lotes = lotes;
      },
      error: (error) => {
        console.error('Error al cargar lotes por bodega:', error);
      }
    });
  }

  private searchProductByCode(codigo: string): void {
    this.productService.getProductByCode(codigo).subscribe({
      next: (producto) => {
        this.selectedProducto = producto;
        this.formularioInventario.patchValue({
          nombreProducto: producto.name
        });
      },
      error: (error) => {
        console.error('Error al buscar producto:', error);
        this.selectedProducto = null;
        this.formularioInventario.patchValue({
          nombreProducto: ''
        });
      }
    });
  }

  onSubmit(): void {
    if (this.formularioInventario.invalid) {
      this.markFormGroupTouched(this.formularioInventario);
      this.showMessage('Por favor complete todos los campos requeridos', 'error');
      return;
    }

    this.loading = true;
    const formValues = this.formularioInventario.value;
    const tipoCarga = formValues.tipoCarga;

    // Si estamos editando, mostrar confirmación y actualizar inventario existente
    if (this.editingInventoryId) {
      const confirmMessage = `¿Está seguro de que desea actualizar este inventario a la cantidad ${formValues.cantidad}?`;
      if (confirm(confirmMessage)) {
        this.updateInventory(formValues);
      } else {
        this.loading = false;
      }
      return;
    }

    // Si no estamos editando, crear nuevo inventario
    switch (tipoCarga) {
      case 'GENERAL':
        this.createGeneralInventory(formValues.warehouseId);
        break;
      case 'SELECTIVO':
        this.createSelectiveInventory(formValues);
        break;
      case 'BARRIDO':
        this.createSweepInventory(formValues);
        break;
      default:
        this.loading = false;
        this.showMessage('Tipo de carga no válido', 'error');
    }
  }

  private createGeneralInventory(warehouseId: number): void {
    this.inventoryService.createGeneralInventory(warehouseId).subscribe({
      next: (inventarios) => {
        this.loading = false;
        this.showMessage(`Inventario general creado exitosamente. ${inventarios.length} registros procesados.`, 'success');
        this.loadInventories();
        this.resetForm();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error al crear inventario general:', error);
        this.showMessage('Error al crear inventario general', 'error');
      }
    });
  }

  private createSelectiveInventory(formValues: any): void {
    const inventoryDTO: InventoryDTO = {
      warehouseId: formValues.warehouseId,
      batchId: formValues.batchId,
      quantity: formValues.cantidad,
      inventoryType: 'SELECTIVO'
    };

    this.inventoryService.createSelectiveInventory(inventoryDTO).subscribe({
      next: (inventario) => {
        this.loading = false;
        this.showMessage('Inventario selectivo creado exitosamente', 'success');
        this.loadInventories();
        this.resetForm();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error al crear inventario selectivo:', error);
        this.showMessage('Error al crear inventario selectivo', 'error');
      }
    });
  }

  private createSweepInventory(formValues: any): void {
    const inventoryDTO: InventoryDTO = {
      warehouseId: formValues.warehouseId,
      batchId: formValues.batchId,
      quantity: formValues.cantidad,
      inventoryType: 'BARRIDO'
    };

    this.inventoryService.createSweepInventory(inventoryDTO).subscribe({
      next: (inventario) => {
        this.loading = false;
        this.showMessage('Inventario por barrido creado exitosamente', 'success');
        this.loadInventories();
        this.resetForm();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error al crear inventario por barrido:', error);
        this.showMessage('Error al crear inventario por barrido', 'error');
      }
    });
  }

  searchProduct(): void {
    const codigo = this.formularioInventario.get('codigo')?.value;
    if (codigo) {
      this.searchProductByCode(codigo);
    }
  }

  onProductSelect(producto: Product): void {
    this.selectedProducto = producto;
    this.formularioInventario.patchValue({
      codigo: producto.code,
      nombreProducto: producto.name
    });
  }

  onWarehouseSelect(bodega: Warehouse): void {
    this.selectedBodega = bodega;
    this.formularioInventario.patchValue({
      warehouseId: bodega.id,
      ubicacion: bodega.name
    });
    if (bodega.id) {
      this.loadBatchesByWarehouse(bodega.id);
    }
  }

  onBatchSelect(lote: Batch): void {
    this.selectedLote = lote;
    this.formularioInventario.patchValue({
      batchId: lote.id,
      lote: lote.batchNumber
    });
  }

  resetForm(): void {
    this.formularioInventario.reset();
    this.formularioInventario.patchValue({
      tipoCarga: 'GENERAL',
      cantidad: 0
    });
    this.selectedProducto = null;
    this.selectedBodega = null;
    this.selectedLote = null;
    this.editingInventoryId = null;
    
    // Aplicar validaciones para el tipo de inventario por defecto
    this.updateFormValidations('GENERAL');
  }

  editInventory(inventario: Inventory): void {
    this.editingInventoryId = inventario.id || null;
    this.showMessage('Cargando datos para edición...', 'success');
    
    // Buscar el producto relacionado al lote
    if (inventario.batch?.productId) {
      this.productService.getProductById(inventario.batch.productId).subscribe({
        next: (producto) => {
          this.selectedProducto = producto;
          this.onWarehouseSelect(inventario.warehouse!);
          
          // Llenar el formulario con los datos del inventario a editar
          this.formularioInventario.patchValue({
            tipoCarga: inventario.inventoryType || 'SELECTIVO',
            codigo: producto.code,
            nombreProducto: producto.name,
            cantidad: inventario.quantity,
            warehouseId: inventario.warehouse?.id,
            ubicacion: inventario.warehouse?.name,
            batchId: inventario.batch?.id,
            lote: inventario.batch?.batchNumber
          });
          
          // Actualizar las validaciones para el tipo de inventario
          this.updateFormValidations(inventario.inventoryType || 'SELECTIVO');
          
          this.showMessage('Inventario cargado para edición. Modifique la cantidad y presione "Actualizar"', 'success');
        },
        error: (error) => {
          console.error('Error al cargar producto para edición:', error);
          this.showMessage('Error al cargar datos del producto', 'error');
          this.editingInventoryId = null;
        }
      });
    } else {
      // Si no hay productId, llenar lo que se pueda
      this.formularioInventario.patchValue({
        tipoCarga: inventario.inventoryType || 'SELECTIVO',
        cantidad: inventario.quantity,
        warehouseId: inventario.warehouse?.id,
        ubicacion: inventario.warehouse?.name,
        batchId: inventario.batch?.id,
        lote: inventario.batch?.batchNumber
      });
      
      this.updateFormValidations(inventario.inventoryType || 'SELECTIVO');
      this.showMessage('Inventario cargado para edición. Modifique la cantidad y presione "Actualizar"', 'success');
    }
  }

  deleteInventory(inventoryId: number): void {
    if (confirm('¿Está seguro de que desea eliminar este registro de inventario?')) {
      this.inventoryService.deleteInventory(inventoryId).subscribe({
        next: () => {
          this.showMessage('Inventario eliminado exitosamente', 'success');
          this.loadInventories();
        },
        error: (error) => {
          console.error('Error al eliminar inventario:', error);
          this.showMessage('Error al eliminar inventario', 'error');
        }
      });
    }
  }

  updateInventory(formValues: any): void {
    if (!this.editingInventoryId) {
      this.loading = false;
      this.showMessage('Error: No se ha seleccionado un inventario para editar', 'error');
      return;
    }

    // Validar que la cantidad sea válida
    const cantidad = formValues.cantidad;
    if (!cantidad || cantidad < 0) {
      this.loading = false;
      this.showMessage('Error: La cantidad debe ser mayor o igual a 0', 'error');
      return;
    }

    // Crear un objeto UpdateInventoryDTO que coincida exactamente con lo que espera el backend
    // IMPORTANTE: Solo enviar los campos quantity y currentStock, ningún otro campo
    const updateData: UpdateInventoryDTO = {
      quantity: cantidad,
      currentStock: cantidad
    };

    console.log('Datos a enviar para actualización:', updateData);

    this.inventoryService.updateInventory(this.editingInventoryId, updateData).subscribe({
      next: (inventario) => {
        this.loading = false;
        console.log('Inventario actualizado exitosamente:', inventario);
        this.showMessage('Inventario actualizado exitosamente', 'success');
        this.loadInventories();
        this.resetForm();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error al actualizar inventario:', error);
        
        // Mostrar mensaje de error más específico
        let errorMessage = 'Error al actualizar inventario';
        if (error.status === 400) {
          errorMessage = 'Error: Datos inválidos. Verifique la cantidad ingresada.';
        } else if (error.status === 404) {
          errorMessage = 'Error: Inventario no encontrado.';
        } else if (error.status === 415) {
          errorMessage = 'Error: Formato de datos incorrecto.';
        }
        
        this.showMessage(errorMessage, 'error');
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
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

  // Métodos de utilidad para el template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.formularioInventario.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.formularioInventario.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Este campo es requerido';
      if (field.errors['min']) return 'El valor debe ser mayor a 0';
    }
    return '';
  }

  getProductNameForInventory(inventario: Inventory): string {
    // Obtener el nombre del producto directamente desde batch.product
    if (inventario.batch?.product?.name) {
      return inventario.batch.product.name;
    }
    
    // Fallback: buscar por productId en la lista de productos cargados (por si acaso)
    if (inventario.batch?.productId) {
      const producto = this.productos.find(p => p.id === inventario.batch?.productId);
      if (producto?.name) {
        return producto.name;
      }
    }
    
    return 'N/A';
  }
}
