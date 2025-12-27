export enum OrderStatus {
  PENDING = 'PENDING',
  PENDING_RETRY = 'PENDING_RETRY',
  PAYMENT_COMPLETED = 'PAYMENT_COMPLETED',
  INVENTORY_COMPLETED = 'INVENTORY_COMPLETED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  COMPENSATING = 'COMPENSATING',
}


export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum InventoryStatus {
  RESERVED = 'RESERVED',
  RELEASED = 'RELEASED',
  COMMITTED = 'COMMITTED',
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface BaseEvent<T = any> {
  eventId: string;
  eventType: string;
  aggregateId: string;
  timestamp: Date;
  version: number;
  correlationId: string;
  causationId?: string;
  metadata: {
    source: string;
    userId?: string;
  };
  payload: T;
}
