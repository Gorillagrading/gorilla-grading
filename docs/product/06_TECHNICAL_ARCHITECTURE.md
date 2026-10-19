# TECHNICAL ARCHITECTURE — GREENFIELD

## Prototype stage

Do not over-engineer.

Recommended first stack for prototypes:

- Next.js
- TypeScript
- Tailwind CSS or a restrained CSS system
- Component library only where useful
- Local/mock data first
- Git/GitHub

## Production direction

Frontend:
- Next.js + TypeScript

Backend:
- Node.js/TypeScript or Python/FastAPI depending on service boundaries

Database:
- PostgreSQL

Storage:
- S3-compatible object storage

Async processing:
- Queue/worker architecture when CV workloads arrive

Automation:
- n8n where it reduces manual operational work

## Core domains

- users
- submissions
- orders
- cards
- images
- grading_jobs
- grading_results
- certificates
- shipments
- payments
- events

## API concept

POST /submissions
GET /submissions/:id
GET /tracking/:id
POST /cards/verify
GET /certificates/:id
GET /cards/:id/report

## Principle

Prototype UI against mock API contracts first. Then replace mocks with real services without redesigning the UX.
