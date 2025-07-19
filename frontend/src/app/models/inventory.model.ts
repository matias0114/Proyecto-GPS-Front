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

export interface Batch {
  id?: number;
  productId?: number;
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

export enum BatchStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  BLOCKED = 'BLOCKED',
  EXHAUSTED = 'EXHAUSTED'
}
