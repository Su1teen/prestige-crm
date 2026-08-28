# Prestige CRM

React/Vite CRM containing the Paterhaus workspace.

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Paterhaus live conversations

For `info@paterhaus.com` and `r_tszi@paterhaus.com`, the Conversations module reads live WhatsApp
conversation data through the Paterhaus backend. All other accounts retain the existing demo experience.

The frontend has one variable for this integration:

```env
VITE_PATERHAUS_API_BASE_URL=https://paterhaus-backend-production.up.railway.app
```

The browser never connects to PostgreSQL and contains no database URL, JWT secret, WAHA key, n8n secret,
or internal API key. The short-lived access token is kept in memory only.

See [docs/paterhaus-live-conversations.md](docs/paterhaus-live-conversations.md) for the complete Railway
variable matrix, n8n data contract, validation commands, scope, and deployment checklist.

## Validation

```bash
npm run lint
npm test
npm run build
npx tsc -b
```
