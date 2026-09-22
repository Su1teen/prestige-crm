# Paterhaus live CRM

## Runtime and security boundary

```text
WAHA -> n8n -> Railway S3-compatible Bucket (file bytes)
             -> CHAT_HISTORY_DATABASE_URL (history + attachment metadata)

Prestige CRM -> paterhaus-backend -> short-lived presigned S3 GET URL
Prestige CRM -> paterhaus-backend -> N8N_OUTBOUND_WEBHOOK_URL -> n8n -> WAHA
```

The browser talks only to `paterhaus-backend`. It never receives database URLs, the WAHA key,
the n8n token, the CRM JWT secret, an S3 access key, an S3 secret, or an object storage key.
Attachment filenames, captions and summaries are rendered only as plain React text. Extracted text is
kept server-side and is never sent in the CRM attachment response.

Live mode is enabled only for normalized `info@paterhaus.com` and `r_tszi@paterhaus.com` accounts.
Every other account keeps the existing demo-data path.

## Focused workspace

`r_tszi@paterhaus.com` has exactly these five sections, in this order:

1. Owner Pipeline
2. Marketing
3. Conversations
4. Files
5. Calendar

Portfolio and all unrelated admin modules remain unavailable to this profile. `info@paterhaus.com`
keeps the full Paterhaus navigation. The Paterhaus shell and its portal-based dialogs, sheets and menus
use the bright Paterhaus token set; no Paterhaus component forces the global `dark` class.

## Conversations

- The list and selected history poll every 10 seconds while the page is visible, with overlapping
  requests deduplicated.
- Desktop uses a 340 px independently scrolling list and an independently scrolling message area.
  The list can be collapsed. The selected-chat header and takeover composer do not scroll away.
- Mobile renders either the list or the detail and retains the Back action.
- AI enabled: the composer is hidden. `Take over AI` disables AI, after which the composer appears.
  `Resume AI` enables AI and hides the composer again.
- Manual replies use only the existing backend -> protected n8n -> WAHA flow. A failed downstream send
  does not insert a `hostory_pater` row and the CRM preserves the draft.
- A delivered manager reply is stored as `human:ruslan` and displayed as `Ruslan` with a
  `Manager reply` badge. The authorized email remains available to backend audit logs and is included
  separately in the protected n8n payload.
- Legacy `human:whatsapp` is displayed as Ruslan. Other legacy `human:<email>` values remain readable.
- Incoming attachments render caption text, when present, followed by a file card with filename,
  type/size, summary and Download. Normalized/extracted AI text, raw XML and spreadsheet JSON are not
  rendered for attachment messages.

Capabilities are explicit:

```json
{
  "manualMessages": true,
  "attachments": false,
  "manualAttachments": false,
  "incomingAttachments": true,
  "maxMessageLength": 4096
}
```

The legacy `attachments` field and `manualAttachments` both mean outbound composer uploads, which are
not implemented. Incoming WhatsApp attachments are supported.

## Live Files

The focused Files section reads real metadata from `GET /api/paterhaus/files`. It provides search,
type filtering and cursor pagination. It has no demo uploads, missing-document states, review workflow
or versioning. The demo `FilesHubModule` remains unchanged for other workspaces.

Download flow:

1. The user presses Download.
2. The CRM calls `POST /api/paterhaus/attachments/:attachmentId/download-url` with its bearer token.
3. The backend authorizes the live Paterhaus account, finds the metadata row and signs the private
   Railway Bucket object for 300 seconds.
4. The browser opens the temporary URL. A new URL is requested for a later retry or after expiry.

The UI distinguishes loading, empty, metadata failure and download failure states. Authorization,
not-found and storage-unavailable errors produce user-facing messages without exposing internals.

## Backend endpoints

