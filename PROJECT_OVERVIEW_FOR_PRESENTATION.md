# CHAAMP: End-to-End Project Overview

> **Purpose of this document:** Give an AI presentation generator an accurate, end-to-end explanation of CHAAMP, its architecture, how its main flows work, and what is implemented versus still planned. Treat the implementation-status notes as essential: this repository is a working local scaffold, not a fully integrated, production-deployed campus platform.

## 1. Project at a glance

**CHAAMP** is short for **Campus Assistant**. It is designed as a role-aware, AI-powered assistant for the VIT Chennai campus. Its central use case is answering student questions using approved campus documents, with retrieved source references rather than unsupported guesses. The wider product concept also includes campus announcements, events, complaints/requests, document administration, and analytics.

The repository combines:

- **Frontend:** React, TypeScript, Vite, and React Router.
- **Backend:** Python 3.12 AWS Lambda handlers, with shared authentication, HTTP, and DynamoDB utilities.
- **Cloud infrastructure:** AWS SAM / CloudFormation, Amazon Cognito, API Gateway HTTP API, Lambda, DynamoDB, and Amazon S3.
- **AI retrieval and generation:** Amazon Bedrock Knowledge Bases through the Bedrock Agent Runtime.
- **Validation:** Python smoke tests and a placeholder RAG benchmark harness.

### Current implementation status

The most complete end-to-end backend path is `POST /ask`: its Lambda handler validates a question, calls Bedrock Knowledge Base retrieval-and-generation, extracts citations, logs query metrics, and returns an answer or a safe no-answer response.

The broader product is **not yet fully wired to a live AWS environment**:

- AWS, Cognito, model, Knowledge Base, and data-source values remain placeholders.
- SAM currently registers only the `/ask` Lambda route. Other Python handlers exist in the repository but are not registered as API routes in the SAM template.
- The React pages display hard-coded demo data. They do not yet call the API helper to load or submit real records.
- Several backend handlers return placeholder records or responses rather than reading/writing DynamoDB.
- The Knowledge Base, its data source, and the connection to the document bucket need live AWS setup; the template accepts IDs but does not create those Bedrock resources.
- The benchmark runner reads test questions but does not make live requests to `/ask`.

## 2. Problem and proposed solution

Campus information can be spread across policies, handbooks, circulars, and office communications. Finding the current, authoritative answer can require searching multiple sources or contacting campus staff.

CHAAMP's proposed solution is a single campus assistant that:

1. Accepts a question in natural language.
2. Searches a curated campus-document Knowledge Base.
3. Generates a concise answer grounded in retrieved material.
4. Displays source details so the user can verify the answer.
5. Declines to make up an answer when the approved information cannot verify it.

The wider dashboard concept gives students and staff a shared place to discover announcements, events, and request status, while administrators manage documents and review analytics.

## 3. Architecture overview

```text
Student / Staff / Administrator
              |
              v
 React + TypeScript web application
 (Vite; routed dashboard and feature pages)
              |
     [Cognito sign-in/session]
              |
              v
 API Gateway HTTP API
 (Cognito JWT authorizer; configured by SAM)
              |
       POST /ask (wired route)
              |
              v
 AWS Lambda: ask handler (Python 3.12)
       |                    |
       |                    +--> DynamoDB query log
       v
 Amazon Bedrock Agent Runtime
       |
       v
 Bedrock Knowledge Base --> approved campus documents
                            (S3-backed source is intended;
                             live Knowledge Base setup is external)

 Planned/supporting AWS resources in SAM:
 Cognito User Pool and client; S3 documents bucket;
 DynamoDB tables for users, events, announcements, complaints,
 documents, and query logs.
```

### Component responsibilities

| Component | Responsibility | Repository status |
|---|---|---|
| React web app | Dashboard and route-based screens for assistant, events, announcements, requests, and admin pages | Screens exist; data and user session are demo/static |
| Amplify Auth configuration | Supplies Cognito User Pool and client settings to the frontend | Configuration exists; IDs are placeholders |
| Frontend API helper | Gets the current Amplify auth session, sends a bearer token, and converts non-success HTTP responses into errors | Helper exists; screens do not currently use it |
| API Gateway HTTP API | Exposes backend HTTP routes and validates Cognito JWTs | Declared in SAM; `/ask` is the only registered route |
| `ask` Lambda | Validates input, applies a role-dependent retrieval filter, calls Bedrock, returns answer and citations, writes query metrics | Implemented; requires configured AWS resources |
| Other Lambda handlers | Represent analytics, announcements, complaints, documents, and events features | Present but mostly placeholders; not deployed by the current SAM template |
| Shared `campus_common` layer | Provides role resolution, role checks, DynamoDB helpers, request/response helpers, and error handling | Implemented as reusable code |
| DynamoDB tables | Intended storage for campus and analytics records | Tables are provisioned in SAM; most handlers do not yet use them |
| S3 documents bucket | Encrypted, private, versioned storage resource for campus documents | Provisioned in SAM; Knowledge Base ingestion linkage must be configured separately |
| Bedrock Knowledge Base | Retrieves relevant document chunks for grounded answers | Called by `/ask`; actual Knowledge Base and data source IDs are external inputs |

