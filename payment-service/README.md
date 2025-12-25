# Payment Service

Handles financial transactions and manages payment-related states within the order saga.

## Responsibilities
- Listens for `order.created` events.
- Simulates payment processing (success/failure logic).
- Handles `payment.refund` requests for compensation during saga failures.
- Ensures idempotent processing of payment events.

## Tech Features
- **Health Check**: [http://localhost:3002/health](http://localhost:3002/health)
- **Idempotency**: Prevents double-charging by tracking event IDs.
- **Dead Letter Queue**: Configured for `payment_queue`.

## Environment Variables
```env
PORT=3002
DATABASE_URL=postgres://postgres:postgres@localhost:5432/payment_db
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_PAYMENT_QUEUE=payment_queue
```
