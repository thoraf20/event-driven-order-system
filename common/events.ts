import { OrderItem } from './types';

export interface OrderCreatedPayload {
  orderId: string;
  customerId: string;
  items: OrderItem[];
  totalAmount: number;
}

export interface PaymentProcessedPayload {
  orderId: string;
  paymentId: string;
  amount: number;
  transactionId: string;
}

export interface PaymentFailedPayload {
  orderId: string;
  reason: string;
  errorCode: string;
}

export interface InventoryReservedPayload {
  orderId: string;
  reservationId: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

export interface InventoryReservationFailedPayload {
  orderId: string;
  reason: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}

export interface PaymentRefundPayload {
  orderId: string;
  amount: number;
  reason: string;
}

export interface PaymentRefundedPayload {
  orderId: string;
  paymentId: string;
  refundTransactionId: string;
}

