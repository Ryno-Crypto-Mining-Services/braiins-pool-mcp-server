# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Do not** open public GitHub issues for security vulnerabilities.

### How to Report

1. **Email**: security@rynocrypto.com
2. **Subject**: `[SECURITY] braiins-pool-mcp-server - Brief description`

### What to Include

- Type of vulnerability (e.g., injection, authentication bypass, information disclosure)
- Step-by-step instructions to reproduce the issue
- Affected versions
- Potential impact assessment
- Any suggested fixes (optional)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 5 business days
- **Resolution Timeline**: Depends on severity
  - Critical: 24-72 hours
  - High: 1-2 weeks
  - Medium: 2-4 weeks
  - Low: Next scheduled release

### Security Measures in This Project

- **Dependency Scanning**: Automated via Dependabot
- **Static Analysis**: CodeQL analysis on every PR
- **Container Scanning**: Trivy scans for Docker images
- **Secret Detection**: Pre-commit hooks prevent accidental secret commits
- **Minimal Permissions**: Non-root container user, least-privilege GitHub Actions

### Security Best Practices for Users

1. **API Keys**: Never commit API keys to version control
2. **Environment Variables**: Use `.env` files (gitignored) or secret managers
3. **Key Rotation**: Rotate Braiins API keys every 90 days
4. **Access Control**: Use read-only API keys when possible
5. **Network Security**: Deploy behind firewalls in production

## Public Disclosure

We follow responsible disclosure:

1. Vulnerability is privately reported
2. We confirm and assess the issue
3. We develop and test a fix
4. We release the patch
5. We publicly disclose after users have had time to update (typically 30 days)

## Recognition

We appreciate security researchers who help keep this project safe. With your permission, we'll acknowledge your contribution in our release notes and CONTRIBUTORS.md.

## Contact

- **Security Issues**: security@rynocrypto.com
- **General Questions**: [GitHub Discussions](https://github.com/Ryno-Crypto-Mining-Services/braiins-pool-mcp-server/discussions)
