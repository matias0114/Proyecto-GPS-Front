import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PriceListService } from '../../services/price-list.service';
import { ProductService } from '../../services/product.service';
import { WarehouseService } from '../../services/warehouse.service';
import { PriceList, PriceType, PricingMethod } from '../../models/price-list.model';
import { Product } from '../../models/product.model';
import { Warehouse } from '../../models/inventory.model';

@Component({
  selector: 'app-precios',
  templateUrl: './precios.component.html',
  styleUrls: ['./precios.component.css']
})
export class PreciosComponent implements OnInit {
  formularioPrecio: FormGroup;
  precios: PriceList[] = [];
  productos: Product[] = [];
  bodegas: Warehouse[] = [];
  selectedProducto: Product | null = null;
  selectedBodega: Warehouse | null = null;
  
  priceTypes = [
    { value: PriceType.GENERAL, label: 'General' },
    { value: PriceType.WHOLESALE, label: 'Mayorista' },
    { value: PriceType.RETAIL, label: 'Minorista' },
    { value: PriceType.GOVERNMENT, label: 'Gubernamental' },
    { value: PriceType.SPECIAL, label: 'Especial' }
  ];

  pricingMethods = [
    { value: PricingMethod.LAST_PURCHASE, label: 'Última Compra' },
    { value: PricingMethod.WEIGHTED_AVERAGE, label: 'Promedio Ponderado' },
    { value: PricingMethod.FIFO, label: 'FIFO' },
    { value: PricingMethod.LIFO, label: 'LIFO' },
    { value: PricingMethod.LILO, label: 'LILO' }
  ];