## 4. End-to-end question-answer flow

This is the principal implemented backend workflow.

1. **User asks a question.** The frontend's assistant page currently shows a sample conversation. In the intended live flow, a connected frontend would send JSON such as `{"question":"What is the attendance requirement?"}` to `POST /ask`.
2. **User is authenticated.** API Gateway's default Cognito JWT authorizer checks the bearer token against the configured User Pool and client. The Lambda reads the verified JWT claims to identify the user and role.
3. **Role is resolved.** The shared authentication helper reads Cognito groups and selects a role in priority order: `ADMIN`, then `STAFF`, then `STUDENT`. An account with no recognized role receives a forbidden response.
4. **Input is validated.** The handler requires `question` to be a string containing 3–1000 non-whitespace characters. Invalid input receives a structured HTTP 400 error.
5. **Retrieval settings are selected.** The Knowledge Base search requests five results. For a `STUDENT`, it applies a metadata filter requiring `audience = ALL`. The handler does not currently add an equivalent audience filter for staff or administrators.
6. **Bedrock retrieves and generates.** The Lambda calls `retrieve_and_generate` with the configured Knowledge Base ID and model ARN. Its prompt instructs the model to answer only from retrieved search results, avoid inventing campus facts, prefer the latest document version, and output a designated no-answer marker when evidence is missing.
7. **Citations are converted for the UI.** Citation references are deduplicated and returned with available document ID, title, version, category, and a text snippet (up to 240 characters).
8. **Answer is assessed.** The handler treats an answer as supported only when it has sources, non-empty generated text, and does not contain the no-answer marker. Otherwise it returns a fixed response directing the user to an official office or circular.
9. **Metrics are logged.** The handler attempts to write a query-log item with user ID, role, date/time, category, latency, success/answer flags, source count, question length, and a 90-day TTL. A query-log write failure is logged without replacing the answer response.
10. **Response is returned.** A successful HTTP 200 response contains `answer`, `answered`, `sources`, and `latencyMs`. Bedrock throttling maps to HTTP 429; other Bedrock client errors map to HTTP 502. Shared error handling produces JSON error envelopes and logs unhandled exceptions.

### Example successful response shape

```json
{
  "answer": "The documented answer goes here.",
  "answered": true,
  "sources": [
    {
      "documentId": "document-id",
      "title": "Academic Regulations",
      "version": "2026.1",
      "category": "ACADEMIC",
      "snippet": "Relevant retrieved text..."
    }
  ],
  "latencyMs": 840
}
```

The values above illustrate the response format only; they are not a claim about a live deployment.

## 5. Authentication and role model

The SAM template defines an Amazon Cognito User Pool that uses email as the username and automatically verifies email addresses. Its public client has no client secret and supports SRP and refresh-token authentication. API Gateway is configured with a JWT authorizer whose issuer is the deployed User Pool and whose audience is the User Pool client.

The intended application roles are:

- **STUDENT:** Ask questions and use student-facing campus features.
- **STAFF:** Use staff-appropriate campus workflows.
- **ADMIN:** Access document management, request administration, and analytics.

Role checks in the backend use Cognito groups. Some placeholder handlers already call `require_role`; actual enforcement for every feature depends on connecting those handlers to deployed routes and implementing the corresponding storage and UI behavior.

The frontend contains a route guard and a `getRole` helper, but the current app defines a hard-coded demo user. The visual login page is a placeholder and does not currently perform Cognito sign-in.

## 6. Other feature areas

These areas show the product's intended scope. They must not be described as fully operational without qualification.

### Events

- Intended experience: browse campus events and let authorized users create or manage them.
- Backend file: `backend/functions/events/app.py`.
- Current code: `GET /events` returns an empty list; `POST /events` returns a placeholder message.
- The frontend displays sample events held in local constants.

### Announcements

