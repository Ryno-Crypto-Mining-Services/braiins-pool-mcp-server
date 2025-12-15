# API.md – Braiins Pool Monitoring API (Project Spec)

> This document describes the **monitoring API** used by `braiins-pool-mcp-server` to communicate with the Braiins Pool monitoring endpoints. It is written as a *developer-friendly reference* for implementing MCP tools, not as an official copy of Braiins documentation.

- Upstream docs: Braiins Academy – *Braiins Pool Monitoring* → *API configuration* section.
- Privacy & terms: See Braiins Pool Privacy Policy for data handling and legal constraints.

***

## 1. Overview

The **Braiins Pool Monitoring API** exposes read-only endpoints that allow:

- Fetching **account-level hashrate and rewards**
- Monitoring **workers / devices** status
- Accessing **pool-level statistics** and network data
- Integrating with external monitoring systems and automation tools

Your MCP server will:

- Authenticate with an **API token** associated with a Braiins Pool account.
- Call HTTPS endpoints with `Authorization: Bearer <API_TOKEN>`.
- Cache responses in Redis to reduce load and latency.

This project treats the monitoring API as a **purely read-only interface** to minimize risk: no payout settings, no worker configuration changes.

***

## 2. Authentication

### 2.1 API Tokens

Braiins Pool uses **access profiles** and API tokens for external tools.

Recommended profile for this MCP server:

- Permission: **“Limited read-only”**
- Allowed scopes: **“Allow access to web APIs”** only
- No permission to change financial or security settings

From a Braiins Pool account:

1. Create an *Access Profile* with read-only permissions.
2. Enable API access.
3. Generate an API token and store it securely as an environment variable.

### 2.2 HTTP Authentication

All requests from `braiins-pool-mcp-server` to Braiins Pool must include:

```http
Authorization: Bearer <BRAIINS_POOL_API_TOKEN>
```

- Do **not** log or expose the token (align with standard bearer-token practices).
- Transmit only over **HTTPS**.

Environment variable convention (for this project):

- `BRAIINS_POOL_API_TOKEN` – read-only API token
- `BRAIINS_POOL_API_BASE_URL` – base URL for the monitoring API (e.g. `https://pool.braiins.com/api` or similar; verify from official docs).

***

## 3. Base URL & Versioning

> The exact base path and version should be confirmed from the live Braiins monitoring docs; the following is a project convention consistent with typical mining pool APIs and Braiins’ public APIs.

- **Base URL (project default)**:
`https://pool.braiins.com/api/v1`

You may configure per environment:

- `BRAIINS_POOL_API_BASE_URL`
- `BRAIINS_POOL_API_VERSION` (if needed for future versions)

Requests are made as:

```text
{BRAIINS_POOL_API_BASE_URL}/{resource}?{query}
```


***

## 4. Resource Overview

The monitoring API is modeled around a few main resource groups:


| Resource | Purpose |
| :-- | :-- |
| `user` | Account-level stats (hashrate, rewards, etc.) |
| `workers` | List and details of mining workers/devices |
| `pool` | Global pool stats |
| `network` | Bitcoin network metrics & trends |

These mirror typical Braiins monitoring UI sections: account overview, detailed worker list, pool stats, and network stats.

***

## 5. User & Account Monitoring Endpoints

### 5.1 Get User Overview

**Purpose:** High-level summary for the authenticated user: total hashrate, rewards, balances, and basic config info (used by MCP tools like `get_user_overview`).[^3]

- **Method:** `GET`
- **Path:** `/user/overview`
- **Auth:** Bearer token
- **Query params:** none

**Response (example schema):**

```jsonc
{
  "username": "example_user",
  "currency": "BTC",
  "hashrate": {
    "current": 120000000000000,   // H/s
    "avg_1h": 118000000000000,
    "avg_24h": 115000000000000
  },
  "rewards": {
    "confirmed": "0.01234567",
    "unconfirmed": "0.00012345",
    "last_payout": "0.00100000",
    "last_payout_at": "2025-01-01T10:00:00Z"
  },
  "workers": {
    "active": 42,
    "inactive": 3,
    "total": 45
  },
  "updated_at": "2025-01-10T12:34:56Z"
}
```

MCP tools will typically **cache** this for 30–60 seconds in Redis and avoid per-message polling.

### 5.2 Get User Rewards History

**Purpose:** Retrieve time-series of rewards for charting or trend analysis.

- **Method:** `GET`
- **Path:** `/user/rewards`
- **Auth:** Bearer token

**Query parameters (typical):**


