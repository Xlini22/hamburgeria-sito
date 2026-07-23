# Database Bourmet

Questa cartella contiene la baseline necessaria per inizializzare un database
vuoto.

## File

- `001-current-schema.sql`: struttura completa e aggiornata del database.
- `002-current-seed.sql`: categorie, prodotti, ingredienti, allergeni, immagini
  e relative associazioni.
- `003-table-sessions.sql`: migrazione per tavoli, sessioni attive e accessi
  guest tramite QR permanente.
- `004-guest-cart.sql`: carrelli dei singoli ospiti collegati alle sessioni
  dei tavoli.
- `005-table-orders.sql`: stato pronto degli ospiti, invio atomico degli
  ordini aggregati, preferenze e storico degli ordini del tavolo.

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

Su un database esistente applicare la migrazione dei tavoli una sola volta:

```bash
docker compose exec -T database sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' < server/nestjs/database/003-table-sessions.sql
docker compose exec -T database sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' < server/nestjs/database/004-guest-cart.sql
docker compose exec -T database sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' < server/nestjs/database/005-table-orders.sql
```