- Intended experience: read important campus notices; authorized users can create or archive announcements.
- Backend file: `backend/functions/announcements/app.py`.
- Current code: returns a sample announcement for `GET /announcements`; create/archive routes return placeholder responses.
- The frontend displays sample notices held in local constants.

### Complaints / requests

- Intended experience: students or staff submit a request, track its status, and administrators update it.
- Backend file: `backend/functions/complaints/app.py`.
- Current code: validates that a new description has at least 10 characters, but returns a fixed sample complaint instead of persisting it. Listing also returns a sample record; the admin update route is a placeholder.
- The UI has sample request lists.

### Document administration

- Intended experience: administrators add and review campus documents, manage their status, and synchronize the Bedrock Knowledge Base.
- Backend file: `backend/functions/documents/app.py`.
- Current code: enforces an ADMIN role in its handler and checks for a title on create, but uses sample records and a placeholder upload URL/job ID. No real S3 upload or ingestion operation is implemented in that handler.
- The SAM template creates an encrypted, public-access-blocked, versioned S3 bucket and exposes its name as an output. The actual Bedrock Knowledge Base/data source connection and sync workflow remain environment setup.

### Analytics

- Intended experience: give administrators query volumes, answer rates, latency, categories, complaint statuses, and document statuses.
- Backend file: `backend/functions/analytics/app.py`.
- Current code: enforces an ADMIN role but returns fixed zero/empty metrics rather than aggregating DynamoDB query logs or records.
- The frontend analytics view uses hard-coded sample values.

## 7. Data and infrastructure

### DynamoDB tables declared in SAM

All tables use on-demand (`PAY_PER_REQUEST`) billing.

| Table | Partition key | Intended use |
|---|---|---|
| Users | `userId` | User/application profile data |
| Events | `eventId` | Campus events |
| Announcements | `announcementId` | Campus announcements |
| Complaints | `complaintId` | Requests and their statuses |
| Documents | `documentId` | Document metadata/status |
| Query logs | `queryId` | Assistant usage and performance metrics |

At present, the `/ask` handler writes query logs. Most other tables are provisioned but not yet used for their intended CRUD behavior.

### S3 and document knowledge

The SAM template creates a bucket with AES-256 server-side encryption, public access blocked, and versioning enabled. The `ask` workflow queries a Bedrock Knowledge Base by its configured ID. The repository does not itself create the Knowledge Base, create its data source, configure document chunking/embeddings, upload the sample files, or connect the bucket to that data source. Those steps require a real AWS environment.

`sample_docs/` currently contains instructions for adding small, safe campus demo documents; it does not include an implemented live ingestion pipeline.

## 8. Error handling, observability, and safety

- The shared HTTP helper returns JSON responses with a `statusCode`, content-type header, and serialized body.
- Invalid JSON and non-object request bodies receive structured 400 responses.
- Application errors use an `HttpError` with an HTTP status, machine-readable code, and message.
- Unexpected exceptions are logged with a traceback and returned as a generic 500 response.
- Logs are emitted as JSON with severity, message, timestamp, and contextual fields.
- The ask handler logs query performance and retrieval/answer statistics with a 90-day record TTL.
- The RAG prompt says to answer only from search results, avoid inventing policies or facts, and prefer the latest document version.
- If citations or a grounded answer are absent, the assistant returns an explicit no-answer message rather than claiming unsupported certainty.

The above are application-level measures, not a claim that the full deployment has been security-reviewed or production-hardened.

## 9. Deployment and local development

### Local frontend

The frontend uses Node.js, Vite, React, and TypeScript. The documented local workflow is:

```text
cd frontend
npm install
npm run dev
```

For a live integration, create `frontend/.env.local` with the API URL and Cognito values shown in the repository's root `.env.example`, or populate it using `scripts/write-env.sh` after deployment. Replace placeholders with actual values. The UI can be previewed locally without these live values, but its feature content is currently demo data.

### Backend dependencies and AWS deployment

The repository includes helper scripts for creating a Python virtual environment, installing backend requirements, building with AWS SAM, and deploying a CloudFormation stack. Deployment requires:

- A configured AWS account, credentials/profile, and region.
- AWS SAM CLI and the expected Python runtime.
- A real Bedrock foundation model ARN.
- A Bedrock Knowledge Base ID and data source ID.
- Cognito setup and role/group assignment.
- A deployed frontend origin and suitable API CORS configuration.

The template's default Knowledge Base and model values are intentionally invalid placeholders. They must be replaced before live use. Although the template declares a `FrontendOrigins` parameter, the current template does not use it to configure CORS.

The current SAM deployment creates the Cognito resources, HTTP API, S3 bucket, DynamoDB tables, and `/ask` function. It does not deploy all the other handler files as API routes.

