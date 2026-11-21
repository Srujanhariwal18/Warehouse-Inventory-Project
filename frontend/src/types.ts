export interface Item {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category?: string;
  unit: string;
  quantity: number;
  lowStockThreshold: number;
  location?: string;
}

export type TransactionType = 'IN' | 'OUT' | 'ADJUST';

export interface StockTransaction {
  id: string;
  itemId: string;
  itemName?: string;
  type: TransactionType;
  quantity: number;
  note?: string;
  createdAt?: string;
}

export interface StockAlert {
  id: string;
  itemId: string;
  itemName?: string;
  sku?: string;
  message: string;
  currentQuantity: number;
  threshold: number;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  createdAt: string;
}
