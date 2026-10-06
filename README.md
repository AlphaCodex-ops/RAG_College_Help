# CHAAMP

CHAAMP is an AI smart campus assistant project scaffolded to match the AWS SAM + React + Bedrock architecture described in the build spec.

## Project structure

- backend/ - Python Lambda backend and shared common layer
- frontend/ - Vite + React + TypeScript frontend
- scripts/ - deployment and env helper scripts
- sample_docs/ - demo docs to upload into the Bedrock knowledge base
- tests/ - unit and benchmark tests

## Important placeholders

The project intentionally keeps AWS and Bedrock values as placeholders until you provide your real environment details.

Examples:
- AWS profile: `chaamp`
- AWS region: `ap-south-1`
- Model ARN: `REPLACE_WITH_MODEL_ARN`
- Knowledge Base ID: `REPLACE_WITH_KB_ID`
- Data Source ID: `REPLACE_WITH_DS_ID`

## Next steps

1. Install Python 3.12 and Node 20+
2. Fill in the placeholder values in the environment files
3. Run the frontend app with `npm install` and `npm run dev`
4. Configure AWS Cognito, SAM deployment, and Bedrock KB
5. Deploy via `sam deploy`

## Local frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Implementation status

This repo now includes the local application scaffold and route-based dashboard shell, with placeholder values kept in place for AWS-specific settings that require a live account. The project has been verified to build locally.

### Verified commands

```bash
cd "C:\Users\jjoha\OneDrive\Documents\GitHub\RAG_College_Help"
python -m pytest -q
cd frontend
npm run build
```

### Remaining live deployment setup

- AWS profile and region
- Cognito User Pool and Client IDs
- Bedrock Knowledge Base and Data Source IDs
- Model ARN
- hosted frontend URL for CORS

Do not fill in these with fake values; replace the placeholders after the real AWS resources exist.
