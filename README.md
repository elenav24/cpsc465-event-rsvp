<div align="center">

<img src="frontend/public/favicon.svg" alt="Cohosted" width="64" height="64" />

# cohosted

**Events are better when everyone pitches in.**

A cloud-native collaborative event planning platform built entirely on AWS — where hosts, co-hosts, and attendees share one workspace to plan together.

[![Live App](https://img.shields.io/badge/Live%20App-cohosted.cloud-c8567e?style=flat-square)](https://cohosted.cloud)
[![Tests](https://img.shields.io/github/actions/workflow/status/elenav24/cohosted/test.yml?label=tests&style=flat-square)](https://github.com/elenav24/cohosted/actions)
[![Deploy](https://img.shields.io/github/actions/workflow/status/elenav24/cohosted/deploy.yml?label=deploy&style=flat-square)](https://github.com/elenav24/cohosted/actions)

</div>

---

## How It Works

<table>
<tr>
<td width="33%" align="center">
<img src="frontend/src/assets/set-the-vibe.png" alt="Set the Vibe" width="280" /><br/>
<strong>1. Set the Vibe</strong><br/>
<sub>Create your event with a title, date, location, and flyer. Start from a template or build from scratch.</sub>
</td>
<td width="33%" align="center">
<img src="frontend/src/assets/gather-your-people.png" alt="Gather Your People" width="280" /><br/>
<strong>2. Gather Your People</strong><br/>
<sub>Share one invite link. Members join instantly — no accounts required to view, sign up to participate.</sub>
</td>
<td width="33%" align="center">
<img src="frontend/src/assets/decide-together.png" alt="Decide Together" width="280" /><br/>
<strong>3. Decide Together</strong><br/>
<sub>Polls, potluck signups, task checklists, and group chat — everything in one collaborative workspace.</sub>
</td>
</tr>
</table>

---

## Features

| Feature | Details |
|---|---|
| **Invite-only events** | Shareable token links — revocable and regeneratable at any time |
| **Role-based access** | Host, co-host, and attendee roles with enforced permissions at every endpoint |
| **RSVPs** | Yes / no / maybe with guest counts; potluck claims auto-release on "no" |
| **Polls** | Single or multi-select, anonymous or public, manual or timed close |
| **Potluck coordination** | Hosts define items with quantity limits; attendees claim them |
| **Task checklists** | Hosts assign tasks with due dates; attendees can volunteer |
| **Announcements** | Posted by host/co-host, emailed to all event members via SES |
| **Real-time group chat** | WebSocket-based per-event chat room with persistent message history |
| **Email reminders** | Per-user, per-event reminder preferences (1 hour, 24 hours, 1 week) |
| **Recurring events** | Daily, weekly, or monthly recurrence with linked occurrences |
| **Google OAuth** | Sign in with Google or email/password via Amazon Cognito |
| **AI assistant** | Claude-powered planning assistant with full live event context |

---

## Architecture

Cohosted is a three-tier serverless architecture. The frontend is a React SPA on S3/CloudFront. The backend is five independent Lambda microservices behind API Gateway. Data lives in RDS PostgreSQL and DynamoDB.

```
Browser (React SPA — S3 + CloudFront)
    │
    ├── HTTPS ──► API Gateway HTTP API
    │                   ├── /events/* ──► Events Lambda   (FastAPI + Mangum)
    │                   ├── /users/*  ──► Users Lambda    (FastAPI + Mangum)
    │                   └── /ai/*     ──► AI Lambda       (FastAPI + Mangum)
    │
    └── WSS ───► API Gateway WebSocket API
                        └── Chat Lambda  (pure handlers)

Events Lambda ──► SNS Topic ──────────────► Notifications Lambda ──► SES Email
Events Lambda ──► EventBridge Scheduler ──► Notifications Lambda ──► SES Email
AI Lambda     ──► Amazon Bedrock (Claude Haiku 4.5)
```

### AWS Services

| Service | Purpose |
|---|---|
| **AWS Lambda** | Compute for all five backend services (ARM64/Graviton) |
| **Amazon API Gateway** | HTTP REST API (`/events`, `/users`, `/ai`) and WebSocket API (chat) |
| **Amazon RDS PostgreSQL** | Relational data — events, users, RSVPs, polls, potluck, tasks, announcements, reminders |
| **Amazon DynamoDB** | Chat messages (90-day TTL) and WebSocket connection state (24h TTL) |
| **Amazon S3** | Frontend static hosting and event flyer storage |
| **Amazon CloudFront** | CDN for the React SPA — custom domain at cohosted.cloud |
| **Amazon Cognito** | Authentication — email/password and Google OAuth |
| **Amazon SNS** | Announcement fan-out to the Notifications Lambda |
| **Amazon SES** | Transactional email — announcements and reminders |
| **Amazon EventBridge Scheduler** | Per-user timed reminder invocations |
| **Amazon Bedrock** | Claude Haiku 4.5 inference for the AI planning assistant |
| **Amazon ECR** | Container image repositories for all five services |
| **AWS Secrets Manager** | Database credentials and app secrets |
| **Amazon VPC** | Network isolation for Lambda-to-RDS private connectivity |
| **AWS IAM** | Least-privilege execution roles |

---

## Backend Services

Five independent microservices — each has its own Docker image, ECR repository, Lambda function, and deploy job.

### Events (`/events`)
Core service. Event CRUD, invite links, member roles, RSVPs, polls, potluck, tasks, announcements, and reminder scheduling.
- Python 3.12 · FastAPI · Mangum · SQLAlchemy · Alembic
- Integrates with: S3 (flyer uploads), SNS (announcement fan-out), EventBridge Scheduler (reminders)

### Users (`/users`)
User profile management. Validates Cognito JWTs and lazy-creates user records on first login.
- Python 3.12 · FastAPI · Mangum · SQLAlchemy · Alembic

### Chat (WebSocket)
Real-time group chat per event. Manages WebSocket connections in DynamoDB and fans out messages to all connected clients. Also broadcasts live event updates (new polls, tasks, announcements) to connected tabs.
- Python 3.12 · pure Lambda handlers · DynamoDB · API Gateway Management API

### Notifications
Email delivery for announcements and scheduled reminders. Triggered by SNS (announcements) or EventBridge Scheduler (reminders). Sends styled HTML emails via Amazon SES.
- Python 3.12 · pure Lambda handler · SES · SQLAlchemy (for member email lookup)

### AI (`/ai`)
Claude-powered planning assistant. On every request, fetches full event context from RDS and DynamoDB — members, RSVPs, polls, potluck, tasks, announcements, and recent chat — then calls Claude Haiku 4.5 via Amazon Bedrock's Converse API.
- Python 3.12 · FastAPI · Mangum · boto3 (Bedrock) · SQLAlchemy
- Model: `us.anthropic.claude-haiku-4-5-20251001-v1:0` (cross-region inference profile)

---

## Project Structure

```
cohosted/
├── frontend/                        # React 19 + TypeScript SPA (Vite + Tailwind CSS 4)
│   ├── src/
│   │   ├── pages/                   # LandingPage, EventPage, EventsPage, CreateEventPage, ...
│   │   ├── components/              # Nav, Footer, shared UI
│   │   ├── api/                     # events.ts, users.ts, chat.ts — typed API clients
│   │   └── auth/                    # AuthContext — Cognito session management
│   └── public/
├── backend/
│   └── services/
│       ├── events/                  # Events microservice
│       │   ├── app/
│       │   │   ├── routers/         # events, rsvps, polls, potluck, tasks, announcements, reminders
│       │   │   ├── db/models/       # Event, EventMember, RSVP, Poll, PotluckItem, Task, Announcement, Reminder
│       │   │   ├── schemas/         # Pydantic request/response models
│       │   │   └── deps/            # Auth (JWT) and DB session dependencies
│       │   ├── alembic/             # Database migrations
│       │   ├── tests/               # pytest suite (runs against real PostgreSQL)
│       │   └── Dockerfile
│       ├── users/                   # User profile service
│       ├── chat/                    # WebSocket chat service
│       ├── notifications/           # Email notification service
│       └── ai/                      # AI planning assistant
│           ├── app/
│           │   ├── bedrock.py       # Bedrock Converse API wrapper
│           │   └── context.py       # Event context aggregation + system prompt builder
│           └── tests/
└── terraform/                       # All AWS infrastructure as code
    ├── lambda.tf                    # Lambda functions + IAM roles
    ├── api_gateway.tf               # HTTP API routes
    ├── api_gateway_ws.tf            # WebSocket API
    ├── rds.tf                       # PostgreSQL database
    ├── dynamodb.tf                  # Chat tables
    ├── sns.tf                       # Announcements topic + EventBridge role
    ├── cognito.tf                   # User pool + Google OAuth
    ├── s3.tf                        # Frontend + flyer buckets
    ├── ecr.tf                       # Container image repos
    ├── vpc.tf                       # VPC + subnets + security groups
    └── domain.tf                    # CloudFront + custom domain
```

---

## Infrastructure as Code

All AWS resources are defined in Terraform under `terraform/`. Remote state is stored in S3 with a DynamoDB lock table — no manual console clicks required.

```bash
cd terraform
terraform init
terraform plan -var="db_password=..." -var="cognito_user_pool_id=..."
terraform apply
```

> **First-time setup:** Terraform requires a valid image in ECR before it can create a Lambda function. Push an initial image manually for each new service before the first `terraform apply` — all subsequent deploys are handled by CI/CD.

```bash
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/event-rsvp-<service>"

aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com"

docker build --platform linux/arm64 --provenance=false \
  -t "${ECR_URL}:latest" ./backend/services/<service>

docker push "${ECR_URL}:latest"
```

> **Unlocking state:** If a `terraform apply` is interrupted and leaves the state locked:
> ```bash
> aws dynamodb delete-item \
>   --table-name event-rsvp-tfstate-lock \
>   --key '{"LockID": {"S": "event-rsvp-tfstate/terraform.tfstate"}}'
> ```

---

## CI/CD Pipeline

Two GitHub Actions workflows handle testing and deployment.

### Test — runs on every PR to `main`

Five pytest jobs run in parallel, one per service:

| Job | Database | AWS |
|---|---|---|
| Events | Real PostgreSQL 16 container + Alembic migrations | Mocked |
| Users | Real PostgreSQL 16 container + Alembic migrations | Mocked |
| Chat | None | Mocked |
| Notifications | None | Mocked |
| AI | None | Mocked |

All five are required status checks — PRs cannot merge unless every one passes.

### Deploy — runs on merge to `main`

Path filtering ensures only changed services are deployed:

1. **Terraform Apply** — if `terraform/**` changed
2. **Deploy Events** — build ARM64 image → push to ECR → update Lambda → invoke `{"action":"migrate"}`
3. **Deploy Users** — same as above
4. **Deploy Chat** — build and deploy, no migrations
5. **Deploy Notifications** — build and deploy, no migrations
6. **Deploy AI** — build and deploy, no migrations
7. **Deploy Frontend** — `npm run build` → `aws s3 sync` → CloudFront invalidation

A manual `workflow_dispatch` option force-deploys all services at once regardless of what changed.

Every deploy is a Docker image push to ECR. Lambda always runs the exact image built from that commit SHA.

---

## Running Tests Locally

```bash
# Events service (requires a running PostgreSQL instance)
cd backend/services/events
pip install -r requirements.txt pytest pytest-cov httpx
DATABASE_URL=postgresql://user:pass@localhost:5432/test_events alembic upgrade head
DATABASE_URL=postgresql://user:pass@localhost:5432/test_events pytest tests/ -v

# Users service
cd backend/services/users
pip install -r requirements.txt pytest pytest-cov httpx
DATABASE_URL=postgresql://user:pass@localhost:5432/test_users alembic upgrade head
DATABASE_URL=postgresql://user:pass@localhost:5432/test_users pytest tests/ -v

# Chat service (no database or AWS credentials needed)
cd backend/services/chat
pip install -r requirements.txt pytest pytest-cov
MESSAGES_TABLE=test CONNECTIONS_TABLE=test WS_ENDPOINT=localhost/test pytest tests/ -v

# Notifications service (no database or AWS credentials needed)
cd backend/services/notifications
pip install -r requirements.txt pytest pytest-cov
pytest tests/ -v

# AI service (no database or AWS credentials needed)
cd backend/services/ai
pip install -r requirements-dev.txt
MESSAGES_TABLE=test pytest tests/ -v
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

**Elena Marquez** — Frontend development, Figma design, authentication, database design

**Mark Garcia** — Backend microservices, AWS infrastructure, Terraform, CI/CD pipeline, backend development
