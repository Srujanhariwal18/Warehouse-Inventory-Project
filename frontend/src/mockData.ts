import { Item, StockTransaction, StockAlert } from './types';

export const INITIAL_ITEMS: Item[] = [
  {
    id: 'item-1',
    name: 'Industrial Barcode Scanner X-200',
    sku: 'ELEC-SCN-200',
    barcode: '8901234567890',
    category: 'Hardware',
    unit: 'units',
    quantity: 42,
    lowStockThreshold: 15,
    location: 'Aisle 2, Bin A-04'
  },
  {
    id: 'item-2',
    name: 'Heavy Duty Packaging Tape (6-Pack)',
    sku: 'PKG-TPE-6PK',
    barcode: '8901234567891',
    category: 'Packaging',
    unit: 'packs',
    quantity: 8,
    lowStockThreshold: 20,
    location: 'Aisle 1, Shelf C-02'
  },
  {
    id: 'item-3',
    name: 'Corrugated Shipping Boxes (Large)',
    sku: 'PKG-BOX-LRG',
    barcode: '8901234567892',
    category: 'Packaging',
    unit: 'bundles',
    quantity: 110,
    lowStockThreshold: 30,
    location: 'Bay 4, Pallet 12'
  },
  {
    id: 'item-4',
    name: 'Thermal Shipping Labels 4x6" (Roll of 500)',
    sku: 'PRN-LBL-500',
    barcode: '8901234567893',
    category: 'Consumables',
    unit: 'rolls',
    quantity: 4,
    lowStockThreshold: 12,
    location: 'Aisle 3, Rack B-01'
  },
  {
    id: 'item-5',
    name: 'ESD Safe Protective Work Gloves (M)',
    sku: 'PPE-GLV-MED',
    barcode: '8901234567894',
    category: 'Safety',
    unit: 'pairs',
    quantity: 0,
    lowStockThreshold: 25,
    location: 'Locker Safety-3'
  },
  {
    id: 'item-6',
    name: 'High-Speed Conveyor Sensor Module',
    sku: 'AUT-SNR-MOD',
    barcode: '8901234567895',
    category: 'Robotics',
    unit: 'pieces',
    quantity: 18,
    lowStockThreshold: 5,
    location: 'Zone Tech-1'
  },
  {
    id: 'item-7',
    name: 'Handheld Stretch Wrap Film 18"',
    sku: 'PKG-WRP-18',
    barcode: '8901234567896',
    category: 'Packaging',
    unit: 'rolls',
    quantity: 56,
    lowStockThreshold: 15,
    location: 'Aisle 1, Rack D-05'
  },
  {
    id: 'item-8',
    name: 'Pallet Jack Maintenance Grease 1L',
    sku: 'MNT-GRS-01L',
    barcode: '8901234567897',
    category: 'Maintenance',
    unit: 'tins',
    quantity: 3,
    lowStockThreshold: 6,
    location: 'Shop Bay M-02'
  }
];

export const INITIAL_TRANSACTIONS: StockTransaction[] = [
  {
    id: 'tx-101',
    itemId: 'item-1',
    itemName: 'Industrial Barcode Scanner X-200',
    type: 'IN',
    quantity: 10,
    note: 'PO-88219 Inbound delivery dock #2',
    createdAt: 'Today, 10:14 AM'
  },
  {
    id: 'tx-102',
    itemId: 'item-3',
    itemName: 'Corrugated Shipping Boxes (Large)',
    type: 'OUT',
    quantity: 25,
    note: 'Order fulfillment staging line 4',
    createdAt: 'Today, 11:32 AM'
  },
  {
    id: 'tx-103',
    itemId: 'item-2',
    itemName: 'Heavy Duty Packaging Tape (6-Pack)',
    type: 'OUT',
    quantity: 12,
    note: 'Pack station replenishment batch #9',
    createdAt: 'Today, 01:05 PM'
  },
  {
    id: 'tx-104',
    itemId: 'item-4',
    itemName: 'Thermal Shipping Labels 4x6" (Roll of 500)',
    type: 'ADJUST',
    quantity: -2,
    note: 'Audit cycle correction — damaged during sorting',
    createdAt: 'Today, 02:40 PM'
  },
  {
    id: 'tx-105',
    itemId: 'item-6',
    itemName: 'High-Speed Conveyor Sensor Module',
    type: 'IN',
    quantity: 5,
    note: 'Supplier replenishment RMA return cleared',
    createdAt: 'Today, 03:15 PM'
  }
];

export const INITIAL_ALERTS: StockAlert[] = [
  {
    id: 'alt-1',
    itemId: 'item-5',
    itemName: 'ESD Safe Protective Work Gloves (M)',
    sku: 'PPE-GLV-MED',
    message: 'Stock critically depleted (0 remaining). Minimum safety margin is 25.',
    currentQuantity: 0,
    threshold: 25,
    status: 'OPEN',
    createdAt: '1 hour ago'
  },
  {
    id: 'alt-2',
    itemId: 'item-4',
    itemName: 'Thermal Shipping Labels 4x6" (Roll of 500)',
    sku: 'PRN-LBL-500',
    message: 'Approaching critical stock. 4 rolls available, threshold is 12.',
    currentQuantity: 4,
    threshold: 12,
    status: 'OPEN',
    createdAt: '2 hours ago'
  },
  {
    id: 'alt-3',
    itemId: 'item-2',
    itemName: 'Heavy Duty Packaging Tape (6-Pack)',
    sku: 'PKG-TPE-6PK',
    message: 'Inventory below reorder trigger. 8 packs remaining, threshold is 20.',
    currentQuantity: 8,
    threshold: 20,
    status: 'ACKNOWLEDGED',
    createdAt: '4 hours ago'
  }
];

export const MOVEMENT_CHART_DATA = [
  { day: 'Mon', inbound: 45, outbound: 38, net: 7 },
  { day: 'Tue', inbound: 62, outbound: 54, net: 8 },
  { day: 'Wed', inbound: 38, outbound: 42, net: -4 },
  { day: 'Thu', inbound: 78, outbound: 61, net: 17 },
  { day: 'Fri', inbound: 92, outbound: 85, net: 7 },
  { day: 'Sat', inbound: 34, outbound: 28, net: 6 },
  { day: 'Sun', inbound: 18, outbound: 15, net: 3 }
];
