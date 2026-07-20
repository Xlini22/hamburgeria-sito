# Stato sicurezza infrastruttura

## Database

- MySQL è pubblicato soltanto su `127.0.0.1:3320`, quindi non ascolta sulle
  interfacce di rete esterne.
- NestJS usa `bourmet_app`, limitato a `SELECT`, `INSERT`, `UPDATE` e `DELETE`
  sul solo database `hamburgeria`.
- Le migrazioni vengono eseguite separatamente con l'account amministrativo.
- Il processo `mysqld` nel container viene eseguito con UID non-root `999`.

## Segreti

- `.env` è escluso da Git.
- `.dockerignore` impedisce di copiare `.env` dentro l'immagine.
- Il Dockerfile non contiene né copia file di configurazione segreti.
- I segreti devono essere forniti al container soltanto a runtime.

## Container NestJS

- L'immagine usa un build multi-stage.
- Il runtime contiene soltanto dipendenze di produzione, build e file pubblici.
- Il processo applicativo viene eseguito esplicitamente come utente `node`.

## Backup

- `bourmet-backup.timer` crea ogni giorno un dump compresso.
- I backup hanno permessi privati, sono esclusi da Git e vengono conservati per
  14 giorni.
- Stato e ripristino sono descritti in `BACKUP.md`.

## Dipendenze

Eseguire regolarmente:

```bash
cd server/nestjs
npm run security:audit
```

Un audit pulito non sostituisce gli aggiornamenti periodici e i test dopo ogni
aggiornamento.
