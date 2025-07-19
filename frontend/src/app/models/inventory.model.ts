export interface Warehouse {
  id?: number;
  name: string;
  location?: string;
  capacity?: number;
  status?: string;
}

export interface Inventory {
  id?: number;
  warehouse?: Warehouse;
  batch?: Batch;
  quantity?: number;
  currentStock?: number;
  inventoryType?: string;
  lastUpdate?: Date;
}

export interface InventoryDTO {
  id?: number;
  warehouseId: number;
  batchId: number;
  quantity: number;
  inventoryType: string;
  lastUpdate?: Date;
}

// DTO específico para actualización de inventarios
// Debe coincidir exactamente con UpdateInventoryDTO del backend
export interface UpdateInventoryDTO {
  quantity: number;
  currentStock: number;
}

export interface Batch {
  id?: number;
  productId?: number;
  product?: Product;
  batchNumber: string;
  expirationDate: Date;
  manufacturingDate?: Date;
  entryDate?: Date;
  status?: BatchStatus;
  purchasePrice?: number;
  costPrice?: number;
  supplier?: string;
  invoiceNumber?: string;
  storageConditions?: string;
  initialQuantity?: number;
  quantity?: number;
}

export interface Product {
  id?: number;
  code: string;
  name: string;
  description?: string;
  category?: string;
  presentation?: string;
  laboratory?: string;
  defaultPricingMethod?: PricingMethod;
  basePrice?: number;
  unit?: string;
  active?: boolean;
}

export enum PricingMethod {
  LAST_PURCHASE = 'LAST_PURCHASE',
  WEIGHTED_AVERAGE = 'WEIGHTED_AVERAGE',
  FIFO = 'FIFO',
  LIFO = 'LIFO',
  LILO = 'LILO'
}

export enum BatchStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  BLOCKED = 'BLOCKED',
  EXHAUSTED = 'EXHAUSTED'
}
