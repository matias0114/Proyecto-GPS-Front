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
  batches?: Batch[];
}

export enum PricingMethod {
  LAST_PURCHASE = 'LAST_PURCHASE',
  WEIGHTED_AVERAGE = 'WEIGHTED_AVERAGE',
  FIFO = 'FIFO',
  LIFO = 'LIFO',
  LILO = 'LILO'
}

export interface Batch {
  id?: number;
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

export enum BatchStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  BLOCKED = 'BLOCKED',
  EXHAUSTED = 'EXHAUSTED'
}
