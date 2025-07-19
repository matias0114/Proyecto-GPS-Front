export interface PriceList {
  id?: number;
  name: string;
  product?: Product;
  productId?: number;
  warehouse?: Warehouse;
  warehouseId?: number;
  salePrice: number;
  costPrice?: number;
  marginPercentage?: number;
  validFrom: Date;
  validTo?: Date;
  active?: boolean;
  priceType?: PriceType;
  currency?: string;
  pricingMethod?: PricingMethod;
}

export enum PriceType {
  GENERAL = 'GENERAL',
  WHOLESALE = 'WHOLESALE',
  RETAIL = 'RETAIL',
  GOVERNMENT = 'GOVERNMENT',
  SPECIAL = 'SPECIAL'
}

export enum PricingMethod {
  LAST_PURCHASE = 'LAST_PURCHASE',
  WEIGHTED_AVERAGE = 'WEIGHTED_AVERAGE',
  FIFO = 'FIFO',
  LIFO = 'LIFO',
  LILO = 'LILO'
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

export interface Warehouse {
  id?: number;
  name: string;
  location?: string;
  capacity?: number;
  status?: string;
}
