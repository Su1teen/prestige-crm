# Paterhaus live conversations

## Runtime boundary

```text
n8n / WAHA
  -> external PostgreSQL (chats_pater, hostory_pater)
  -> paterhaus-backend API
  -> Prestige CRM Conversations UI
```

The frontend only calls the backend. It never connects to PostgreSQL.

Live mode is enabled only when the normalized authenticated email is:

- `info@paterhaus.com`
- `r_tszi@paterhaus.com`

Every other account remains on the unchanged demo-data path.

## Railway variables

### paterhaus-backend service

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Existing Prisma application database; keep unchanged. |
| `CHAT_HISTORY_DATABASE_URL` | Separate database containing `chats_pater` and `hostory_pater`, not the Prisma database. |
| `CRM_JWT_SECRET` | Signs and verifies short-lived live-conversation access tokens. |
| `CRM_ALLOWED_EMAILS` | Comma-separated backend allowlist for live mode. |
| `CORS_ORIGIN` | Explicit browser origins, retaining local development support. |

### prestige-crm service

| Variable | Purpose |
| --- | --- |
| `VITE_PATERHAUS_API_BASE_URL` | Public origin of the Paterhaus backend, without a trailing API path. |

`VITE_PATERHAUS_API_BASE_URL` is the only frontend variable for this integration. Do not add database
URLs, JWT secrets, WAHA keys, n8n secrets, or internal API keys to the frontend service.

No secrets are committed. Local implementation did not apply Railway variables or deploy either service.

## Live behavior

- The list loads on mount and polls every 10 seconds while the page is visible.
- List and history polling do not overlap with an active request.
- The current conversation remains selected when it still exists after a refresh.
- Protected calls use a short-lived bearer token kept in module memory only.
- A `401` clears the token, requests one fresh token, and retries once.
- History renders in backend order with contact messages incoming and AI messages outgoing.
- Takeover sends `{ "aiEnabled": false }`; resume sends `{ "aiEnabled": true }`.
- The demo Resolve/Reopen and composer controls are absent in live mode.

The access-token exchange is a temporary bridge because CRM authentication is currently local to the
frontend. It should be replaced with verified server-side authentication later.

## n8n data contract

- `chat_id` is the canonical conversation identity.
- n8n must write the same `chat_id` to the chat row and every related history row.
- Never use `number` as the history join key.
- Write future `hostory_pater.time` values in Asia/Almaty using
  `YYYY-MM-DD, HH24:MI:SS.MS`.
- Existing `YYYY-MM-DD, HH24:MI` values remain compatible.
- No external-table schema migration is needed.

## Phase 1 scope

Included: live list, live ordered history, visible safe errors, polling, and AI takeover/resume.

Out of scope: manual sending, manager outbound messages, attachments, media processing, and direct WAHA
or n8n calls from the frontend.

## File summary

- `src/lib/paterhausConversationsApi.ts`: typed API client, in-memory token, expiry handling, and one `401` retry.
- `src/components/paterhaus/LiveConversationsModule.tsx`: live list, history, polling, timestamps, and AI controls.
- `src/components/paterhaus/ConversationsModule.tsx`: selects live or demo mode from the authenticated email.
- `src/lib/paterhausConversationsApi.test.ts`: allowlist, token storage, and retry coverage.
- `src/components/paterhaus/LiveConversationsModule.test.tsx`: list, message order, takeover, and resume coverage.
- `src/components/paterhaus/ConversationsModule.test.tsx`: live/demo routing coverage.

## Local verification

```bash
npm run lint
npm test
npm run build
npx tsc -b
```

Local results:

- Full test suite: 12 tests passed.
- Production build: passed with existing duplicate-translation-key and bundle-size warnings.
- Full ESLint: passed with 12 existing fast-refresh warnings.
- Feature-file ESLint: passed with no findings.
- `npx tsc -b`: blocked by existing errors in marketing, pipeline/vendor export typing, and duplicate
  translation keys; none of those files are changed by this feature.

## Manual deployment checklist

### Backend service

1. Keep `DATABASE_URL` pointed at the current Prisma database.
2. Set `CHAT_HISTORY_DATABASE_URL`, `CRM_JWT_SECRET`, and `CRM_ALLOWED_EMAILS`.
3. Confirm explicit production and local CORS origins.
4. Deploy and verify health, token issuance, list, history, takeover, and resume.

### Frontend service

1. Set `VITE_PATERHAUS_API_BASE_URL` to the deployed backend origin.
2. Confirm no backend secret or database value is present in frontend variables.
3. Deploy after the backend is healthy.
4. Sign in as each allowed account and verify live mode.
5. Sign in as another workspace/account and verify demo mode is unchanged.

### n8n verification

1. Confirm chat and history writes share canonical `chat_id`.
2. Receive a WhatsApp message and confirm the new history row has the newest ID.
3. Wait up to 10 seconds and confirm the CRM list updates newest-first.
4. Open the chat and verify history remains ascending by message ID.
5. Verify takeover changes only `ai_enabled`; verify resume also refreshes `ai_resumed_at`.
