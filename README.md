# CHAAMP

CHAAMP is a campus assistant project with a standalone, AWS BEDROCK DATABASE chat frontend and a separate AWS SAM backend scaffold.

## Run the local chat

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (normally `http://localhost:5173`). The frontend does not require AWS credentials, a backend server, or an environment file. Its 30 demo Q&A entries are stored in [frontend/src/data/campus_faq.csv](frontend/src/data/campus_faq.csv). They are sample guidance, not verified or official campus policies.

To update the answers, replace the sample CSV rows with institution-approved information and keep the existing column names. The AWS SAM template and backend remain as a separate deployment scaffold; the local frontend does not call them.

## Project structure

- `frontend/` - Vite + React + TypeScript local chat UI
- `frontend/src/data/campus_faq.csv` - local demo Q&A data
- `backend/` and `template.yaml` - separate AWS SAM backend scaffold
- `sample_docs/` - documents reserved for a future knowledge base
- `tests/` - backend tests and retrieval benchmark
