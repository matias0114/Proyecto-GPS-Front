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

  // Variables para controles de interfaz
  showFiltersPanel = false;
  showFormPanel = false;

  // Variables para filtros
  filteredPrecios: PriceList[] = [];
  isSearchMode = false; // Para controlar si estamos en modo búsqueda
  filters = {
    productCode: '',
    productName: '',
    priceType: '',
    warehouse: '',
    minPrice: null as number | null,
    maxPrice: null as number | null,
    minCostPrice: null as number | null,
    maxCostPrice: null as number | null,
    currency: '',
    activeOnly: false,
    dateFrom: '',
    dateTo: ''
  };

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
        // Si no estamos en modo búsqueda, mostrar todos los precios
        if (!this.isSearchMode) {
          this.filteredPrecios = [...precios];
        } else {
          // Si estamos en modo búsqueda, aplicar filtros actuales
          this.applyFilters();
        }
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
    
    // Desplegar automáticamente el formulario de edición
    this.showFormPanel = true;
    
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

  // Métodos de filtrado
  toggleFilters(): void {
    this.showFiltersPanel = !this.showFiltersPanel;
  }

  applyFilters(): void {
    this.filteredPrecios = this.precios.filter(precio => {
      // Solo aplicar filtros que tienen valores
      
      // Filtro por código de producto
      if (this.filters.productCode && this.filters.productCode.trim()) {
        const productCode = this.getProductCodeForPrice(precio);
        if (!productCode.toLowerCase().includes(this.filters.productCode.toLowerCase())) {
          return false;
        }
      }

      // Filtro por nombre de producto
      if (this.filters.productName && this.filters.productName.trim()) {
        const productName = this.getProductNameForPrice(precio);
        if (!productName.toLowerCase().includes(this.filters.productName.toLowerCase())) {
          return false;
        }
      }

      // Filtro por tipo de precio
      if (this.filters.priceType && this.filters.priceType.trim()) {
        if (precio.priceType !== this.filters.priceType) {
          return false;
        }
      }

      // Filtro por bodega
      if (this.filters.warehouse && this.filters.warehouse.trim()) {
        if (this.filters.warehouse === 'all') {
          if (precio.warehouseId) return false;
        } else if (this.filters.warehouse === 'specific') {
          if (!precio.warehouseId) return false;
        } else {
          if (precio.warehouseId !== Number(this.filters.warehouse)) return false;
        }
      }

      // Filtro por precio de venta mínimo
      if (this.filters.minPrice !== null && this.filters.minPrice !== undefined && this.filters.minPrice > 0) {
        if (precio.salePrice < this.filters.minPrice) {
          return false;
        }
      }

      // Filtro por precio de venta máximo
      if (this.filters.maxPrice !== null && this.filters.maxPrice !== undefined && this.filters.maxPrice > 0) {
        if (precio.salePrice > this.filters.maxPrice) {
          return false;
        }
      }

      // Filtro por precio de costo mínimo
      if (this.filters.minCostPrice !== null && this.filters.minCostPrice !== undefined && this.filters.minCostPrice > 0) {
        if ((precio.costPrice || 0) < this.filters.minCostPrice) {
          return false;
        }
      }

      // Filtro por precio de costo máximo
      if (this.filters.maxCostPrice !== null && this.filters.maxCostPrice !== undefined && this.filters.maxCostPrice > 0) {
        if ((precio.costPrice || 0) > this.filters.maxCostPrice) {
          return false;
        }
      }

      // Filtro por moneda
      if (this.filters.currency && this.filters.currency.trim()) {
        if (precio.currency !== this.filters.currency) {
          return false;
        }
      }

      // Filtro por solo activos
      if (this.filters.activeOnly) {
        if (!precio.active) {
          return false;
        }
      }

      // Filtro por fecha desde
      if (this.filters.dateFrom && this.filters.dateFrom.trim()) {
        const fechaFiltro = new Date(this.filters.dateFrom);
        const fechaPrecio = new Date(precio.validFrom);
        if (fechaPrecio < fechaFiltro) return false;
      }

      // Filtro por fecha hasta
      if (this.filters.dateTo && this.filters.dateTo.trim()) {
        const fechaFiltro = new Date(this.filters.dateTo);
        const fechaPrecio = precio.validTo ? new Date(precio.validTo) : new Date();
        if (fechaPrecio > fechaFiltro) return false;
      }

      return true;
    });
  }

  clearFilters(): void {
    this.filters = {
      productCode: '',
      productName: '',
      priceType: '',
      warehouse: '',
      minPrice: null,
      maxPrice: null,
      minCostPrice: null,
      maxCostPrice: null,
      currency: '',
      activeOnly: false,
      dateFrom: '',
      dateTo: ''
    };
    this.isSearchMode = false;
    this.filteredPrecios = [...this.precios]; // Mostrar todos los precios
    this.showMessage('Filtros limpiados - Mostrando todos los precios', 'success');
  }

  // Métodos para controlar paneles colapsibles
  toggleFiltersPanel(): void {
    this.showFiltersPanel = !this.showFiltersPanel;
  }

  toggleFormPanel(): void {
    this.showFormPanel = !this.showFormPanel;
  }

  onFilterChange(): void {
    // Solo aplicar filtros automáticamente si no estamos en modo búsqueda manual
    if (!this.isSearchMode) {
      this.applyFilters();
    }
  }

  // Nuevo método para búsqueda con filtros
  searchWithFilters(): void {
    this.isSearchMode = true;
    this.applyFilters();
    this.showMessage(`Se encontraron ${this.filteredPrecios.length} resultados`, 'success');
  }

  getFilteredPreciosCount(): number {
    return this.filteredPrecios.length;
  }

  getTotalPreciosCount(): number {
    return this.precios.length;
  }

  exportFilteredData(): void {
    // Implementar exportación si es necesario
    console.log('Exportando datos filtrados:', this.filteredPrecios);
    this.showMessage('Función de exportación en desarrollo', 'error');
  }
}
