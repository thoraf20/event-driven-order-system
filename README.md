# Event-Driven Order Processing System (Saga Pattern)

A robust, production-grade microservices system built with NestJS, RabbitMQ, and PostgreSQL, demonstrating advanced distributed systems patterns.

## Architecture Overview

This system implements an **Orchestration-based Saga Pattern** to manage distributed transactions across three core microservices.

- **Order Service**: The orchestrator. manages order lifecycle and coordinates the saga.
- **Payment Service**: Handles transaction processing and refunds.
- **Inventory Service**: Manages stock reservation and release.
- **Common Library**: Shared types, entities (`IdempotencyEntity`), and event contracts.

### The Saga Flow
1. **Order Service**: Creates order (PENDING) -> Publishes `order.created`.
2. **Payment Service**: Receives `order.created` -> Processes payment -> Publishes `payment.processed` or `payment.failed`.
3. **Inventory Service**: Receives `payment.processed` -> Reserves stock -> Publishes `inventory.reserved` or `inventory.reservation_failed`.
4. **Order Service**: Receives `inventory.reserved` -> Completes order (COMPLETED).

**Compensation Logic**: 
- If Inventory fails, a `payment.refund` is triggered.
- If an order fails, `order.failed` is broadcasted to release any reserved stock.

## Key Features

### Resilience & Reliability
- **Distributed Idempotency**: Prevents duplicate message processing using a shared idempotency layer.
- **Dead Letter Queues (DLQ)**: Failed messages are automatically routed to DLX and stored in DLQs for analysis.
- **Manual Acknowledgements**: Ensures "At-Least-Once" delivery; messages are only acknowledged after successful DB commit.
- **Saga Timeout Worker**: Automatically resolves transactions stuck in intermediate states.

### Observability
- **Structured Logging**: JSON logs via Pino, optimized for ELK/CloudWatch.
- **Distributed Tracing**: End-to-end traceability using `x-correlation-id` propagated across HTTP and RabbitMQ.
- **Swagger Documentation**: Interactive API docs available at `/api/docs` (Order Service).
- **Health Checks**: Real-time monitoring of DB and RabbitMQ connectivity via `/health`.

## Tech Stack
- **Framework**: NestJS
- **Database**: PostgreSQL (TypeORM)
- **Messaging**: RabbitMQ
- **Logging**: Pino
- **Monitoring**: Terminus
- **Documentation**: Swagger

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- RabbitMQ

### Setup
1. Clone the repository.
2. Install dependencies in each service:
   ```bash
   cd order-service && npm install
   cd ../payment-service && npm install
   cd ../inventory-service && npm install
   ```
3. Configure `.env` files for each service (examples provided in each directory).
4. Run the services:
   ```bash
   npm run start:dev
   ```

## Roadmap Progress
- [x] Phase 1: Foundation (Core Microservices)
- [x] Phase 2: Saga Implementation (Orchestration & Compensation)
- [x] Phase 3: Resilience (DLQ, Retries, Timeouts)
- [x] Phase 4: Observability (Logging, Tracing, Health)
