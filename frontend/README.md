# CHAAMP local chat

The frontend is a local-only campus FAQ chat demo. It does not need AWS credentials, Cognito, an API server, or a `.env` file. Its 30 sample questions and answers are in `src/data/campus_faq.csv`; answers are example guidance and are not verified campus policy.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). Use **Browse the 30 preset questions** or enter a question. Responses are matched from the local CSV; unsupported questions receive suggested FAQ entries instead of generated answers.

To use real campus information, replace the sample rows in `src/data/campus_faq.csv` with verified content while keeping the CSV column names unchanged.
