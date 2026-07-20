# Database Bourmet

Questa cartella contiene la baseline necessaria per inizializzare un database
vuoto.

## File

- `001-current-schema.sql`: struttura completa e aggiornata del database.
- `002-current-seed.sql`: categorie, prodotti, ingredienti, allergeni, immagini
  e relative associazioni.

Il seed non contiene utenti, password, sessioni di autenticazione, cronologia
amministrativa o log. Il primo amministratore deve essere creato separatamente
durante l'installazione.

## Inizializzazione

Eseguire prima lo schema e poi il seed con un account MySQL autorizzato a
creare tabelle:

```bash
mysql -u root -p hamburgeria < server/nestjs/database/001-current-schema.sql
mysql -u root -p hamburgeria < server/nestjs/database/002-current-seed.sql
```

NestJS deve invece collegarsi con l'utente dedicato `bourmet_app`, limitato ai
privilegi `SELECT`, `INSERT`, `UPDATE` e `DELETE`.

## Migrazioni future

Le prossime modifiche strutturali partiranno da `003-...sql`. Ogni migrazione
applicata non deve essere modificata retroattivamente.
