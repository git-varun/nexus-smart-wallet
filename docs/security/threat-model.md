# Security Threat Model

Threat model detailing vulnerabilities, attack vectors, and mitigations.

| Threat Vector | Impact | Implemented Mitigation |
| :--- | :--- | :--- |
| **Token Hijacking & Replay** | High | Refresh Token Rotation invalidates used tokens. |
| **Relayer depletion** | High | Route rate limiters prevent spamming gas-sponsored endpoints. |
| **BOLA Attacks** | High | Strict userId validations check resource ownership. |
| **Session Key Leak** | Medium | Session key permissions are scoped to specific contract targets and spending limits. |
| **XSS Attacks** | High | Strict Content Security Policy limits connection sources. |

Related Pages:
* [JWT Specs](jwt.md)
* [Session Key Flow](session-keys.md)
