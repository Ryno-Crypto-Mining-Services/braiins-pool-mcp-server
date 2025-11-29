# Braiins Pool Monitoring API Overview

The following API documentation is sourced from the [Braiins Academy - Braiins Pool Monitoring](https://academy.braiins.com/en/braiins-pool/monitoring/#api-configuration)

The Braiins Pool monitoring API exposes multiple JSON endpoints for querying pool-wide stats and user-level performance, rewards, workers, and payouts. All authenticated endpoints require an access token in the HTTP headers. [web:1]

## Authentication and Rate Limits

- Access tokens are created under: Settings → Access Profiles. [web:1]
- For a chosen access profile, enable “Allow access to web APIs” and generate a new token. Each profile has its own token and old tokens are invalidated when regenerated. [web:1]
- Authentication header (either one is accepted):  
  - `Pool-Auth-Token: <ACCESS_TOKEN>`  
  - `X-Pool-Auth-Token: <ACCESS_TOKEN>` [web:1]
- Safe request rate: about 1 request every 5 seconds; exceeding this can result in ignored requests or temporary IP bans. [web:1]

Example (cURL):

```
curl "https://pool.braiins.com/stats/json/btc/" \
  -H "Pool-Auth-Token: <ACCESS_TOKEN>"
```

[web:1]

---

## Pool Stats API

Provides global pool performance information and the most recent blocks. [web:1]

- URL:  
  `https://pool.braiins.com/stats/json/btc/` [web:1]

### General Pool Stats Fields

- `hash_rate_unit` (string) – Unit used for all hash rate values (for example, "Gh/s"). [web:1]
- `pool_5m_hash_rate` (number) – Pool hash rate averaged over the last 5 minutes. [web:1]
- `pool_60m_hash_rate` (number) – Pool hash rate averaged over the last 60 minutes. [web:1]
- `pool_24h_hash_rate` (number) – Pool hash rate averaged over the last 24 hours. [web:1]
- `update_ts` (number) – Unix timestamp when these statistics were last updated. [web:1]
- `blocks` (object) – Collection of data for the last 15 blocks (structure below). [web:1]
- `fpps_rate` (number) – Current pay-per-share (FPPS) rate used by the pool. [web:1]

### Latest Blocks Fields

Inside `blocks`, each block entry includes: [web:1]

- `date_found` (number) – Unix timestamp when the block was found. [web:1]
- `mining_duration` (number) – Length of the round (in seconds) that produced this block. [web:1]
- `total_shares` (number) – Total shares submitted in that round. [web:1]
- `state` (string) – Block state (for example, confirmed, pending; specific values defined by the pool). [web:1]
- `confirmations_left` (number) – Remaining confirmations required for finality. [web:1]
- `value` (string) – Total value of the block reward. [web:1]
- `user_reward` (string) – Portion of the block reward credited to the user. [web:1]
- `pool_scoring_hash_rate` (number) – Pool scoring hash rate at the time the block was found. [web:1]

---

## User Profile API

Returns overall user performance, hash rate, worker state counts, and reward balances for a given coin. [web:1]

- URL:  
  `https://pool.braiins.com/accounts/profile/json/btc/` [web:1]

### User Profile Fields

Top-level:

- `username` (string) – Account username. [web:1]

Coin section (e.g., `btc`):

- `all_time_reward` (string) – Cumulative mining reward for the account. [web:1]
- `hash_rate_unit` (string) – Unit used for hash rate fields. [web:1]
- `hash_rate_5m` (number/string) – Average hash rate for the last 5 minutes. [web:1]
- `hash_rate_60m` (number) – Average hash rate for the last 60 minutes. [web:1]
- `hash_rate_24h` (number) – Average hash rate over the last 24 hours. [web:1]
- `hash_rate_yesterday` (number) – Average hash rate for the previous UTC day. [web:1]

Worker state counts:

- `low_workers` (number) – Number of workers in “low” state. [web:1]
- `off_workers` (number) – Number of workers in “off” state. [web:1]
- `ok_workers` (number) – Number of workers in “ok” state. [web:1]
- `dis_workers` (number) – Number of workers with monitoring disabled. [web:1]

Rewards and shares:

- `current_balance` (string) – Current unpaid balance for the account. [web:1]
- `today_reward` (string) – Confirmed reward for the current calendar day. [web:1]
- `estimated_reward` (string) – Estimated reward for the current block, based on current scoring hash rate. [web:1]
- `shares_5m` (number) – Active shares in the last 5 minutes. [web:1]
- `shares_60m` (number) – Active shares within the last hour. [web:1]
- `shares_24h` (number) – Active shares for the last 24 hours. [web:1]
- `shares_yesterday` (number) – Active shares submitted during the previous UTC day. [web:1]

---

## Daily Reward API

Provides per-day reward breakdown for a user over a given date range, with a default of the last 90 days if no range is specified. [web:1]

- URL (with optional date range):  
  `https://pool.braiins.com/accounts/rewards/json/btc?from=[FROM]&to=[TO]` [web:1]
- Parameters:  
  - `COIN` – fixed to `btc` in this context. [web:1]  
  - `FROM` – date string in ISO format `YYYY-MM-DD`. [web:1]  
  - `TO` – date string in ISO format `YYYY-MM-DD`. [web:1]

Example:

```
https://pool.braiins.com/accounts/rewards/json/btc?from=2024-11-30&to=2024-12-02
```

[web:1]

### Daily Reward Fields

Each entry under `btc.daily_rewards` contains: [web:1]

- `date` (number) – Unix timestamp for the first second of that day (UTC). [web:1]
- `total_reward` (number/string) – Sum of all reward components for that day. [web:1]
- `mining_reward` (number/string) – Standard mining reward from shares for that day. [web:1]
- `bos_plus_reward` (number/string) – Pool fee refund amount for mining with Braiins OS devices. [web:1]
- `referral_bonus` (number/string) – Bonus earned for being referred to Braiins OS. [web:1]
- `referral_reward` (number/string) – Reward accrued for referred hash rate that mines with Braiins OS. [web:1]
- `calculation_date` (number) – Unix timestamp of when that day’s rewards were calculated. [web:1]

---

## Daily Hashrate API

Exposes daily average hash rate and total shares for the user or a user group. [web:1]

- URL:  
  `https://pool.braiins.com/accounts/hash_rate_daily/json/[group]/btc` [web:1]
- `group` – path segment that controls whether group-level averages are returned (e.g., `group`). [web:1]

Example:

```
https://pool.braiins.com/accounts/hash_rate_daily/json/group/btc
```

[web:1]

### Daily Hashrate Fields

Each item in the `btc` array includes: [web:1]

- `date` (number) – Unix timestamp for the first second of that day (UTC). [web:1]
- `hash_rate_unit` (string) – Unit used for hash rate values. [web:1]
- `hash_rate_24h` (number) – Average hash rate for the 24-hour period of that day. [web:1]
- `total_shares` (number) – Total shares submitted during that day. [web:1]

---

## Block Rewards API

Returns per-block reward details for a user over a specified date range. [web:1]

- URL:  
  `https://pool.braiins.com/accounts/block_rewards/json/btc?from=[FROM]&to=[TO]` [web:1]
- Parameters:  
  - `COIN` – `btc`. [web:1]  
  - `FROM` – ISO date `YYYY-MM-DD`. [web:1]  
  - `TO` – ISO date `YYYY-MM-DD`. [web:1]

Example:

```
https://pool.braiins.com/accounts/block_rewards/json/btc?from=2022-05-01&to=2022-05-07
```

[web:1]

### Block Rewards Fields

Each entry under `btc.block_rewards` includes: [web:1]

- `block_found_at` (number) – Unix timestamp (UTC) when the block was found. [web:1]
- `pool_scoring_hash_rate` (number) – Total scoring hash rate of the pool at block-found time. [web:1]
- `user_scoring_hash_rate` (number) – User’s scoring hash rate at block-found time. [web:1]
- `block_value` (string) – Total block reward value. [web:1]
- `user_reward` (string) – User reward for this block. [web:1]
- `block_heigh` (number) – Block height within the Bitcoin blockchain (note spelling in field name). [web:1]
- `mining_reward` (string) – Component of the reward from standard mining shares. [web:1]
- `braiinsos_plus_mining_bonus` (string) – Pool fee refund for mining via Braiins OS (firmware) devices. [web:1]
- `referral_reward` (string) – Additional reward linked to referred hash rate. [web:1]
- `referral_bonus` (string) – Bonus for referring Braiins OS with a dedicated referral code. [web:1]
- `confirmations_left` (number) – Remaining confirmations for this block’s reward to finalize. [web:1]

---

## Worker API

Provides performance statistics per worker, including status, hash rates, and share counts. [web:1]

- URL:  
  `https://pool.braiins.com/accounts/workers/json/btc` [web:1]

Workers are listed under `btc.workers` as a map keyed by worker name, such as `username.worker1`. [web:1]

### Worker Fields

Per worker: [web:1]

- `last_share` (number) – Unix timestamp of the last accepted share from this worker. [web:1]
- `state` (string) – Worker monitoring state; possible values are:  
  - `ok` – Hash rate at or above alert threshold.  
  - `low` – Hash rate below threshold but still submitting shares.  
  - `off` – No hash rate detected while monitoring is enabled.  
  - `dis` – Monitoring disabled for this worker. [web:1]
- `hash_rate_unit` (string) – Unit used for hash rate values. [web:1]
- `hash_rate_scoring` (number) – Current scoring hash rate for the worker. [web:1]
- `hash_rate_5m` (number) – Average hash rate over the last 5 minutes. [web:1]
- `hash_rate_60m` (number) – Average hash rate over the last 60 minutes. [web:1]
- `hash_rate_24h` (number) – Average hash rate for the last 24 hours. [web:1]
- `shares_5m` (number) – Active shares for the last 5 minutes. [web:1]
- `shares_60m` (number) – Active shares for the last hour. [web:1]
- `shares_24h` (number) – Active shares for the last 24 hours. [web:1]

---

## Payouts API

Returns payout transaction information (on-chain and Lightning) for a given date range. [web:1]

- URL:  
  `https://pool.braiins.com/accounts/payouts/json/btc?from=[FROM]&to=[TO]` [web:1]
- Parameters:  
  - `COIN` – `btc`. [web:1]  
  - `FROM` – ISO date `YYYY-MM-DD`. [web:1]  
  - `TO` – ISO date `YYYY-MM-DD`. [web:1]

Example:

```
https://pool.braiins.com/accounts/payouts/json/btc?from=2022-05-01&to=2022-05-07
```

[web:1]

The response includes at least an `onchain` array for on-chain payouts; Lightning payouts use corresponding fields (e.g., `invoice`, `preimage`). [web:1]

### Payout Fields

For each payout entry: [web:1]

- `financial_account_name` (string) – Name of the financial account these payouts belong to (for example, "Bitcoin Account"). [web:1]
- `requested_at_ts` (number) – Unix timestamp when the payout was requested. [web:1]
- `resolved_at_ts` (number) – Unix timestamp when the payout was confirmed, failed, or otherwise resolved. [web:1]
- `status` (string) – Payout status; values include `queued`, `confirmed`, or `failed`. [web:1]
- `amount_sats` (number) – Payout amount in satoshis. [web:1]
- `fee_sats` (number) – Fee charged for the payout in satoshis. [web:1]
- `destination` (string) – Destination descriptor: Bitcoin address for on-chain or Lightning invoice string for Lightning payouts. [web:1]
- `tx_id` (string) – Transaction ID for on-chain payouts only. [web:1]
- `invoice` (string) – Lightning invoice string (Lightning payouts only). [web:1]
- `preimage` (string) – Lightning preimage (Lightning payouts only). [web:1]
- `trigger_type` (string) – How the payout was initiated; possible values include `triggered` (automatic) and `manual`. [web:1]