| Name | Type | Required | Description |
| :-- | :-- | :-- | :-- |
| `from` | string | No | Start timestamp (ISO 8601) |
| `to` | string | No | End timestamp (ISO 8601) |
| `granularity` | string | No | Aggregation: `hour`, `day`, `week` |

**Response (schema):**

```jsonc
{
  "currency": "BTC",
  "points": [
    {
      "timestamp": "2025-01-01T00:00:00Z",
      "confirmed": "0.00010000",
      "unconfirmed": "0.00000000",
      "payout": "0.00000000"
    }
  ]
}
```


***

## 6. Worker Monitoring Endpoints

Workers (devices) are core to Braiins Pool monitoring, reflecting per-miner hashrate, health and configuration.

### 6.1 List Workers

**Purpose:** Get a paginated list of workers for the authenticated account.

- **Method:** `GET`
- **Path:** `/workers`
- **Auth:** Bearer token

**Query parameters (typical):**


| Name | Type | Required | Description |
| :-- | :-- | :-- | :-- |
| `page` | number | No | Page number (default: 1) |
| `page_size` | number | No | Items per page (default: 50, max: e.g. 200) |
| `status` | string | No | Filter: `active`, `inactive`, `all` |
| `search` | string | No | Partial match on worker name / identifier |
| `sort_by` | string | No | e.g. `hashrate_desc`, `name_asc`, `last_share` |

**Response:**

```jsonc
{
  "page": 1,
  "page_size": 50,
  "total": 123,
  "workers": [
    {
      "id": "worker-1",
      "name": "farm1-s19-01",
      "status": "active",                 // active / inactive / disabled
      "hashrate": {
        "current": 100000000000000,       // H/s
        "avg_24h": 95000000000000
      },
      "shares": {
        "valid": 123456,
        "invalid": 123
      },
      "last_share_at": "2025-01-10T12:34:56Z",
      "location": "Farm 1",
      "tags": ["S19", "rack-a"]
    }
  ]
}
```


### 6.2 Get Worker Details

**Purpose:** Detailed view of a single worker, for drill-down monitoring and troubleshooting.

- **Method:** `GET`
- **Path:** `/workers/{workerId}`
- **Auth:** Bearer token

**Path parameters:**


| Name | Type | Description |
| :-- | :-- | :-- |
| `workerId` | string | Unique worker identifier |

**Response (example):**

```jsonc
{
  "id": "worker-1",
  "name": "farm1-s19-01",
  "status": "active",
  "hashrate": {
    "current": 100000000000000,
    "avg_1h": 99000000000000,
    "avg_24h": 95000000000000
  },
  "shares": {
    "valid": 123456,
    "invalid": 123,
    "stale": 10
  },
  "hardware": {
    "model": "Antminer S19 Pro",
    "firmware": "braiins-os-plus-23.10",
    "power_mode": "performance"
  },
  "environment": {
    "temperature": {
      "avg": 70.5,
      "max": 80.0,
      "unit": "C"
    }
  },
  "last_share_at": "2025-01-10T12:34:56Z",
  "created_at": "2024-12-01T00:00:00Z",
  "updated_at": "2025-01-10T12:34:56Z"
}
```


### 6.3 Worker Hashrate / Timeseries

**Purpose:** Time-series hashrate for a worker, used for graphs and diagnostics.

- **Method:** `GET`
- **Path:** `/workers/{workerId}/hashrate`
- **Auth:** Bearer token

**Query parameters:**


| Name | Type | Required | Description |
| :-- | :-- | :-- | :-- |
| `from` | string | No | Start timestamp (ISO 8601) |
| `to` | string | No | End timestamp (ISO 8601) |
| `granularity` | string | No | `minute`, `hour`, `day` |

**Response:**

```jsonc
{
  "worker_id": "worker-1",
  "points": [
    {
      "timestamp": "2025-01-10T12:00:00Z",
      "hashrate": 98000000000000
    }
  ]
}
```


***

## 7. Pool & Network Stats

Braiins provides global pool stats and Bitcoin network insights, often used for dashboards and analytics.

### 7.1 Get Pool Stats

**Purpose:** Overall Braiins Pool statistics for BTC.

- **Method:** `GET`
- **Path:** `/pool/stats`
- **Auth:** Public or token-based (confirm from docs; for MCP we assume token for consistent auth handling.)

**Response (example):**

```jsonc
{
  "coin": "BTC",
  "pool_hashrate": 300000000000000000000,  // H/s
  "workers_active": 50000,
  "last_block": {
    "height": 840000,
    "found_at": "2025-01-10T11:45:00Z",
    "reward": "3.12500000"
  },
  "luck": {
    "window_blocks": 720,
    "value": 1.05
  },
  "updated_at": "2025-01-10T12:34:56Z"
}
```


