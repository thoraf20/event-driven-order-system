# Inventory Service

Manages product stock levels and handle reservation/release cycles for orders.

## Responsibilities
- Listens for `payment.processed` events to reserve stock.
- Emits `inventory.reserved` or `inventory.reservation_failed`.
- Listens for `order.failed` to release reserved stock (Compensation).
- Maintains product availability records.

## Tech Features
- **Health Check**: [http://localhost:3003/health](http://localhost:3003/health)
- **Manual Acks**: Guarantees stock is only reserved if DB commit succeeds.
- **Idempotency**: Prevents multiple stock deductions for the same order.

## Environment Variables
```env
PORT=3003
DATABASE_URL=postgres://postgres:postgres@localhost:5432/inventory_db
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_INVENTORY_QUEUE=inventory_queue
```
