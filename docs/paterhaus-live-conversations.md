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
- History renders in backend order with contact messages incoming, AI messages outgoing, and human
  takeover replies outgoing with a `Manager reply` badge.
- Takeover sends `{ "aiEnabled": false }`; resume sends `{ "aiEnabled": true }`.
- Loading, request failure, and genuinely empty history are three distinct states; a failed history
  request never renders as an empty conversation, and list and history retry independently.
- The composer is rendered only while AI is off **and** `GET /api/paterhaus/conversations/capabilities`
  reports `manualMessages: true`; otherwise the panel states that manual replies are not configured.
- Attachments are never offered because `capabilities.attachments` is `false` end to end.
- The demo Resolve/Reopen controls are absent in live mode.

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

## Owner Pipeline live mode

For the two allowlisted accounts, Owner Pipeline renders live AI lead classifications from
`GET /api/paterhaus/lead-classifications` (backend order: `updated_at DESC, id DESC`). Every other
account keeps the unchanged demo pipeline.

Rendered per lead: display name (name, else username, else number/chat id), number, summary, lead type,
stage, priority, work type, created and updated timestamps. Unrecognized backend values are shown
verbatim instead of being mapped to a fake label. Loading, empty, and retryable error states are distinct;
the list refreshes every 30 seconds while the tab is visible.

## Phase 2 scope

Included: everything from phase 1, plus human takeover replies through the backend, capability-gated
composer, live lead classifications in Owner Pipeline, and explicit failure states.

Out of scope: attachments, media processing, and any direct WAHA or n8n call from the frontend. Manual
replies always travel frontend -> backend -> protected n8n webhook -> WAHA.

## File summary

- `src/lib/paterhausConversationsApi.ts`: typed API client, in-memory token, expiry handling, one `401`
  retry, status-carrying `LiveConversationsError`, capabilities, manual send, and lead classifications.
- `src/components/paterhaus/LiveConversationsModule.tsx`: live list, history, polling, timestamps, AI
  controls, distinct failure states, and the capability-gated takeover composer.
- `src/components/paterhaus/LiveOwnerPipelineModule.tsx`: live lead classifications with label mapping
  and loading/empty/error states.
- `src/components/paterhaus/OwnerPipelineModule.tsx`: selects live or demo pipeline from the email.
- `src/components/paterhaus/LiveOwnerPipelineModule.test.tsx`: ordering, labels, empty, and retry coverage.
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

- Full test suite: 27 tests passed.
- Production build: passed with existing duplicate-translation-key and bundle-size warnings.
- Full ESLint: 0 errors, 12 existing fast-refresh warnings.
- `npx tsc -b`: same pre-existing errors as `origin/main` (marketing export, pipeline/vendor CSV export
  typing, duplicate translation keys), verified by running it on a clean `origin/main` worktree.

## Manual deployment checklist

### Backend service

1. Keep `DATABASE_URL` pointed at the current Prisma database.
2. Set `CHAT_HISTORY_DATABASE_URL`, `CRM_JWT_SECRET`, and `CRM_ALLOWED_EMAILS`.
3. Confirm explicit production and local CORS origins.
4. Set `N8N_OUTBOUND_WEBHOOK_URL` (and `N8N_OUTBOUND_WEBHOOK_TOKEN` if the webhook requires a bearer)
   to enable manual replies; without it the API reports `manualMessages: false` and the UI hides the composer.
5. Set `LEAD_CLASSIFICATIONS_TABLE` if the classification table cannot be discovered by its columns.
6. Deploy and verify health, token issuance, list, history, takeover, resume, manual send, and
   `/api/paterhaus/lead-classifications`.

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

### Manual takeover smoke test

1. Sign in as `info@paterhaus.com`, open Conversations, and confirm no composer is visible while AI is on.
2. Click **Take over AI** and confirm the composer appears inside the right-hand panel (input plus Send,
   no attachment control) without overlaying the conversation list.
3. Send a short reply, confirm it appears as an outgoing `Manager reply` bubble, and confirm the WhatsApp
   contact received it.
4. Confirm the new `hostory_pater` row has `username = human:info@paterhaus.com` and the canonical `chat_id`.
5. Stop the n8n workflow, send again, and confirm the error is shown and the typed text is preserved.
6. Click **Resume AI** and confirm the composer disappears.
7. Open Owner Pipeline and confirm live classification rows render newest-updated first.
8. Sign in with a non-allowlisted account and confirm Conversations and Owner Pipeline stay on demo data.