  loading = false;
  message = '';
  messageType: 'success' | 'error' | '' = '';
  showCurrentPricesOnly = false;
  editingPriceId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private priceListService: PriceListService,
    private productService: ProductService,
    private warehouseService: WarehouseService
  ) {
    this.formularioPrecio = this.fb.group({
      name: ['', [Validators.required]],
      codigo: ['', [Validators.required]],
      nombreProducto: ['', [Validators.required]],
      productId: ['', [Validators.required]],
      warehouseId: [''],
      salePrice: [0, [Validators.required, Validators.min(0.01)]],
      costPrice: [0, [Validators.min(0)]],
      marginPercentage: [0, [Validators.min(0), Validators.max(1000)]],
      validFrom: ['', [Validators.required]],
      validTo: [''],
      priceType: [PriceType.GENERAL, [Validators.required]],
      pricingMethod: [PricingMethod.LAST_PURCHASE],
      currency: ['CLP'],
      active: [true]
    });
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.setupFormSubscriptions();
    this.setDefaultDates();
  }

  private loadInitialData(): void {
    this.loadProducts();
    this.loadWarehouses();
    this.loadPrices();
  }

  private setupFormSubscriptions(): void {
    // Suscribirse a cambios en el código del producto
    this.formularioPrecio.get('codigo')?.valueChanges.subscribe(codigo => {
      if (codigo) {
        this.searchProductByCode(codigo);
      }
    });

    // Calcular margen cuando cambian precio de costo o venta
    this.formularioPrecio.get('salePrice')?.valueChanges.subscribe(() => {
      this.calculateMargin();
    });

    this.formularioPrecio.get('costPrice')?.valueChanges.subscribe(() => {
      this.calculateMargin();
    });

    // Calcular precio de venta cuando cambia el margen
    this.formularioPrecio.get('marginPercentage')?.valueChanges.subscribe(() => {
      this.calculateSalePriceFromMargin();
    });
  }

  private setDefaultDates(): void {
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    this.formularioPrecio.patchValue({
      validFrom: formattedToday
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

  private loadPrices(): void {
    const loadMethod = this.showCurrentPricesOnly 
      ? this.priceListService.getCurrentPrices()
      : this.priceListService.getAllPriceLists();

    loadMethod.subscribe({
      next: (precios) => {
        this.precios = precios;
      },
      error: (error) => {
        console.error('Error al cargar precios:', error);
        this.showMessage('Error al cargar precios', 'error');
      }
    });
  }

  private searchProductByCode(codigo: string): void {
    this.productService.getProductByCode(codigo).subscribe({
      next: (producto) => {
        this.selectedProducto = producto;
        this.formularioPrecio.patchValue({
          nombreProducto: producto.name,
          productId: producto.id,
          name: `Precio ${producto.name} - ${new Date().toLocaleDateString()}`
        });
      },
      error: (error) => {
        console.error('Error al buscar producto:', error);
        this.selectedProducto = null;
        this.formularioPrecio.patchValue({
          nombreProducto: '',
          productId: '',
          name: ''
        });
      }
    });
  }

  private calculateMargin(): void {
    const salePrice = this.formularioPrecio.get('salePrice')?.value || 0;
    const costPrice = this.formularioPrecio.get('costPrice')?.value || 0;

    if (salePrice > 0 && costPrice > 0) {
      const margin = ((salePrice - costPrice) / costPrice) * 100;
      this.formularioPrecio.get('marginPercentage')?.setValue(
        Math.round(margin * 100) / 100,
        { emitEvent: false }
      );
    }
  }

  private calculateSalePriceFromMargin(): void {
    const costPrice = this.formularioPrecio.get('costPrice')?.value || 0;
    const marginPercentage = this.formularioPrecio.get('marginPercentage')?.value || 0;

    if (costPrice > 0 && marginPercentage > 0) {
      const salePrice = costPrice * (1 + marginPercentage / 100);
      this.formularioPrecio.get('salePrice')?.setValue(
        Math.round(salePrice * 100) / 100,
        { emitEvent: false }
      );
    }
  }

  private cleanDataForSubmit(formValue: any, isUpdate: boolean = false): PriceList {
    const cleanData: PriceList = {
      name: formValue.name?.trim(),
      productId: formValue.productId,
      salePrice: Number(formValue.salePrice),
      validFrom: new Date(formValue.validFrom + 'T00:00:00.000Z'),
      active: formValue.active,
      priceType: formValue.priceType,
      pricingMethod: formValue.pricingMethod,
      currency: formValue.currency
    };

    // Campos opcionales
    if (formValue.warehouseId) {
      cleanData.warehouseId = formValue.warehouseId;
    }

    if (formValue.costPrice && formValue.costPrice > 0) {
      cleanData.costPrice = Number(formValue.costPrice);
    }

    if (formValue.marginPercentage && formValue.marginPercentage > 0) {
      cleanData.marginPercentage = Number(formValue.marginPercentage);
    }

    if (formValue.validTo) {
      cleanData.validTo = new Date(formValue.validTo + 'T23:59:59.999Z');
    }

    // Si es actualización, agregar el ID
    if (isUpdate && this.editingPriceId) {
      cleanData.id = this.editingPriceId;
    }

    return cleanData;
  }

  onSubmit(): void {
    if (this.formularioPrecio.invalid) {
      this.markFormGroupTouched(this.formularioPrecio);
      this.showMessage('Por favor complete todos los campos requeridos', 'error');
      return;
    }

    this.loading = true;
    const formValue = this.formularioPrecio.value;
    
    // Limpiar y preparar los datos
    const priceListData = this.cleanDataForSubmit(formValue, !!this.editingPriceId);

    console.log('Datos enviados:', priceListData); // Para debug

    const saveMethod = this.editingPriceId
      ? this.priceListService.updatePriceList(this.editingPriceId, priceListData)
      : this.priceListService.createPriceList(priceListData);

    saveMethod.subscribe({
      next: (precio) => {
        this.loading = false;
        const action = this.editingPriceId ? 'actualizado' : 'creado';
        this.showMessage(`Precio ${action} exitosamente`, 'success');
        this.loadPrices();
        this.resetForm();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error completo:', error);
        const action = this.editingPriceId ? 'actualizar' : 'crear';
        
        // Mostrar error más específico si está disponible
        let errorMessage = `Error al ${action} precio`;
        if (error.message) {
          errorMessage += `: ${error.message}`;
        }
        
        this.showMessage(errorMessage, 'error');
      }
    });
  }

  searchProduct(): void {
    const codigo = this.formularioPrecio.get('codigo')?.value;
    if (codigo) {
      this.searchProductByCode(codigo);
    }
  }

  onProductSelect(producto: Product): void {
    this.selectedProducto = producto;
    this.formularioPrecio.patchValue({
      codigo: producto.code,
      nombreProducto: producto.name,
      productId: producto.id,
      name: `Precio ${producto.name} - ${new Date().toLocaleDateString()}`
    });
  }

  onWarehouseSelect(bodega: Warehouse): void {
    this.selectedBodega = bodega;
    this.formularioPrecio.patchValue({
      warehouseId: bodega.id
    });
  }

  editPrice(precio: PriceList): void {
    this.editingPriceId = precio.id || null;
    
    // Buscar el producto para completar la información
    if (precio.productId) {
      this.productService.getProductById(precio.productId).subscribe({
        next: (producto) => {
          this.selectedProducto = producto;
          
          // Formatear las fechas correctamente
          const validFromDate = precio.validFrom ? new Date(precio.validFrom).toISOString().split('T')[0] : '';
          const validToDate = precio.validTo ? new Date(precio.validTo).toISOString().split('T')[0] : '';
          
          this.formularioPrecio.patchValue({
            name: precio.name,
            codigo: producto.code,
            nombreProducto: producto.name,
            productId: precio.productId,
            warehouseId: precio.warehouseId || '',
            salePrice: precio.salePrice,
            costPrice: precio.costPrice || 0,
            marginPercentage: precio.marginPercentage || 0,
            validFrom: validFromDate,
            validTo: validToDate,
            priceType: precio.priceType || PriceType.GENERAL,
            pricingMethod: precio.pricingMethod || PricingMethod.LAST_PURCHASE,
            currency: precio.currency || 'CLP',
            active: precio.active !== false // Por defecto true si no está definido
          });
          
          console.log('Editando precio:', precio);
          console.log('Formulario actualizado con:', this.formularioPrecio.value);
        },
        error: (error) => {
          console.error('Error al cargar producto para edición:', error);
          this.showMessage('Error al cargar información del producto', 'error');
        }
      });
    } else {
      // Si no hay productId, cargar directamente los datos disponibles
      const validFromDate = precio.validFrom ? new Date(precio.validFrom).toISOString().split('T')[0] : '';
      const validToDate = precio.validTo ? new Date(precio.validTo).toISOString().split('T')[0] : '';
      
      this.formularioPrecio.patchValue({
        name: precio.name,
        productId: precio.productId,
        warehouseId: precio.warehouseId || '',
        salePrice: precio.salePrice,
        costPrice: precio.costPrice || 0,
        marginPercentage: precio.marginPercentage || 0,
        validFrom: validFromDate,
        validTo: validToDate,
        priceType: precio.priceType || PriceType.GENERAL,
        pricingMethod: precio.pricingMethod || PricingMethod.LAST_PURCHASE,
        currency: precio.currency || 'CLP',
        active: precio.active !== false
      });
    }
  }

  deletePrice(priceId: number): void {
    if (confirm('¿Está seguro de que desea eliminar este precio?')) {
      this.priceListService.deletePriceList(priceId).subscribe({
        next: () => {
          this.showMessage('Precio eliminado exitosamente', 'success');
          this.loadPrices();
        },
        error: (error) => {
          console.error('Error al eliminar precio:', error);
          this.showMessage('Error al eliminar precio', 'error');
        }
      });
    }
  }

  toggleCurrentPricesOnly(): void {
    this.showCurrentPricesOnly = !this.showCurrentPricesOnly;
    this.loadPrices();
  }

  resetForm(): void {
    this.formularioPrecio.reset();
    this.setDefaultDates();
    this.formularioPrecio.patchValue({
      priceType: PriceType.GENERAL,
      pricingMethod: PricingMethod.LAST_PURCHASE,
      currency: 'CLP',
      active: true,
      salePrice: 0,
      costPrice: 0,
      marginPercentage: 0
    });
    this.selectedProducto = null;
    this.selectedBodega = null;
    this.editingPriceId = null;
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
    const field = this.formularioPrecio.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.formularioPrecio.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Este campo es requerido';
      if (field.errors['min']) return `El valor debe ser mayor a ${field.errors['min'].min}`;
      if (field.errors['max']) return `El valor debe ser menor a ${field.errors['max'].max}`;
    }
    return '';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(value);
  }

  getPriceTypeLabel(priceType: PriceType): string {
    const type = this.priceTypes.find(t => t.value === priceType);
    return type ? type.label : priceType;
  }

  getProductNameForPrice(precio: PriceList): string {
    if (precio.productId) {
      const producto = this.productos.find(p => p.id === precio.productId);
      return producto?.name || 'N/A';
    }
    return 'N/A';
  }

  getProductCodeForPrice(precio: PriceList): string {
    if (precio.productId) {
      const producto = this.productos.find(p => p.id === precio.productId);
      return producto?.code || '';
    }
    return '';
  }
}
