# Braiins Pool MCP Server

<!-- CI/CD Badges -->
[![CI](https://github.com/Ryno-Crypto-Mining-Services/braiins-pool-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/Ryno-Crypto-Mining-Services/braiins-pool-mcp-server/actions/workflows/ci.yml)
[![Test](https://github.com/Ryno-Crypto-Mining-Services/braiins-pool-mcp-server/actions/workflows/test.yml/badge.svg)](https://github.com/Ryno-Crypto-Mining-Services/braiins-pool-mcp-server/actions/workflows/test.yml)
[![Build](https://github.com/Ryno-Crypto-Mining-Services/braiins-pool-mcp-server/actions/workflows/build.yml/badge.svg)](https://github.com/Ryno-Crypto-Mining-Services/braiins-pool-mcp-server/actions/workflows/build.yml)
[![codecov](https://codecov.io/gh/Ryno-Crypto-Mining-Services/braiins-pool-mcp-server/graph/badge.svg)](https://codecov.io/gh/Ryno-Crypto-Mining-Services/braiins-pool-mcp-server)

<!-- Package Badges -->
[![npm version](https://img.shields.io/npm/v/@ryno-crypto/braiins-pool-mcp-server.svg)](https://www.npmjs.com/package/@ryno-crypto/braiins-pool-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/@ryno-crypto/braiins-pool-mcp-server.svg)](https://www.npmjs.com/package/@ryno-crypto/braiins-pool-mcp-server)
[![Docker Image](https://img.shields.io/badge/Docker-ghcr.io-blue?logo=docker)](https://github.com/Ryno-Crypto-Mining-Services/braiins-pool-mcp-server/pkgs/container/braiins-pool-mcp-server)

<!-- Quality Badges -->
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![MCP Protocol](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen?logo=node.js)](https://nodejs.org/)

<!-- Documentation Badges -->
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ryno-Crypto-Mining-Services/braiins-pool-mcp-server)
[![Documentation](https://img.shields.io/badge/docs-ARCHITECTURE.md-blue)](./ARCHITECTURE.md)

A Model Context Protocol (MCP) server providing seamless integration with the Braiins Pool API for Bitcoin mining operations. This server enables AI assistants like Claude, GitHub Copilot, and Cursor to interact with mining pool data, monitor performance, and manage configurations through natural language.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Available Tools](#available-tools)
- [Architecture](#architecture)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [License](#license)

---

## Overview

The Braiins Pool MCP Server bridges AI-powered development environments with [Braiins Pool](https://braiins.com/pool), one of the world's oldest Bitcoin mining pools. By implementing the [Model Context Protocol](https://modelcontextprotocol.io), this server transforms complex API interactions into conversational commands that AI agents can understand and execute.

### What is MCP?

Model Context Protocol (MCP) is an open standard that enables AI applications to securely connect with external data sources and tools. It provides:

- **Standardized Communication**: Unified interface for AI-tool integration
- **Secure Connections**: Built-in authentication and authorization
- **Extensible Architecture**: Easy addition of new capabilities
- **Multi-Client Support**: Works with Claude Desktop, Cursor, VS Code Copilot, and more

### Why This MCP Server?

Traditional mining pool APIs require:
- Manual HTTP request construction
- Authentication header management
- Response parsing and error handling
- Deep knowledge of endpoint structures

**With this MCP server, you simply ask:**
> "Show me my worker hashrates for the last 24 hours"
> 
> "What's the total BTC earned this month?"
> 
> "List all offline workers and their last seen time"

---

## Features

### Core Capabilities

- **Worker Monitoring**: Real-time hashrate, temperature, and status tracking
- **Earnings Analytics**: Historical and projected revenue calculations
- **Pool Statistics**: Network difficulty, block discovery, and pool performance
- **User Management**: Multi-account support with credential isolation
- **Configuration Control**: Dynamic pool settings and payout configuration

### Technical Highlights

- ✅ **Full TypeScript Implementation**: Type-safe API interactions
- ✅ **OAuth 2.0 Support**: Secure token-based authentication
- ✅ **Rate Limiting Protection**: Built-in request throttling
- ✅ **Error Recovery**: Automatic retry with exponential backoff
- ✅ **Streaming Responses**: Efficient data transfer for large datasets
- ✅ **Caching Layer**: Redis-compatible caching for frequently accessed data

---

## Prerequisites

### Required

- **Node.js**: v18.0.0 or higher ([download](https://nodejs.org))
- **npm**: v9.0.0 or higher (included with Node.js)
- **Braiins Pool Account**: Active account with API access ([sign up](https://braiins.com/pool))

### Optional

- **MCP Client**: Claude Desktop, Cursor, or VS Code with Copilot
- **Docker**: For containerized deployment
- **Redis**: For production caching (optional)

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 512 MB | 1 GB |
| CPU | 1 core | 2 cores |
| Storage | 100 MB | 500 MB |
| Network | 1 Mbps | 10 Mbps |

---

## Installation

### Quick Start (NPM)

```bash
# Install globally
npm install -g @ryno-crypto/braiins-pool-mcp-server

# Or install locally in project
npm install @ryno-crypto/braiins-pool-mcp-server
```

### From Source

```bash
# Clone repository
git clone https://github.com/Ryno-Crypto-Mining-Services/braiins-pool-mcp-server.git
cd braiins-pool-mcp-server

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test
```

### Docker Deployment

#### Build Locally

```bash
# Build the Docker image
docker build -t braiins-pool-mcp-server .

# Run the container (MCP uses stdio, not HTTP ports)
docker run --rm -i \
  -e BRAIINS_API_KEY=your_api_key \
  braiins-pool-mcp-server
```

#### Using Docker Compose

Two Docker Compose configurations are available:

| File | Description | Use Case |
|------|-------------|----------|
| `docker-compose.yml` | MCP server only | Standard usage |
| `docker-compose.redis.yml` | MCP server + Redis + Redis Commander | Performance optimization with caching |

**Basic Setup (No Redis)**

```bash
# Set your API key
export BRAIINS_API_KEY=your_api_key

# Start the MCP server
docker compose up -d

# View logs
docker compose logs -f
```

**With Redis Caching**

```bash
# Set your API key
export BRAIINS_API_KEY=your_api_key

# Start MCP server with Redis and Redis Commander
docker compose -f docker-compose.redis.yml up -d

# Access Redis Commander UI
open http://localhost:8081

# View logs
docker compose -f docker-compose.redis.yml logs -f
```

#### Pull from Docker Hub

```bash
# Pull pre-built image
docker pull rynocrypto/braiins-pool-mcp-server:latest

# Run container
docker run --rm -i \
  -e BRAIINS_API_KEY=your_api_key \
  rynocrypto/braiins-pool-mcp-server:latest
```

---

## Configuration

### Environment Variables

Create a `.env` file in your project root:

```bash
# Required
BRAIINS_API_KEY=your_api_key_here
BRAIINS_API_SECRET=your_api_secret_here

# Optional
BRAIINS_API_BASE_URL=https://pool.braiins.com/api/v2
CACHE_TTL=300
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
LOG_LEVEL=info
```

### MCP Client Configuration

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "braiins-pool": {
      "command": "node",
      "args": ["/path/to/braiins-pool-mcp-server/build/index.js"],
      "env": {
        "BRAIINS_API_KEY": "your_api_key",
        "BRAIINS_API_SECRET": "your_api_secret"
      }
    }
  }
}
```

#### Cursor / VS Code

Add to `.cursorrules` or `.vscode/mcp.json`:

```json
{
  "mcp": {
    "servers": {
      "braiins-pool": {
        "command": "npx",
        "args": ["@ryno-crypto/braiins-pool-mcp-server"],
        "env": {
          "BRAIINS_API_KEY": "${env:BRAIINS_API_KEY}"
        }
      }
    }
  }
}
```

### API Key Generation

1. Log in to [Braiins Pool](https://pool.braiins.com)
2. Navigate to **Settings** → **API Access**
3. Click **Generate New API Key**
4. Select permissions: `read:workers`, `read:earnings`, `read:blocks`
5. Copy the API key and secret immediately (shown only once)

---

## Usage

### Basic Examples

#### Check Worker Status

```typescript
// In Claude Desktop or Cursor
"Show me the status of all my workers"

// MCP Server executes:
GET /workers
Response: {
  "workers": [
    {
      "name": "miner-01",
      "hashrate": "100 TH/s",
      "status": "active",
      "last_share": "2024-12-15T13:15:00Z"
    }
  ]
}
```

#### Analyze Earnings

```typescript
"Calculate my BTC earnings for December 2024"

// Server aggregates:
// 1. Fetch daily payouts
// 2. Sum amounts
// 3. Apply exchange rate
// Returns formatted report
```

### Advanced Workflows

#### Performance Monitoring

```typescript
// Multi-step analysis
"Compare this week's hashrate to last week and explain any drops"

// Server orchestrates:
// 1. get_hashrate_history(start: -14d, end: -7d)
// 2. get_hashrate_history(start: -7d, end: now)
// 3. compute_difference()
// 4. check_downtime_events()
// 5. generate_summary()
```

#### Automated Alerting

```typescript
// Set up monitoring (coming soon)
"Alert me if any worker goes offline for more than 10 minutes"

// Creates webhook subscription
// Polls /workers/status every 5 min
// Sends notification on condition match
```

---

## Available Tools

### Worker Management

| Tool | Description | Parameters | Returns |
|------|-------------|------------|---------|
| `list_workers` | Get all configured workers | `user_id?: string` | `Worker[]` |
| `get_worker_details` | Detailed stats for specific worker | `worker_name: string` | `WorkerDetails` |
| `get_worker_hashrate` | Historical hashrate chart data | `worker_name, start_date, end_date` | `TimeSeries` |
| `restart_worker` | Remote worker restart (if supported) | `worker_name: string` | `boolean` |

### Earnings & Payouts

| Tool | Description | Parameters | Returns |
|------|-------------|------------|---------|
| `get_earnings_summary` | Total unpaid balance + history | `currency?: BTC\|USD` | `EarningsSummary` |
| `get_payout_history` | Past transactions | `limit?: number, offset?: number` | `Payout[]` |
| `estimate_next_payout` | Projected payout time/amount | `current_hashrate: number` | `PayoutEstimate` |

### Pool Statistics

| Tool | Description | Parameters | Returns |
|------|-------------|-------------|---------|
| `get_pool_stats` | Network-wide metrics | None | `PoolStats` |
| `get_block_history` | Recent block discoveries | `limit?: number` | `Block[]` |
| `get_network_difficulty` | Current BTC difficulty | None | `number` |

### Configuration

| Tool | Description | Parameters | Returns |
|------|-------------|------------|---------|
| `update_payout_threshold` | Minimum payout amount | `threshold: number, currency: string` | `boolean` |
| `set_notification_preferences` | Email/SMS alerts | `preferences: NotificationConfig` | `boolean` |

---

## Architecture

### System Design

```
┌─────────────────┐
│  MCP Client     │  (Claude, Cursor, VS Code)
│  (AI Assistant) │
└────────┬────────┘
         │ MCP Protocol (JSON-RPC 2.0)
         │
┌────────▼────────┐
│  MCP Server     │
│  - Tool Router  │  ← Validates requests
│  - Auth Manager │  ← Handles API keys
│  - Cache Layer  │  ← Redis/in-memory
└────────┬────────┘
         │ HTTPS + OAuth 2.0
         │
┌────────▼────────┐
│ Braiins Pool    │
│ REST API        │
└─────────────────┘
```

### Component Breakdown

**Server Core** (`src/server/`)
- `index.ts`: MCP protocol implementation
- `tools.ts`: Tool definitions and handlers
- `auth.ts`: API authentication logic

**API Client** (`src/api/`)
- `client.ts`: HTTP request wrapper
- `endpoints.ts`: Braiins API endpoint mappings
- `types.ts`: TypeScript interfaces

**Utilities** (`src/utils/`)
- `cache.ts`: Response caching
- `ratelimit.ts`: Request throttling
- `logger.ts`: Structured logging

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Development

### Setup Development Environment

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/braiins-pool-mcp-server.git
cd braiins-pool-mcp-server

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start development server with hot reload
npm run dev
```

### Project Scripts

```bash
npm run build      # Compile TypeScript → JavaScript
npm run dev        # Watch mode with auto-reload
npm test           # Run test suite
npm run test:watch # Continuous testing
npm run lint       # ESLint checks
npm run format     # Prettier formatting
npm run typecheck  # TypeScript validation
```

### Code Style

This project uses:
- **ESLint**: Airbnb base config with TypeScript
- **Prettier**: 2-space indentation, single quotes
- **Husky**: Pre-commit hooks for linting
- **Commitlint**: Conventional commits enforced

Example commit:
```bash
git commit -m "feat(api): add worker restart endpoint"
git commit -m "fix(cache): resolve Redis connection timeout"
git commit -m "docs(readme): update installation instructions"
```

---

## Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- worker.test.ts

# With coverage report
npm test -- --coverage
```

### Integration Tests

```bash
# Requires valid API credentials
BRAIINS_API_KEY=test_key npm run test:integration
```

### Manual Testing with MCP Inspector

```bash
# Install MCP Inspector
npm install -g @modelcontextprotocol/inspector

# Start server in inspector
mcp-inspector npx @ryno-crypto/braiins-pool-mcp-server

# Opens UI at http://localhost:6274
```

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for guidelines.

### Quick Contribution Workflow

1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'feat: add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** Pull Request with description

### Development Resources

- [MCP Specification](https://modelcontextprotocol.io/docs/specification/)
- [Braiins Pool API Docs](https://academy.braiins.com/en/braiins-pool/monitoring/)
- [TypeScript MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)

---

## Troubleshooting

### Common Issues

#### "Authentication Failed"

**Problem**: Invalid API key or secret

**Solution**:
```bash
# Verify credentials
echo $BRAIINS_API_KEY

# Regenerate key at pool.braiins.com/settings/api
# Update .env file
```

#### "Rate Limit Exceeded"

**Problem**: Too many API requests

**Solution**:
```bash
# Increase window in .env
RATE_LIMIT_WINDOW_MS=120000  # 2 minutes

# Or reduce request frequency in client
```

#### "Connection Timeout"

**Problem**: Network or API issues

**Solution**:
```typescript
// Check API status
curl https://pool.braiins.com/health

// Enable debug logging
LOG_LEVEL=debug npm start
```

#### "Tool Not Found"

**Problem**: MCP client can't discover tools

**Solution**:
```bash
# Restart MCP server
pkill -f braiins-pool-mcp-server
npm start

# Clear Claude Desktop cache (macOS)
rm -rf ~/Library/Application\ Support/Claude/cache
```

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/Ryno-Crypto-Mining-Services/braiins-pool-mcp-server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Ryno-Crypto-Mining-Services/braiins-pool-mcp-server/discussions)
- **Email**: support@rynocrypto.com
- **Discord**: [Braiins Community](https://discord.gg/braiins) (mention @ryno-mcp)

---

## Documentation

### Additional Resources

- **[API Reference](./docs/API.md)**: Complete endpoint documentation
- **[Architecture Guide](./ARCHITECTURE.md)**: System design deep dive
- **[Agent Configuration](./AGENTS.md)**: Multi-agent setup patterns
- **[Development Plan](./DEVELOPMENT_PLAN.md)**: Roadmap and milestones
- **[Multi-Agent Orchestration](./MULTIAGENT_PLAN.md)**: Advanced workflows

### Integration Guides

- **[Claude Desktop Setup](./CLAUDE.md)**: Step-by-step Claude configuration
- **[GitHub Copilot Setup](./COPILOT.md)**: VS Code integration
- **[Cursor Configuration](./docs/cursor-setup.md)**: Cursor IDE setup

---

## Roadmap

### Current Version: 1.0.0

- [ ]  Core MCP protocol implementation  
- [ ]  Worker monitoring tools  
- [ ]  Earnings tracking  
- [ ]  Basic caching  

### Version 1.1.0 (Q1 2025)

- [ ] WebSocket support for real-time updates
- [ ] Multi-pool aggregation (Braiins + Foundry + F2Pool)
- [ ] Historical analytics (30/60/90 day reports)
- [ ] Export to CSV/JSON

### Version 2.0.0 (Q2 2025)

- [ ] Braiins OS API integration (miner firmware control)
- [ ] Automated alerting via webhooks
- [ ] AI-powered anomaly detection
- [ ] Mobile app companion

---

## Security

### Reporting Vulnerabilities

**Do not** open public GitHub issues for security bugs. Instead:

1. Email: security@rynocrypto.com
2. Include: reproduction steps, impact assessment, suggested fix
3. Response: We aim to respond within 48 hours

### Security Best Practices

- **Never commit** API keys to version control
- **Use environment variables** for secrets
- **Rotate keys** every 90 days
- **Enable 2FA** on Braiins Pool account
- **Audit access logs** regularly

---

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

- **@modelcontextprotocol/sdk**: MIT License
- **axios**: MIT License
- **dotenv**: BSD-2-Clause License

Full dependency licenses: `npm run licenses`

---

## Acknowledgments

- **Braiins Team**: For exceptional mining pool infrastructure
- **Anthropic**: For pioneering the Model Context Protocol
- **Contributors**: See [CONTRIBUTORS.md](./docs/CONTRIBUTORS.md)

### Built With

- [Model Context Protocol](https://modelcontextprotocol.io) - Communication standard
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Node.js](https://nodejs.org) - Runtime environment
- [Braiins Pool](https://braiins.com/pool) - Bitcoin mining pool

---

## Citation

If you use this MCP server in research or production, please cite:

```bibtex
@software{braiins_pool_mcp_server,
  title = {Braiins Pool MCP Server},
  author = {Ryno Crypto Mining Services},
  year = {2024},
  url = {https://github.com/Ryno-Crypto-Mining-Services/braiins-pool-mcp-server},
  version = {1.0.0}
}
```

---

## Stay Connected

- **Website**: [rynocrypto.com](https://rynocrypto.com)
- **Twitter**: [@RynoCryptoServ](https://twitter.com/RynoCryptoServ)
- **GitHub**: [Ryno-Crypto-Mining-Services](https://github.com/Ryno-Crypto-Mining-Services)
- **LinkedIn**: [Company Page](https://linkedin.com/company/ryno-crypto-mining)

---

<div align="center">

**Made with ⛏️ by miners, for miners**

[Report Bug](https://github.com/Ryno-Crypto-Mining-Services/braiins-pool-mcp-server/issues/new?template=bug_report.md) · 
[Request Feature](https://github.com/Ryno-Crypto-Mining-Services/braiins-pool-mcp-server/issues/new?template=feature_request.md) · 
[Documentation](./docs/)

</div>
