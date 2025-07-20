export interface Venta {
  id?: number;
  patientRut: string;
  patientName: string;
  saleDate?: Date;
  subtotal: number;
  discountAmount?: number;
  discountPercentage?: number;
  totalAmount: number;
  benefitType?: string;
  isBeneficiary: boolean;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  saleItems: VentaItem[];
}

export interface VentaItem {
  id?: number;
  productId: number;
  productCode: string;
  productName: string;
  batchId: number;
  batchNumber: string;
  warehouseId: number;
  warehouseName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  pricingMethod?: 'LAST_PURCHASE' | 'WEIGHTED_AVERAGE' | 'FIFO' | 'LIFO' | 'LILO';
}

export interface VentaCreateDTO {
  patientRut: string;
  saleItems: VentaItemCreateDTO[];
}

export interface VentaItemCreateDTO {
  productId: number;
  batchId: number;
  warehouseId: number;
  quantity: number;
}

// Interfaces para la respuesta del inventario (estructura anidada del backend)
export interface InventarioResponse {
  id: number;
  warehouseId: number;
  batchId: number;
  quantity: number;
  currentStock: number;
  inventoryType: string;
  lastUpdate: Date;
  warehouse: {
    id: number;
    name: string;
    location?: string;
  };
  batch: {
    id: number;
    batchNumber: string;
    expirationDate: Date;
    manufacturingDate?: Date;
    product: {
      id: number;
      code: string;
      name: string;
      description?: string;
      price?: number;
      category?: string;
    };
  };
}

export interface ProductoDisponible {
  id: number;
  code: string;
  name: string;
  description?: string;
  category?: string;
}

export interface BodegaDisponible {
  id: number;
  name: string;
  location?: string;
  capacity?: number;
}