### 7.2 Get Network Stats

**Purpose:** Bitcoin network stats used to contextualize pool and user hashrate.

- **Method:** `GET`
- **Path:** `/network/stats`
- **Auth:** None or token (project assumes token, configurable)

**Response:**

```jsonc
{
  "coin": "BTC",
  "difficulty": 90000000000000,
  "hashrate_estimate": 500000000000000000000,
  "block_time_target": 600,
  "block_time_avg": 610,
  "next_difficulty_change_eta": "2025-01-12T00:00:00Z"
}
```


***

## 8. Error Handling

The monitoring API follows common REST error patterns:

### 8.1 HTTP Status Codes

| Code | Meaning | Typical Causes |
| :-- | :-- | :-- |
| 200 | OK | Successful request |
| 400 | Bad Request | Invalid parameters / malformed request |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Token without required permissions |
| 404 | Not Found | Resource or worker not found |
| 429 | Too Many Requests (if rate-limited) | Exceeded API rate |
| 500 | Internal Server Error | Upstream server error |

### 8.2 Error Body Format

Project-standard error format (normalize upstream responses inside MCP server):

```jsonc
{
  "error": {
    "code": "UNAUTHORIZED",
    "http_status": 401,
    "message": "Invalid or missing API token.",
    "details": {}
  }
}
```

MCP tools should surface **human-readable messages** but never display raw tokens or sensitive identifiers.

***

## 9. Rate Limiting & Caching

Braiins actively polls many pool APIs and publishes network stats; robust clients should be **polite** and minimize redundant calls.

### 9.1 Client-side Rate Limits (Project)

For `braiins-pool-mcp-server`:

- Per-account:
    - `user/overview`: at most **1 request / 30s**
    - `workers`: at most **1 request / 30s**, with pagination
    - Per-worker detailed stats: **1 request / 60–120s**
- Global:
    - Pool & network stats: **1 request / 60s**


### 9.2 Redis Caching Strategy

Cache key patterns:

- `braiins:user:overview:{accountId}`
- `braiins:user:rewards:{accountId}:{hash(params)}`
- `braiins:workers:list:{accountId}:{page}:{filtersHash}`
- `braiins:workers:detail:{accountId}:{workerId}`
- `braiins:pool:stats`
- `braiins:network:stats`

Suggested TTLs:

- User overview / workers lists: 30–60 seconds
- Worker details: 60–120 seconds
- Pool & network stats: 60–300 seconds

***

## 10. Security & Privacy Considerations

- Use **read-only** access profiles and tokens wherever possible.
- Store API tokens only as environment variables or secret storage (e.g., Kubernetes secrets, cloud secret managers).
- Do not include tokens in logs, error messages, or telemetry.
- Restrict MCP server access to trusted clients; consider OAuth 2.0 or VPN if exposed externally.
- Respect Braiins Pool’s privacy policy for all user data handling.

***

## 11. MCP Tool Mapping

Example MCP tool definitions (conceptual):

- `get_user_overview` → `GET /user/overview`
- `list_workers` → `GET /workers`
- `get_worker_details` → `GET /workers/{workerId}`
- `get_worker_hashrate_timeseries` → `GET /workers/{workerId}/hashrate`
- `get_pool_stats` → `GET /pool/stats`
- `get_network_stats` → `GET /network/stats`

Each tool:

- Validates parameters (TypeScript: `zod`; Python: `pydantic`).
- Applies **allow-lists** for filters and sort keys to prevent misuse.
- Uses Redis-backed cache to avoid breaching rate limits.

***

## 12. Implementation Notes for This Project

### 12.1 TypeScript Client (Node.js)

- HTTP: `axios` or `node-fetch` (with `Authorization: Bearer` headers).
- Validation: `zod` schemas for each response resource.
- Transport: MCP server via `@modelcontextprotocol/sdk` over stdio or HTTP.
- Caching: `ioredis` or `redis` client.


### 12.2 Python Client

- HTTP: `httpx` (async) with bearer token auth.
- Validation: `pydantic` models for responses.
- MCP Integration: `fastmcp` / `mcp` + FastAPI, using SSE/HTTP transport.
- Caching: `redis-py` or `aioredis`.

***

## 13. How to Validate Against Upstream Docs

When you or an AI agent modifies this file:

1. Open the official **Braiins Pool Monitoring → API configuration** page.
2. Confirm:
    - Endpoint paths and parameter names
    - Authentication behavior
    - Field names in example responses
3. Update this spec to match; ensure code and docs stay in sync, aligning with best practices that recommend documentation updates alongside code changes.
