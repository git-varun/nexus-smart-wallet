# Secrets & Custodial Relayer Protections

Details on relayer key security and production recommendations.

## 🔐 Relayer Key Storage
* In development, the custodial relayer private key (`MASTER_WALLET_PRIVATE_KEY`) is loaded from environment variables.
* **Production KMS/HSM Recommendation:** Migrate the relayer signer service to load key material from **AWS KMS** or **GCP Cloud KMS** using HSM-backed `ECC_SEC_P256K1` keys. This allows executing transaction signatures remotely without loading private key material into application memory.

Related Pages:
* [Environment Table](file:///home/dev-var/Personal/Projects/nexus-smart-wallet/docs/reference/environment.md)
* [Threat Profiles](threat-model.md)
