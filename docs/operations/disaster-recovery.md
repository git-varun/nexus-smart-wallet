# Disaster Recovery Procedures

Database backup and restore commands.

## 💾 MongoDB Database Backups
* Run MongoDB backup command:
  ```bash
  docker compose exec mongo mongodump --db nexus-wallet --out /data/db/backups/nexus_backup_$(date +%F)
  ```

## 🔄 MongoDB Database Restoration
* Restore database from backup:
  ```bash
  docker compose exec mongo mongorestore --db nexus-wallet /data/db/backups/nexus_backup_<date>
  ```

## 🛠️ Recovery Checklist
- [ ] Verify container bridge network is active.
- [ ] Verify host disk storage has sufficient space.
- [ ] Spin up Redis and MongoDB containers first.
- [ ] Run backend API container and tail the log stream to verify successful blockchain connection.

Related Pages:
* [Deployment Guide](deployment.md)
* [Troubleshooting Stuck Ops](troubleshooting.md)
