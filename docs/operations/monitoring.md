# Monitoring and Health Thresholds

System health indicators and Service Level Objectives (SLOs).

## 📊 SLIs & SLOs Objectives

| SLI Indicator | SLO Objective | Critical Alert Trigger |
| :--- | :--- | :--- |
| **HTTP Success Rate** | > 99.9% | < 99.0% over 5m window |
| **P95 Request Latency** | < 300 ms | > 1000 ms over 5m window |
| **Transaction Queue delay** | < 15 seconds | > 60 seconds for any queue job |
| **API Error Proportion** | < 0.1% | > 1.0% over 5m window |

## 📡 Metrics Endpoint
* **Endpoint:** `/api/metrics`
* Displays active request metrics, Redis performance stats, and current queue lengths.

Related Pages:
* [Health & Metrics API](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/api/health.md)
* [Logging & Observability](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/architecture/logging-observability.md)