## 10. Testing and validation

- `tests/unit/test_backend_smoke.py` tests the shared response shape, Cognito group-to-role resolution, role checking, and HTTP error fields.
- `tests/rag/benchmark.jsonl` lists three example retrieval questions, including an expected no-answer case.
- `tests/rag/run_benchmark.py` currently only counts and reports the benchmark rows. It explicitly does not call a live API.
- The repository README reports prior successful local Python smoke tests and a frontend production build. These checks do not prove that AWS services are deployed or the live RAG flow is working.

## 11. Strengths and current limitations

### Strengths in the current design

- Grounded-answer approach built around curated campus material.
- Citations and source snippets are part of the intended API response.
- Explicit no-answer behavior discourages unsupported responses.
- Cognito JWT authentication and role/group checks are represented in the architecture.
- Serverless components can scale independently, while DynamoDB uses on-demand capacity.
- The SAM template enables encryption, public access blocking, and S3 versioning for its document bucket.
- Query metrics are designed to capture answer coverage and latency.

### Limitations and next steps

1. Replace all placeholder AWS settings with real account/resource values.
2. Create and configure the Bedrock Knowledge Base and data source; connect, upload, and validate approved campus documents.
3. Wire Cognito sign-in and session state into the React app.
4. Connect the assistant page to the `/ask` endpoint and render returned citations.
5. Add CORS configuration for the deployed frontend origin.
6. Add SAM resources, IAM policies, and API routes for the other Lambda handlers.
7. Replace placeholder handlers with validated DynamoDB and S3 operations.
8. Connect events, announcements, requests, document administration, and analytics screens to live APIs.
9. Implement a benchmark that calls the live `/ask` API and scores answerability, expected source, keywords, and latency.
10. Validate access-control rules for every role and feature before production use.

## 12. Suggested presentation outline

Use this as a slide plan, not as a claim that every feature is already live.

1. **Title — CHAAMP: AI Smart Campus Assistant**  
   One-line promise: find trustworthy campus information and access campus services from one place.
2. **The campus information problem**  
   Policies and notices can be difficult to locate; students need current, reliable answers.
3. **The proposed solution**  
   A role-aware campus portal with a source-grounded AI assistant and supporting campus workflows.
4. **System architecture**  
   Show the frontend, Cognito, API Gateway, Lambda, Bedrock Knowledge Base/model, S3, and DynamoDB.
5. **How an AI answer is produced**  
   Show question → authentication/role → retrieval → grounded generation → citation/no-answer → query metrics.
6. **Trust and safety design**  
   Explain approved-document grounding, citations, latest-version instruction, role filtering, and explicit no-answer behavior.
7. **Campus service modules**  
   Introduce events, announcements, requests, document administration, and analytics as product areas; label them as scaffold/demo where appropriate.
8. **Cloud deployment and data**  
   Explain Cognito, serverless Lambda/API Gateway, DynamoDB, protected/versioned S3, and Bedrock setup dependencies.
9. **Implementation status**  
   Separate the implemented `/ask` backend and infrastructure scaffold from static frontend screens and placeholder secondary handlers.
10. **Roadmap and impact**  
    Outline live AWS setup, frontend/API integration, document ingestion, CRUD completion, evaluation, and access-control verification.

### Visual direction for a slide generator

- Use a clean campus technology style: deep navy/blue, white backgrounds, and a restrained cyan accent.
- Use a simple architecture diagram and a numbered sequence for the RAG request lifecycle.
- Use a visible **“Implemented” vs. “Next / placeholder”** distinction on feature and status slides.
- Avoid implying that sample dashboard values are live metrics or that sample assistant answers came from a deployed Knowledge Base.
- Do not invent performance results, number of users, cost savings, answer accuracy, or production readiness.

## 13. Short description for a presentation tool

CHAAMP (Campus Assistant) is a proposed AI-powered campus information and services portal for VIT Chennai. Its core backend flow authenticates a user with Amazon Cognito, searches approved campus documents through an Amazon Bedrock Knowledge Base, generates a concise grounded answer with source citations, and logs basic query metrics in DynamoDB. The wider product concept includes events, announcements, student requests, document administration, and analytics. The repository currently contains the `/ask` backend implementation and AWS SAM infrastructure scaffold, but its React screens use demo data, most secondary backend routes are placeholders and not deployed, and live AWS/Bedrock resources still need configuration. Present this as an early-stage scaffold with a concrete RAG flow and a clear integration roadmap—not as a fully launched production system.
