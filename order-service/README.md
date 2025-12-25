# Order Service (Orchestrator)

The central brain of the system, responsible for coordinating the order saga and maintaining the global state of transactions.

## Responsibilities
- Receives HTTP requests to create orders.
- Orchestrates the Saga pattern by publishing events and listening for state changes from Payment and Inventory services.
- Manages order state transitions: `PENDING` -> `PAYMENT_COMPLETED` -> `COMPLETED`.
- Triggers compensation flows (Refunds/Cancellations) on failures.
- Executes **Saga Timeouts** for stuck transactions.

## Tech Features
- **Swagger Docs**: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
- **Health Check**: [http://localhost:3001/health](http://localhost:3001/health)
- **Event Store**: Persistent logs in `order_events` table for auditability.
- **Distributed Tracing**: Generates the initial `x-correlation-id` for every request.

## API Endpoints

### Orders
- `POST /orders`: Create a new order.
- `GET /orders/:id`: Get order details (including items).
- `GET /orders/:id/events`: Get full audit log of saga events for this order.

## Environment Variables
```env
PORT=3001
DATABASE_URL=postgres://postgres:postgres@localhost:5432/order_db
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_ORDER_QUEUE=order_queue
```
