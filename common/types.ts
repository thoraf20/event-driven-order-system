export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
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
