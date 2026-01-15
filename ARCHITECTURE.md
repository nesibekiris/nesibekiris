# Architecture Diagrams & AWS Mapping

This document provides detailed visual representations of the system architecture, comparing local development setup with production AWS deployment.

---

## Table of Contents
1. [High-Level System Flow](#high-level-system-flow)
2. [Local Development Architecture](#local-development-architecture)
3. [Production AWS Architecture](#production-aws-architecture)
4. [Component Mapping: Local vs AWS](#component-mapping-local-vs-aws)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [Deployment Patterns](#deployment-patterns)

---

## High-Level System Flow

### User Journey Flow

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Upload CSV
       ▼
┌─────────────────────┐
│   React Frontend    │
│   (localhost:5173)  │
└──────┬──────────────┘
       │
       │ 2. POST /jobs (with file)
       ▼
┌─────────────────────┐
│   FastAPI Backend   │
│  (localhost:8000)   │
└──────┬──────────────┘
       │
       ├─── 3. Store in Database ──────┐
       │                                ▼
       │                         ┌──────────────┐
       │                         │  PostgreSQL  │
       │                         │  (port 5432) │
       │                         └──────────────┘
       │
       ├─── 4. Upload to S3 ───────────┐
       │                                ▼
       │                         ┌──────────────┐
       │                         │ S3 (Storage) │
       │                         │  LocalStack  │
       │                         └──────────────┘
       │
       └─── 5. Publish to Queue ───────┐
                                        ▼
                                 ┌──────────────┐
                                 │ SQS (Queue)  │
                                 │  LocalStack  │
                                 └──────┬───────┘
                                        │
                                        │ 6. Poll for messages
                                        ▼
                                 ┌──────────────┐
                                 │    Worker    │
                                 │   Process    │
                                 └──────┬───────┘
                                        │
         ┌──────────────────────────────┼──────────────────────────┐
         │                              │                          │
         │ 7. Download CSV from S3      │ 8. Parse & Validate     │ 9. Create Issues
         ▼                              ▼                          ▼
  ┌──────────────┐              ┌──────────────┐          ┌──────────────┐
  │      S3      │              │  PostgreSQL  │          │  PostgreSQL  │
  │   (Storage)  │              │   (RawRows)  │          │   (Issues)   │
  └──────────────┘              └──────────────┘          └──────────────┘
                                        │
                                        │ 10. Update job status
                                        ▼
                                 ┌──────────────┐
                                 │  PostgreSQL  │
                                 │   (Job =     │
                                 │ NEEDS_REVIEW)│
                                 └──────────────┘
```

---

## Local Development Architecture

### Docker Compose Setup (What You Run Locally)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Docker Compose Environment                            │
│                      (Started with: docker compose up)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────┐         ┌─────────────────┐       ┌─────────────────┐ │
│  │   Frontend      │         │    Backend      │       │     Worker      │ │
│  │   Container     │         │   Container     │       │   Container     │ │
│  │                 │         │                 │       │                 │ │
│  │  React + Vite   │◄────────┤   FastAPI      │       │  Python Process │ │
│  │  TypeScript     │  HTTP   │   Uvicorn      │       │  Polls SQS      │ │
│  │                 │         │                 │       │                 │ │
│  │  Port: 5173     │         │  Port: 8000     │       │  No exposed port│ │
│  └────────┬────────┘         └────────┬────────┘       └────────┬────────┘ │
│           │                           │                          │          │
│           │                           │                          │          │
│           └───────────────────────────┼──────────────────────────┘          │
│                                       │                                      │
│                                       ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       PostgreSQL Container                          │   │
│  │                                                                     │   │
│  │  Database: ingestion_db                                            │   │
│  │  Port: 5432                                                         │   │
│  │  Tables: users, jobs, raw_rows, issues, issue_resolutions,         │   │
│  │          final_contacts                                             │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│                                       ▲                                      │
│                                       │                                      │
│                    ┌──────────────────┴──────────────────┐                  │
│                    │                                      │                  │
│  ┌─────────────────┴────────────┐     ┌──────────────────┴───────────────┐ │
│  │    LocalStack Container       │     │     LocalStack Container         │ │
│  │    (AWS S3 Simulator)         │     │     (AWS SQS Simulator)          │ │
│  │                               │     │                                  │ │
│  │  Bucket: data-ingestion-      │     │  Queue: data-ingestion-queue    │ │
│  │          bucket               │     │                                  │ │
│  │  Endpoint: localhost:4566     │     │  Endpoint: localhost:4566       │ │
│  │                               │     │                                  │ │
│  │  Stores CSV files             │     │  Messages: {"job_id": X,        │ │
│  │  Path: uploads/uX/job-Y.csv   │     │             "file_key": "..."}  │ │
│  │                               │     │                                  │ │
│  └───────────────────────────────┘     └──────────────────────────────────┘ │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘

External Access:
┌──────────────────┐
│   Your Browser   │  ──────►  http://localhost:5173  (Frontend)
└──────────────────┘           http://localhost:8000  (API)
```

### Key Points - Local Development:
- *Everything runs in Docker containers* - Consistent environment
- *LocalStack* simulates AWS services (S3 + SQS) at localhost:4566
- *No AWS account needed* - Complete development environment offline
- *Same code as production* - Only configuration changes (endpoint URLs)
- *Fast iteration* - No network latency, no AWS costs

---

## Production AWS Architecture

### Cloud Deployment (What Runs in Production)

```
                                    Internet
                                       │
                                       │  HTTPS
                                       ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                              AWS Cloud                                      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐         ┌───────────────────────────────────────┐   │
│  │  CloudFront CDN  │         │  Application Load Balancer (ALB)      │   │
│  │  (Static Assets) │         │  - SSL/TLS Termination                │   │
│  │                  │         │  - Health checks                       │   │
│  │  Frontend SPA    │         │  - Auto-scaling trigger                │   │
│  └──────────────────┘         └───────────────┬───────────────────────┘   │
│                                                ▼                            │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │               ECS/Fargate Cluster (API Service)                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │  │
│  │  │   API Task   │  │   API Task   │  │   API Task   │              │  │
│  │  │              │  │              │  │              │  (Auto-scaled)│  │
│  │  │   FastAPI    │  │   FastAPI    │  │   FastAPI    │              │  │
│  │  │   Container  │  │   Container  │  │   Container  │              │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │  │
│  └─────────┼──────────────────┼──────────────────┼─────────────────────┘  │
│            │                  │                  │                         │
│            └──────────────────┼──────────────────┘                         │
│                               │                                             │
│                               ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │                     Amazon RDS (PostgreSQL)                          │  │
│  │                                                                      │  │
│  │  Primary Instance:  db-1.region.rds.amazonaws.com                  │  │
│  │  Read Replica:      db-1-read.region.rds.amazonaws.com             │  │
│  │  Multi-AZ:          Automatic failover                              │  │
│  │  Backup:            Automated daily snapshots                       │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│            ┌─────────────────────────────────────────────┐                 │
│            │                                             │                 │
│            ▼                                             ▼                 │
│  ┌──────────────────────┐                    ┌──────────────────────────┐ │
│  │     Amazon S3        │                    │      Amazon SQS          │ │
│  │                      │                    │                          │ │
│  │  Bucket: prod-data-  │                    │  Queue: prod-ingestion-  │ │
│  │         ingestion    │                    │         queue            │ │
│  │                      │                    │                          │ │
│  │  Storage Class:      │                    │  Settings:               │ │
│  │  - Standard (recent) │                    │  - Visibility: 300s      │ │
│  │  - IA (30+ days)     │                    │  - Retention: 14 days    │ │
│  │  - Glacier (90+ days)│                    │  - DLQ: prod-ingestion-  │ │
│  │                      │                    │         dlq              │ │
│  │  Versioning: Enabled │                    │  - Max Receives: 3       │ │
│  │  Encryption: AES-256 │                    │                          │ │
│  │                      │                    │                          │ │
│  └──────────────────────┘                    └────────────┬─────────────┘ │
│                                                            │               │
│                                                            │ Trigger       │
│                                                            ▼               │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │               ECS/Fargate Cluster (Worker Service)                   │  │
│  │                                                                      │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │  │
│  │  │ Worker Task  │  │ Worker Task  │  │ Worker Task  │             │  │
│  │  │              │  │              │  │              │ (Auto-scaled)│  │
│  │  │   Python     │  │   Python     │  │   Python     │             │  │
│  │  │   Worker     │  │   Worker     │  │   Worker     │             │  │
│  │  │   Container  │  │   Container  │  │   Container  │             │  │
│  │  │              │  │              │  │              │             │  │
│  │  │ Polls SQS    │  │ Polls SQS    │  │ Polls SQS    │             │  │
│  │  │ Processes    │  │ Processes    │  │ Processes    │             │  │
│  │  │ Downloads S3 │  │ Downloads S3 │  │ Downloads S3 │             │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘             │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                    Monitoring & Logging                               │  │
│  │                                                                       │  │
│  │  CloudWatch:  - Logs (API, Worker)                                  │  │
│  │               - Metrics (CPU, Memory, Queue Depth)                   │  │
│  │               - Alarms (Queue > 100, Worker errors)                  │  │
│  │                                                                       │  │
│  │  X-Ray:       - Distributed tracing                                  │  │
│  │               - Request flow visualization                            │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Alternative: Lambda-based Worker (Serverless Option)

```
                     ┌──────────────────────┐
                     │    Amazon SQS        │
                     │                      │
                     │  Queue: prod-        │
                     │  ingestion-queue     │
                     └──────────┬───────────┘
                                │
                                │ Event Source Mapping
                                │ (1-10 messages per invocation)
                                ▼
                     ┌──────────────────────┐
                     │   AWS Lambda         │
                     │                      │
                     │  Function: process-  │
                     │  csv-worker          │
                     │                      │
                     │  Runtime: Python 3.11│
                     │  Memory: 1024 MB     │
                     │  Timeout: 5 minutes  │
                     │                      │
                     │  Concurrency: 10     │
                     │  (processes 10 jobs  │
                     │   in parallel)       │
                     │                      │
                     └──────────┬───────────┘
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
                 ▼                             ▼
      ┌──────────────────┐         ┌──────────────────┐
      │   Amazon S3      │         │   Amazon RDS     │
      │   (CSV files)    │         │   (PostgreSQL)   │
      └──────────────────┘         └──────────────────┘
```

Benefits:
- No server management
- Pay per execution (not idle time)
- Automatic scaling (0 to 1000s)
- Built-in retry and DLQ

Trade-offs:
- 15-minute max execution time
- Cold start latency (~500ms)
- Limited to 10GB memory
- More complex debugging

---

## Component Mapping: Local vs AWS

### Side-by-Side Comparison

| Component | Local Development | Production AWS | Notes |
|-----------|-------------------|----------------|-------|
| *Frontend* | Docker container (Vite dev server)<br>Port: 5173<br>Hot reload enabled | CloudFront + S3<br>Static files (build output)<br>CDN distribution | Local: Development mode<br>Prod: Optimized build |
| *Backend API* | Docker container (Uvicorn)<br>Port: 8000<br>Auto-reload on changes | ECS/Fargate Tasks<br>Behind ALB<br>Auto-scaling (2-10 tasks) | Same FastAPI code<br>Different config |
| *Worker* | Docker container<br>Single process<br>Logs to stdout | ECS/Fargate Tasks OR<br>AWS Lambda<br>Auto-scaling based on queue | Same processing logic<br>Lambda requires adapter |
| *File Storage* | LocalStack (S3 simulator)<br>localhost:4566<br>Files in container volume | Amazon S3<br>Durable, versioned<br>Lifecycle policies | boto3 client works for both<br>Only endpoint URL changes |
| *Message Queue* | LocalStack (SQS simulator)<br>localhost:4566<br>In-memory queue | Amazon SQS<br>Managed service<br>Dead Letter Queue | boto3 client works for both<br>Only endpoint URL changes |
| *Database* | PostgreSQL container<br>Port: 5432<br>Data in Docker volume | Amazon RDS PostgreSQL<br>Multi-AZ deployment<br>Automated backups | SQLAlchemy ORM works for both<br>Connection string changes |
| *Secrets* | .env file<br>Plain text (dev only!) | AWS Secrets Manager OR<br>Parameter Store<br>Encrypted | Never commit .env to git! |
| *Logging* | stdout/stderr<br>View with docker logs | CloudWatch Logs<br>Structured JSON<br>Log groups per service | Should use same log format |
| *Monitoring* | Manual (docker stats)<br>No built-in metrics | CloudWatch Metrics<br>Custom dashboards<br>Alarms | Add metrics in code |
| *Networking* | Docker network<br>All services can reach each other | VPC with subnets<br>Security groups<br>Private/public subnets | More secure in AWS |
| *Load Balancing* | None (single API instance) | Application Load Balancer<br>Health checks<br>SSL termination | Production needs this |
| *Auto-scaling* | Manual (docker-compose scale) | ECS Service auto-scaling<br>Based on CPU/memory/queue depth | Critical for production |
| *Cost* | Free (except electricity) | Variable (~$100-500/month)<br>Depends on usage | LocalStack saves $$ in dev |

### Configuration Changes Only

The beauty of this architecture is that *the same code runs everywhere*. Only configuration changes:

```python
# backend/config.py
class Settings(BaseSettings):
    # These values change based on environment
    aws_endpoint_url: str = os.getenv("AWS_ENDPOINT_URL", None)  # None for AWS, "http://localstack:4566" for local
    database_url: str = os.getenv("DATABASE_URL")  # Different per environment

    # AWS credentials
    aws_access_key_id: str = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_access_key: str = os.getenv("AWS_SECRET_ACCESS_KEY")

    # S3 bucket name
    s3_bucket_name: str = os.getenv("S3_BUCKET_NAME", "data-ingestion-bucket")

    # SQS queue name
    sqs_queue_name: str = os.getenv("SQS_QUEUE_NAME", "data-ingestion-queue")
```

*Local (.env file):*

```bash
AWS_ENDPOINT_URL=http://localstack:4566
DATABASE_URL=postgresql://user:password@db:5432/ingestion_db
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_BUCKET_NAME=data-ingestion-bucket
SQS_QUEUE_NAME=data-ingestion-queue
```

*Production (AWS Secrets Manager):*

```bash
AWS_ENDPOINT_URL=  # Empty = use real AWS
DATABASE_URL=postgresql://admin:***@db-1.region.rds.amazonaws.com:5432/ingestion_db
AWS_ACCESS_KEY_ID=AKIA...  # Real AWS credentials from IAM role
AWS_SECRET_ACCESS_KEY=***
S3_BUCKET_NAME=prod-data-ingestion
SQS_QUEUE_NAME=prod-ingestion-queue
```

---

## Data Flow Diagrams

### Upload Flow (Step-by-Step)

```
┌─────────┐
│ Step 1  │  User clicks "Upload CSV" button
└────┬────┘
     │
     ▼
┌─────────────────────────────────────────────────┐
│  Frontend (React)                               │
│  - Read file from disk                          │
│  - Create FormData with file                    │
│  - POST to /jobs with multipart/form-data       │
└────┬────────────────────────────────────────────┘
     │
     │ HTTP POST with file
     ▼
┌─────────────────────────────────────────────────┐
│  API (FastAPI)                                  │
│  1. Validate JWT token (authenticate user)      │
│  2. Validate file type (.csv only)              │
│  3. Validate file size (<= 5MB)                 │
│  4. Create Job record (status=PENDING)          │
│  5. Generate unique S3 key (uploads/uX/job-Y)   │
└────┬────────────────────────────────────────────┘
     │
     ├───► PostgreSQL: INSERT INTO jobs (...) RETURNING id
     │
     ▼
┌─────────────────────────────────────────────────┐
│  Storage (S3 / LocalStack)                      │
│  - Upload file bytes                            │
│  - Key: uploads/u{user_id}/job-{job_id}.csv     │
│  - Content-Type: text/csv                       │
└────┬────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────┐
│  Queue (SQS / LocalStack)                       │
│  - Publish message:                             │
│    {                                            │
│      "job_id": 123,                             │
│      "file_key": "uploads/u1/job-123.csv"       │
│    }                                            │
│  - Message visible immediately                  │
└────┬────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────┐
│  API Response to Frontend                       │
│  {                                              │
│    "id": 123,                                   │
│    "status": "PENDING",                         │
│    "total_rows": 0,                             │
│    "original_filename": "contacts.csv"          │
│  }                                              │
└─────────────────────────────────────────────────┘
```

Total time: ~200-500ms
User sees: Job created, status = PENDING

### Processing Flow (Async Worker)

```
┌─────────┐
│  Worker │  Infinite loop: poll SQS every 10 seconds
└────┬────┘
     │
     │ Poll for messages (long polling)
     ▼
┌─────────────────────────────────────────────────┐
│  Queue (SQS)                                    │
│  - ReceiveMessage(WaitTimeSeconds=10)           │
│  - Returns message if available                 │
│  - Sets VisibilityTimeout=300s                  │
│    (message hidden from other workers)          │
└────┬────────────────────────────────────────────┘
     │
     │ Message: {"job_id": 123, "file_key": "..."}
     ▼
┌─────────────────────────────────────────────────┐
│  Worker: Update Job Status                      │
│  - UPDATE jobs SET status='PROCESSING'          │
│  - Frontend polling will see this change        │
└────┬────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────┐
│  Worker: Download CSV from S3                   │
│  - GetObject(Bucket, Key)                       │
│  - Read bytes into memory                       │
│  - Decode UTF-8                                 │
└────┬────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────┐
│  Worker: Parse CSV                              │
│  - csv.DictReader(csv_text)                     │
│  - Validate 'email' column exists               │
│  - Loop through each row                        │
└────┬────────────────────────────────────────────┘
     │
     │ For each row...
     ▼
┌─────────────────────────────────────────────────┐
│  Worker: Validate Row                           │
│  - Normalize email (lowercase, trim)            │
│  - Check if empty (MISSING_EMAIL issue)         │
│  - Check format (INVALID_EMAIL_FORMAT issue)    │
│  - Check other fields (MISSING_FIRST_NAME, etc) │
│                                                 │
│  If valid:                                      │
│  - INSERT INTO raw_rows (job_id, row_number,    │
│    data_json, normalized_email, is_valid=true)  │
│                                                 │
│  If invalid:                                    │
│  - INSERT INTO issues (job_id, type, key,       │
│    payload_json, status=OPEN)                   │
└────┬────────────────────────────────────────────┘
     │
     │ After all rows processed...
     ▼
┌─────────────────────────────────────────────────┐
│  Worker: Detect Duplicates                      │
│  - GROUP BY normalized_email                    │
│  - For emails appearing >1 time:                │
│    - Check if identities differ                 │
│    - If yes: INSERT INTO issues                 │
│      (type=DUPLICATE_EMAIL, payload with        │
│       all candidate rows)                       │
└────┬────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────┐
│  Worker: Update Job Status                      │
│  - Count issues: SELECT COUNT(*) FROM issues    │
│    WHERE job_id=X AND status='OPEN'             │
│                                                 │
│  If issues > 0:                                 │
│    - UPDATE jobs SET status='NEEDS_REVIEW',     │
│      conflict_count=X                           │
│                                                 │
│  If issues = 0:                                 │
│    - Auto-finalize                              │
│    - UPDATE jobs SET status='COMPLETED'         │
└────┬────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────┐
│  Worker: Acknowledge Message                    │
│  - DeleteMessage(QueueUrl, ReceiptHandle)       │
│  - Message removed from queue                   │
│  - Worker polls for next message                │
└─────────────────────────────────────────────────┘
```

Total time: 1-30 seconds (depends on file size)
User sees: Status changes from PENDING → PROCESSING → NEEDS_REVIEW

### Resolution Flow (User Interaction)

```
┌─────────┐
│  User   │  Sees job with status=NEEDS_REVIEW
└────┬────┘
     │
     │ 1. GET /jobs/{id}/issues
     ▼
┌─────────────────────────────────────────────────┐
│  API: List Issues                               │
│  SELECT * FROM issues                           │
│  WHERE job_id=X AND status='OPEN'               │
│  JOIN with issue_resolutions (if any)           │
└────┬────────────────────────────────────────────┘
     │
     │ Returns: [
     │   {
     │     "id": 1,
     │     "type": "DUPLICATE_EMAIL",
     │     "key": "john@example.com",
     │     "payload": {
     │       "candidates": [
     │         {"raw_row_id": 5, "data": {...}},
     │         {"raw_row_id": 12, "data": {...}}
     │       ]
     │     },
     │     "status": "OPEN"
     │   }
     │ ]
     ▼
┌─────────────────────────────────────────────────┐
│  Frontend: Display Issues                       │
│  - Show candidate rows side-by-side             │
│  - "Choose" button for each candidate           │
│  - User clicks "Choose" on Candidate 1          │
└────┬────────────────────────────────────────────┘
     │
     │ 2. POST /issues/1/resolve
     │    { "chosen_row_id": 5 }
     ▼
┌─────────────────────────────────────────────────┐
│  API: Resolve Issue                             │
│  1. Validate issue exists and belongs to user   │
│  2. Validate chosen_row_id is valid candidate   │
│  3. UPSERT INTO issue_resolutions                │
│     (issue_id, resolution_json)                 │
│     VALUES (1, '{"chosen_row_id": 5}')          │
│  4. UPDATE issues SET status='RESOLVED'         │
│     WHERE id=1                                  │
└────┬────────────────────────────────────────────┘
     │
     │ Returns: {"ok": true, "issue_id": 1}
     ▼
┌─────────────────────────────────────────────────┐
│  Frontend: Update UI                            │
│  - Mark issue as resolved (visual indicator)    │
│  - Enable "Finalize" button if all resolved     │
└─────────────────────────────────────────────────┘

Repeat for each issue...

┌─────────┐
│  User   │  All issues resolved, clicks "Finalize"
└────┬────┘
     │
     │ 3. POST /jobs/{id}/finalize
     ▼
┌─────────────────────────────────────────────────┐
│  API: Finalize Job                              │
│  1. Verify no open issues remain                │
│  2. DELETE FROM final_contacts WHERE job_id=X   │
│  3. For each email:                             │
│     - If resolved issue exists:                 │
│       Use chosen_row_id                         │
│     - Else:                                     │
│       Use first valid row                       │
│  4. INSERT INTO final_contacts                  │
│     (job_id, email, first_name, last_name, ...)│
│  5. UPDATE jobs SET status='COMPLETED'          │
└────┬────────────────────────────────────────────┘
     │
     │ Returns: {"ok": true, "status": "COMPLETED"}
     ▼
┌─────────────────────────────────────────────────┐
│  Frontend: Show Success                         │
│  - Job status = COMPLETED                       │
│  - Show final contact count                     │
│  - Option to download/view final data           │
└─────────────────────────────────────────────────┘
```

---

## Deployment Patterns

### Local Development Workflow

```bash
# 1. Start all services
docker compose up --build

# Services start in order (thanks to depends_on and healthchecks):
# 1. PostgreSQL (db)
# 2. LocalStack (localstack)
# 3. API (api)
# 4. Worker (worker)
# 5. Frontend (frontend)

# 2. Access application
open http://localhost:5173

# 3. View logs (separate terminals)
docker compose logs -f api
docker compose logs -f worker

# 4. Check LocalStack
aws --endpoint-url=http://localhost:4566 s3 ls
aws --endpoint-url=http://localhost:4566 sqs list-queues

# 5. Database access
docker compose exec db psql -U user -d ingestion_db
```

### AWS Production Deployment (Option 1: ECS/Fargate)

```bash
# 1. Build and push Docker images
docker build -t my-registry/data-ingestion-api:latest ./backend
docker push my-registry/data-ingestion-api:latest

docker build -t my-registry/data-ingestion-worker:latest ./backend
docker push my-registry/data-ingestion-worker:latest

# 2. Create infrastructure (Terraform example)
cd terraform/
terraform init
terraform apply

# Creates:
# - VPC with public/private subnets
# - RDS PostgreSQL instance
# - S3 bucket with lifecycle policies
# - SQS queue with DLQ
# - ECS cluster
# - ECS task definitions (API, Worker)
# - ECS services with auto-scaling
# - Application Load Balancer
# - CloudWatch log groups

# 3. Deploy API service
aws ecs update-service \
  --cluster data-ingestion-cluster \
  --service api-service \
  --force-new-deployment

# 4. Deploy Worker service
aws ecs update-service \
  --cluster data-ingestion-cluster \
  --service worker-service \
  --force-new-deployment

# 5. Build and deploy frontend
cd frontend/
npm run build
aws s3 sync dist/ s3://my-frontend-bucket/
aws cloudfront create-invalidation --distribution-id XXX --paths "/*"
```

### AWS Production Deployment (Option 2: Lambda Worker)

```bash
# 1. Package Lambda function
cd backend/
pip install -r requirements.txt -t lambda_package/
cp *.py lambda_package/
cd lambda_package/
zip -r ../worker-lambda.zip .

# 2. Deploy Lambda
aws lambda update-function-code \
  --function-name csv-worker \
  --zip-file fileb://../worker-lambda.zip

# 3. Configure SQS trigger
aws lambda create-event-source-mapping \
  --function-name csv-worker \
  --event-source-arn arn:aws:sqs:region:account:prod-ingestion-queue \
  --batch-size 10 \
  --maximum-batching-window-in-seconds 5
```

---

## Summary: Why This Architecture?

### Benefits of Local/AWS Parity

1. *Same Code Everywhere* 
   - Reduces "works on my machine" problems
   - Confidence that local tests match production behavior

2. *Fast Development*
   - No AWS account needed for development
   - No network latency
   - No AWS costs during development
   - Full stack runs on laptop

3. *Cloud-Ready*
   - boto3 SDK works with both LocalStack and AWS
   - SQLAlchemy works with both local and RDS Postgres
   - Only configuration changes needed

4. *Testing & CI/CD*
   - Can run full integration tests in CI pipeline
   - Use LocalStack in GitHub Actions/GitLab CI
   - No need for separate "test AWS account"

5. *Cost Optimization*
   - Develop locally (free)
   - Deploy to AWS only when ready
   - Can estimate AWS costs before going live

### Migration Path: Local → AWS

*Phase 1: Local Development* (You are here)
- Everything runs in Docker Compose
- LocalStack for S3/SQS
- Local PostgreSQL

*Phase 2: Hybrid (Optional)*
- Keep API/Worker local
- Use real AWS S3/SQS
- Test AWS integration without full deployment

*Phase 3: Staging Environment*
- Deploy to AWS in separate "staging" account
- Same infrastructure as production
- Test deployment process

*Phase 4: Production*
- Deploy to production AWS account
- Set up monitoring, alarms, backups
- Blue/green deployment for zero downtime

---

## Next Steps

For your presentation, you can:

1. *Show local architecture* (Docker Compose diagram)
2. *Explain each component* (what it does)
3. *Show production mapping* (AWS services)
4. *Highlight key point:* "Same code, different configuration"
5. *Emphasize:* "This demonstrates production thinking even in a local project"

The architecture shows you understand:
- Event-driven design
- Async processing
- Decoupling (API vs Worker vs Storage)
- Scalability (can run multiple workers)
- Production readiness (monitoring, logging, error handling)
- Cost consciousness (LocalStack for dev)
