# cohosted

A cloud-based collaborative event planning platform built on AWS. Events are better when everyone pitches in — cohosted gives hosts, co-hosts, and attendees a shared workspace to plan together.

**Live App:** https://cohosted.cloud

---

## Features

- **Invite-only events** with shareable token links that can be revoked or regenerated
- **Role-based access** — host, co-host, and attendee roles with enforced permissions
- **RSVPs** — yes / no / maybe with guest counts
- **Polls** — single or multi-select, anonymous or public voting, manual or timed close
- **Potluck coordination** — hosts define items with quantity limits, attendees claim them
- **Task checklists** — hosts assign tasks, attendees can volunteer
- **Announcements** — posted by host/co-host, SMS delivered to opted-in members
- **Real-time group chat** — WebSocket-based per-event chat room with message history
- **SMS reminders** — per-user, per-event reminder preferences (1 hour, 24 hours, 1 week, etc.)
- **Recurring events** — daily, weekly, monthly with per-occurrence or shared planning
- **Google OAuth** — sign in with Google or email/password via Amazon Cognito
- **AI assistant** — Gemini-powered planning assistant with event context

---

## Architecture

cohosted uses a 3-tier serverless microservices architecture deployed entirely on AWS.

```
Browser (React SPA on S3)
    │
    ├── HTTPS ──► API Gateway HTTP API
    │                   ├── /events/* ──► Events Lambda
    │                   └── /users/*  ──► Users Lambda
    │
    └── WSS ───► API Gateway WebSocket API
                        └── Chat Lambda

Events Lambda ──► SNS Topic ──► Notifications Lambda ──► SNS SMS
Events Lambda ──► EventBridge Scheduler ──► Notifications Lambda ──► SNS SMS
```

### AWS Services Used

| Service | Purpose |
|---|---|
| AWS Lambda | Compute for all four backend services (ARM64/Graviton) |
| Amazon API Gateway | HTTP REST API and WebSocket API |
| Amazon RDS PostgreSQL | Relational data — events, users, RSVPs, polls, potluck, tasks |
| Amazon DynamoDB | Chat messages and WebSocket connection state |
| Amazon S3 | Frontend static hosting and event flyer storage |
| Amazon Cognito | Authentication — email/password and Google OAuth |
| Amazon SNS | Announcement fan-out and SMS delivery |
| Amazon EventBridge Scheduler | Per-user timed SMS reminders |
| Amazon ECR | Docker image storage for all services |
| AWS Secrets Manager | Database credentials and app secrets |
| Amazon VPC | Network isolation for Lambda-to-RDS connectivity |
| AWS IAM | Least-privilege execution roles |

---

## Backend Services

The backend is split into four independent microservices, each deployed as a containerized Lambda function.

### Events (`/events`)
Core service. Handles event CRUD, invite links, member roles, RSVPs, polls, potluck, tasks, announcements, and SMS reminder scheduling.
- Python 3.12, FastAPI, Mangum, SQLAlchemy, Alembic
- Swagger UI: https://sb2jexwqctfraqkoidlax3iu6a0zooed.lambda-url.us-east-1.on.aws/events/docs

### Users (`/users`)
User profile management. Validates Cognito JWTs and lazy-creates user records on first login.
- Python 3.12, FastAPI, Mangum, SQLAlchemy, Alembic
- Swagger UI: https://sb2jexwqctfraqkoidlax3iu6a0zooed.lambda-url.us-east-1.on.aws/users/docs

### Chat (WebSocket)
Real-time group chat per event. Manages WebSocket connections in DynamoDB and fans out messages to all connected clients.
- Python 3.12, pure Lambda handlers
- WebSocket: `wss://jw6ntqobmj.execute-api.us-east-1.amazonaws.com/production`

### Notifications
SMS delivery for announcements and scheduled reminders. Triggered by SNS and EventBridge Scheduler.
- Python 3.12, pure Lambda handlers

---

## Project Structure

```
cohosted/
├── frontend/                        # React + TypeScript SPA (Vite)
├── backend/
│   └── services/
│       ├── events/                  # Events microservice
│       │   ├── app/
│       │   │   ├── routers/         # events, rsvps, polls, potluck, tasks, announcements, reminders
│       │   │   ├── db/models/       # SQLAlchemy models
│       │   │   ├── schemas/         # Pydantic schemas
│       │   │   ├── deps/            # Auth and DB dependencies
│       │   │   └── utils/           # S3, SNS, EventBridge scheduler
│       │   ├── alembic/             # Database migrations
│       │   ├── tests/               # pytest test suite
│       │   └── Dockerfile
│       ├── users/                   # Users microservice
│       │   ├── app/
│       │   ├── alembic/
│       │   ├── tests/
│       │   └── Dockerfile
│       ├── chat/                    # Chat WebSocket service
│       │   ├── app/
│       │   ├── tests/
│       │   └── Dockerfile
│       └── notifications/           # SMS notifications service
│           ├── app/
│           ├── tests/
│           └── Dockerfile
└── terraform/                       # All AWS infrastructure as code
```

