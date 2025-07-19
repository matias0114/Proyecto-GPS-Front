import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { InventoryService } from '../../services/inventory.service';
import { ProductService } from '../../services/product.service';
import { WarehouseService } from '../../services/warehouse.service';
import { BatchService } from '../../services/batch.service';
import { Inventory, InventoryDTO, Warehouse, Batch } from '../../models/inventory.model';
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
      codigo: ['', [Validators.required]],
      nombreProducto: ['', [Validators.required]],
      cantidad: [0, [Validators.required, Validators.min(0)]],
      ubicacion: ['', [Validators.required]],
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
    if (inventario.batch?.productId) {
      const producto = this.productos.find(p => p.id === inventario.batch?.productId);
      return producto?.name || 'N/A';
    }
    return 'N/A';
  }
}
