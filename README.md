<div align="center">

<img src="frontend/public/favicon.svg" alt="Cohosted" width="64" height="64" />

# cohosted

**Events are better when everyone pitches in.**

A collaborative event planning platform where hosts, co-hosts, and attendees share one workspace to plan together.

[![Live App](https://img.shields.io/badge/Live%20App-cohosted.cloud-c8567e?style=flat-square)](https://cohosted.cloud)
[![Tests](https://img.shields.io/github/actions/workflow/status/elenav24/cohosted/test.yml?label=tests&style=flat-square)](https://github.com/elenav24/cohosted/actions)
[![Deploy](https://img.shields.io/github/actions/workflow/status/elenav24/cohosted/deploy.yml?label=deploy&style=flat-square)](https://github.com/elenav24/cohosted/actions)

> **Looking for the original all-AWS architecture?** See the [`aws`](https://github.com/elenav24/cohosted/tree/aws) branch — it uses RDS, S3/CloudFront, and Amazon Bedrock instead of the free-tier stack described here.

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

<!-- Architecture diagram goes here -->

Cohosted uses a hybrid free-tier architecture. The frontend is a React SPA on Vercel. The backend is five independent Lambda microservices behind API Gateway. Relational data lives in Neon (serverless PostgreSQL), real-time state in DynamoDB, and file uploads in Cloudflare R2.

```
Browser (React SPA — Vercel)
    │
    ├── HTTPS ──► API Gateway HTTP API (api.cohosted.cloud)
    │                   ├── /events/* ──► Events Lambda   (FastAPI + Mangum)
    │                   ├── /users/*  ──► Users Lambda    (FastAPI + Mangum)
    │                   └── /ai/*     ──► AI Lambda       (FastAPI + Mangum)
    │
    └── WSS ───► API Gateway WebSocket API
                        └── Chat Lambda  (pure handlers)

Events Lambda ──► Cloudflare R2          (flyer image uploads)
Events Lambda ──► SNS Topic ──────────────► Notifications Lambda ──► SES Email
Events Lambda ──► EventBridge Scheduler ──► Notifications Lambda ──► SES Email
AI Lambda     ──► OpenRouter             (Claude Haiku 4.5)

All stateful Lambdas ──► Neon PostgreSQL  (events, users, RSVPs, polls, potluck, tasks)
Chat Lambda          ──► DynamoDB         (messages + WebSocket connection state)
```

### Services & Providers

| Layer | Service | Provider | Cost |
|---|---|---|---|
| **Frontend** | React SPA hosting | Vercel | Free |
| **Compute** | Lambda (5 functions, ARM64) | AWS | Free tier |
| **API** | HTTP + WebSocket API Gateway | AWS | Free tier |
| **Database** | Serverless PostgreSQL | Neon | Free tier |
| **Real-time state** | DynamoDB (chat + connections) | AWS | Free tier |
| **File storage** | Flyer image uploads | Cloudflare R2 | Free tier |
| **Auth** | Email/password + Google OAuth | Amazon Cognito | Free tier |
| **AI** | Claude Haiku 4.5 | OpenRouter | Pay-per-use |
| **Email** | Announcements + reminders | Amazon SES | Near-free |
| **Notifications** | SMS fan-out | Amazon SNS | Pay-per-SMS |
| **Scheduling** | Event reminders | EventBridge Scheduler | Free tier |
| **Container registry** | Docker images | Amazon ECR | Free tier |
| **Infrastructure** | All AWS resources | Terraform | — |

---

## Backend Services

Five independent microservices — each has its own Docker image, ECR repository, Lambda function, and deploy job.

### Events (`/events`)
Core service. Event CRUD, invite links, member roles, RSVPs, polls, potluck, tasks, announcements, and reminder scheduling.
- Python 3.12 · FastAPI · Mangum · SQLAlchemy · Alembic
- Integrates with: Cloudflare R2 (flyer uploads), SNS (announcement fan-out), EventBridge Scheduler (reminders)

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
Claude-powered planning assistant. On every request, fetches full event context from Neon and DynamoDB — members, RSVPs, polls, potluck, tasks, announcements, and recent chat — then calls Claude Haiku 4.5 via OpenRouter.
- Python 3.12 · FastAPI · Mangum · httpx · SQLAlchemy
- Model: `anthropic/claude-haiku-4-5` via OpenRouter

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
│   └── vercel.json                  # SPA rewrite rules + security headers
├── backend/
│   └── services/
│       ├── events/                  # Events microservice
│       │   ├── app/
│       │   │   ├── routers/         # events, rsvps, polls, potluck, tasks, announcements, reminders
│       │   │   ├── db/models/       # Event, EventMember, RSVP, Poll, PotluckItem, Task, Announcement, Reminder
│       │   │   ├── schemas/         # Pydantic request/response models
│       │   │   └── deps/            # Auth (JWT) and DB session dependencies
│       │   ├── alembic/             # Database migrations
│       │   ├── tests/               # pytest suite
│       │   └── Dockerfile
│       ├── users/                   # User profile service
│       ├── chat/                    # WebSocket chat service
│       ├── notifications/           # Email notification service
│       └── ai/                      # AI planning assistant
│           ├── app/
│           │   ├── bedrock.py       # OpenRouter API wrapper
│           │   └── context.py       # Event context aggregation + system prompt builder
│           └── tests/
└── terraform/                       # AWS infrastructure as code
    ├── lambda.tf                    # Lambda functions + IAM roles
    ├── api_gateway.tf               # HTTP API routes
    ├── api_gateway_ws.tf            # WebSocket API
    ├── dynamodb.tf                  # Chat tables
    ├── sns.tf                       # Announcements topic + EventBridge role
    ├── cognito.tf                   # User pool + Google OAuth
    ├── ecr.tf                       # Container image repos
    └── domain.tf                    # ACM cert + API Gateway custom domain
```

---

## Infrastructure as Code

AWS resources are defined in Terraform under `terraform/`. Remote state is stored in S3 with a DynamoDB lock table.

```bash
cd terraform
terraform init
terraform plan \
  -var="database_url=..." \
  -var="cognito_user_pool_id=..." \
  -var="r2_bucket=..." \
  -var="r2_endpoint_url=..." \
  -var="r2_public_url=..." \
  -var="r2_access_key_id=..." \
  -var="r2_secret_access_key=..." \
  -var="openrouter_api_key=..."
terraform apply
```

> **First-time setup:** Push an initial Docker image to each ECR repo before the first `terraform apply` — Lambda requires a valid image to be created.

```bash
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/event-rsvp-<service>"

aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com"

docker build --platform linux/arm64 --provenance=false \
  -t "${ECR_URL}:latest" ./backend/services/<service>

docker push "${ECR_URL}:latest"
```

---

## CI/CD Pipeline

### Test — runs on every PR to `main`

Five pytest jobs run in parallel, one per service. All are required status checks.

| Job | Database | AWS |
|---|---|---|
| Events | Real PostgreSQL 16 container + Alembic migrations | Mocked |
| Users | Real PostgreSQL 16 container + Alembic migrations | Mocked |
| Chat | None | Mocked |
| Notifications | None | Mocked |
| AI | None | Mocked |

### Deploy — runs on merge to `main`

Path filtering ensures only changed services are deployed:

1. **Terraform Apply** — if `terraform/**` changed
2. **Deploy Events** — build ARM64 image → push to ECR → update Lambda → run Alembic migrations
3. **Deploy Users** — same as above
4. **Deploy Chat** — build and deploy, no migrations
5. **Deploy Notifications** — build and deploy, no migrations
6. **Deploy AI** — build and deploy, no migrations
7. **Deploy Frontend** — `vercel deploy --prod`

---

## Running Tests Locally

```bash
# Events service
cd backend/services/events
pip install -r requirements.txt pytest pytest-cov httpx
DATABASE_URL=postgresql://user:pass@localhost:5432/test_events alembic upgrade head
DATABASE_URL=postgresql://user:pass@localhost:5432/test_events pytest tests/ -v

# Users service
cd backend/services/users
pip install -r requirements.txt pytest pytest-cov httpx
DATABASE_URL=postgresql://user:pass@localhost:5432/test_users alembic upgrade head
DATABASE_URL=postgresql://user:pass@localhost:5432/test_users pytest tests/ -v

# Chat service
cd backend/services/chat
pip install -r requirements.txt pytest pytest-cov
MESSAGES_TABLE=test CONNECTIONS_TABLE=test WS_ENDPOINT=localhost/test pytest tests/ -v

# Notifications service
cd backend/services/notifications
pip install -r requirements.txt pytest pytest-cov
pytest tests/ -v

# AI service
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
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `COGNITO_USER_POOL_ID` | Cognito user pool ID |
| `COGNITO_CLIENT_ID` | Cognito app client ID |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `R2_BUCKET` | Cloudflare R2 bucket name |
| `R2_ENDPOINT_URL` | Cloudflare R2 S3-compatible endpoint |
| `R2_PUBLIC_URL` | Public base URL for R2 objects |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret key |
| `OPENROUTER_API_KEY` | OpenRouter API key |
| `OPENROUTER_MODEL` | OpenRouter model ID (e.g. `anthropic/claude-haiku-4-5`) |
| `VERCEL_TOKEN` | Vercel deploy token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