---

## Infrastructure as Code

All AWS resources are defined in Terraform under the `terraform/` directory. Remote state is stored in S3 with a DynamoDB lock table.

```bash
cd terraform
terraform init
terraform plan -var="db_password=..." -var="cognito_user_pool_id=..."
terraform apply
```

Key Terraform files:
- `main.tf` — provider and backend config
- `lambda.tf` — all Lambda functions and IAM roles
- `api_gateway.tf` — HTTP API routes and integrations
- `api_gateway_ws.tf` — WebSocket API for chat
- `rds.tf` — PostgreSQL database
- `dynamodb.tf` — chat messages and connections tables
- `sns.tf` — announcements topic and EventBridge scheduler role
- `cognito.tf` — user pool and Google OAuth
- `s3.tf` — frontend and flyer buckets
- `ecr.tf` — container image repositories

---

## CI/CD Pipeline

The project uses GitHub Actions with two workflows.

### Test (runs on every PR to main)

Four pytest jobs run in parallel — one per service. The Events and Users jobs spin up a PostgreSQL container, run migrations, and execute the full test suite. The Chat and Notifications jobs run with all AWS calls mocked. All four are required status checks. PRs cannot be merged unless all pass.

### Deploy (runs on merge to main)

Path filtering determines which jobs run based on what changed.

1. **Terraform Apply** — applies infrastructure changes if `terraform/**` changed
2. **Deploy Events** — builds ARM64 Docker image, pushes to ECR, updates Lambda, runs migrations
3. **Deploy Users** — same as above
4. **Deploy Chat** — builds and deploys, no migrations
5. **Deploy Notifications** — builds and deploys, no migrations
6. **Deploy Frontend** — builds React app, syncs to S3

---

## Running Tests Locally

```bash
# Events service
cd backend/services/events
pip install -r requirements.txt pytest pytest-cov httpx
DATABASE_URL=postgresql://user:pass@localhost:5432/test_events pytest tests/ -v

# Users service
cd backend/services/users
pip install -r requirements.txt pytest pytest-cov httpx
DATABASE_URL=postgresql://user:pass@localhost:5432/test_users pytest tests/ -v

# Chat service (no database needed)
cd backend/services/chat
pip install -r requirements.txt pytest pytest-cov
MESSAGES_TABLE=test CONNECTIONS_TABLE=test WS_ENDPOINT=localhost/test pytest tests/ -v

# Notifications service (no database needed)
cd backend/services/notifications
pip install -r requirements.txt pytest pytest-cov
pytest tests/ -v
```

---

## Deploying a New Service (First Time Only)

Terraform requires a valid image in ECR before it can create a Lambda function. For any new service, push an initial image manually before running `terraform apply`:

```bash
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/event-rsvp-<service>"

aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com"

docker build --platform linux/arm64 --provenance=false \
  -t "${ECR_URL}:latest" \
  ./backend/services/<service>

docker push "${ECR_URL}:latest"
```

After the image is pushed, run `terraform apply` normally. All future deploys are handled by GitHub Actions.

---

## Unlocking Terraform State

If a `terraform apply` is interrupted and leaves the state locked:

```bash
aws dynamodb delete-item \
  --table-name event-rsvp-tfstate-lock \
  --key '{"LockID": {"S": "event-rsvp-tfstate/terraform.tfstate"}}'
```

---

## GitHub Secrets Required

| Secret | Description |
|---|---|
| `AWS_ACCESS_KEY_ID` | AWS credentials for CI/CD |
| `AWS_SECRET_ACCESS_KEY` | AWS credentials for CI/CD |
| `TF_DB_PASSWORD` | RDS master password |
| `DATABASE_URL` | Full PostgreSQL connection string |
| `COGNITO_USER_POOL_ID` | Cognito user pool ID |
| `COGNITO_CLIENT_ID` | Cognito app client ID |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

---

## Team

- **Mark Garcia** — Backend microservices, AWS infrastructure, Terraform, CI/CD pipeline
- **Elena Marquez** — Frontend development, Figma design, integration, Backend development, authentication, database design

---

## Links

- [Figma Design](https://www.figma.com/design/cr3ElfJyQTDsn9nquZHg5i/CPSC465-Event-RSVP-Site?node-id=0-1&t=4dni4iOEWUs89pCP-1)
- [Final Report](https://docs.google.com/document/d/1nq0QqKa5QcfoHGlqh5gnoSozd1kURA_FajuePEWxNoQ/edit?usp=sharing)
- [Phase 2 Progress Report](https://docs.google.com/document/d/1TQZr18Rt7ao-ByCYpowDNpUAKZ4graowqEsWBGHzRXQ/edit?usp=sharing)
- [Project Proposal](https://docs.google.com/document/d/1Js2Rpi6nMlAt2Eynr0SzTdZUpjhHj0XIQBLGx1zAEH0/edit?usp=sharing)