All endpoints below require the existing live-conversation bearer token except the access-token bridge.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/paterhaus/conversations/:conversationId/messages` | History with `attachments: LiveAttachment[]` on each message. |
| `GET` | `/api/paterhaus/conversations/:conversationId/attachments` | Metadata for the conversation's canonical `chat_id`. |
| `GET` | `/api/paterhaus/files` | Newest-first attachment list; supports `limit`, `cursor`, `search`, `kind`. |
| `POST` | `/api/paterhaus/attachments/:attachmentId/download-url` | Returns `{ url, expiresIn: 300 }`. |
| `POST` | `/api/paterhaus/conversations/:conversationId/messages` | Delivers a manager reply through n8n, then persists `human:ruslan`. |

`LiveAttachment` contains only `id`, `fileName`, `mimeType`, `kind`, `sizeBytes`, `caption`, `summary`
and `createdAt`. It never contains `storage_key`, credentials, a permanent URL or `extracted_text`.

## Chat-history tables and safe migration

The tables below belong only to the external PostgreSQL database identified by
`CHAT_HISTORY_DATABASE_URL`. They are intentionally not Prisma models in `DATABASE_URL`.

`pater_attachments` stores WhatsApp/S3 metadata, never file bytes. It includes canonical `chat_id`,
optional indexed `history_id`, WAHA session/message identity, sender/contact fields, filename/MIME/kind/
size, bucket/key, caption, summary, extracted text and `created_at`. Canonical `file_kind` values are
`image`, `audio`, `pdf`, `word`, `spreadsheet`, `text`, `other`. The unique idempotency key is
`(waha_session, waha_message_id, storage_key)`. There is deliberately no foreign key to the external
`hostory_pater` table.

`pater_ai_escalations` contains one reusable open escalation per `(chat_id, reason_code)`, enforced by
a partial unique index where `status = 'open'`. It records the reason, requested action, priority,
occurrence count, notification timestamps and resolution state. No Telegram workflow is implemented
in this phase.

The non-destructive migration is:

```text
chat-history-migrations/20260922_001_attachments_escalations.sql
scripts/migrate-chat-history.mjs
```

Railway runs `npm run chat-history:migrate` as `preDeployCommand`. The runner connects only through
`CHAT_HISTORY_DATABASE_URL`, begins a transaction, takes a transaction-scoped advisory lock, creates
`pater_system_migrations` if needed, and checks for `20260922_001_attachments_escalations`. If present,
it commits without running the SQL. Otherwise it executes the create-table/index SQL, records the ID
and commits. Any failure rolls back and exits non-zero. The migration contains no drop, truncate,
delete, or recreation of `chats_pater`, `hostory_pater` or `pater_classification`.

## Railway variables

### `paterhaus-backend`

Existing required values remain unchanged: `DATABASE_URL`, `CHAT_HISTORY_DATABASE_URL`,
`CRM_JWT_SECRET`, `CRM_ALLOWED_EMAILS`, `CORS_ORIGIN`, webhook secrets and the existing integration
variables.

| Variable | Purpose |
| --- | --- |
| `N8N_OUTBOUND_WEBHOOK_URL` | Enables manual replies when set. |
| `N8N_OUTBOUND_WEBHOOK_TOKEN` | Optional bearer token for that protected webhook. |
| `ATTACHMENTS_S3_ENDPOINT` | Railway Bucket S3 endpoint. |
| `ATTACHMENTS_S3_REGION` | Bucket region. |
| `ATTACHMENTS_S3_BUCKET` | Private bucket name; must match `pater_attachments.storage_bucket`. |
| `ATTACHMENTS_S3_ACCESS_KEY_ID` | Backend-only S3 access key. |
| `ATTACHMENTS_S3_SECRET_ACCESS_KEY` | Backend-only S3 secret. |

All five `ATTACHMENTS_S3_*` variables must be set together. The SDK uses Railway's virtual-hosted
style and does not force path-style addressing.

### `prestige-crm`

Only `VITE_PATERHAUS_API_BASE_URL` is required. Do not add n8n, WAHA, PostgreSQL or S3 secrets to the
frontend service.

## WAHA/n8n contract for the next phase

Do not add Telegram or reporting workflows yet. The later inbound workflow must:

1. Read `payload.media.s3.Bucket` and `payload.media.s3.Key` from the WAHA webhook.
2. Insert the normal contact history row into `hostory_pater` using the canonical `chat_id`.
3. Capture the returned history ID.
4. Insert one `pater_attachments` row with that `history_id`, the same canonical `chat_id`,
   `waha_session`, `waha_message_id`, sender metadata, filename/MIME/canonical kind/size, the exact S3
   bucket and key, optional caption/summary/extracted text and timestamp.
5. Use `ON CONFLICT (waha_session, waha_message_id, storage_key) DO NOTHING` (or an equivalent safe
   upsert) for webhook retries.

The outbound manager webhook receives:

```json
{
  "conversationId": 6,
  "chatId": "canonical-chat-id",
  "number": "77021464983",
  "text": "Manager reply",
  "sentBy": "human:ruslan",
  "authorizedEmail": "r_tszi@paterhaus.com",
  "idempotencyKey": "uuid"
}
```

n8n must acknowledge success only after WAHA confirms delivery. Only then does the backend insert the
`hostory_pater` manager row. For later escalation workflows, upsert or reuse the open
`pater_ai_escalations` row on `(chat_id, reason_code)` and increment `occurrence_count`; do not create a
new Telegram notification record on every repeat.

## Manual deployment checklist

1. In Railway, confirm the backend service source branch is the production/default backend lineage and
   deploy the branch containing the live-conversation port plus this change.
2. Provision or select a private Railway Bucket and set all five backend S3 variables.
3. Configure WAHA to write incoming media to that same bucket and configure the later n8n insert using
   the contract above.
4. Set `N8N_OUTBOUND_WEBHOOK_URL` (and token if used) to enable manual replies.
5. Keep `VITE_PATERHAUS_API_BASE_URL` as the only frontend integration variable.
6. Deploy the backend first so the one-time migration and APIs are available, then deploy the CRM.
7. Smoke-test takeover/resume, a delivered Ruslan reply, an n8n delivery failure, inbound attachment
   rendering, Files search/filter/pagination and a fresh five-minute download URL.
8. Confirm a second backend deployment reports the migration already applied and does not recreate or
   erase any table.
