# Winston Logging & Redaction

Detailed JSON log structure.

## 📡 Winston Logger Config
* Configures structured JSON output to standard streams.
* **Redaction Filter:** Automatically masks passwords, JWT headers, private keys (0x followed by 64 hex characters), and keys matching `secret`, `token`, or `apikey`.

## 🗄️ Retention Policy
* **Local Docker files:** Rolled at 10 MB per file, keeping a maximum of 3 backups.
* **Log Aggregation:** Standard 30-day retention window recommended.

Related Pages:
* [Monitoring & Health](monitoring.md)
* [Logging & Observability](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/architecture/logging-observability.md)
