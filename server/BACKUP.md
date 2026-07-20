# Backup del database

Il timer `bourmet-backup.timer` esegue un backup ogni giorno alle 03:00, con
un ritardo casuale massimo di 10 minuti. Se il computer è spento, `Persistent`
fa partire il backup al successivo avvio della sessione utente.

I file vengono salvati in `server/backups/database`, con permessi privati, in
formato SQL compresso. I backup più vecchi di 14 giorni vengono eliminati.
Questa cartella è esclusa da Git.

## Controlli

```bash
systemctl --user status bourmet-backup.timer
systemctl --user list-timers bourmet-backup.timer
journalctl --user -u bourmet-backup.service
```

## Backup manuale

```bash
server/scripts/backup-database.sh
```

## Ripristino

Prima di ripristinare, fermare NestJS e creare un ulteriore backup. Poi:

```bash
gzip -dc server/backups/database/NOME_BACKUP.sql.gz |
  docker exec -i -e MYSQL_PWD="$DB_ROOT" db_jds_ok mysql -uroot hamburgeria
```

La variabile `DB_ROOT` deve essere caricata dal file `server/nestjs/.env`.
