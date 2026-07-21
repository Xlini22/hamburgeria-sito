# Avvio containerizzato di Bourmet

Lo stack contiene:

- MySQL 8.4, accessibile dall'esterno soltanto su `127.0.0.1:3320`;
- API NestJS;
- sito pubblico e pannello `/admin`;
- volume persistente del database;
- volume persistente delle immagini caricate;
- healthcheck e riavvio automatico.

## Requisiti su Arch Linux

Installare Docker Compose e Buildx:

```bash
sudo pacman -S docker-compose docker-buildx
```

## Prima configurazione

Creare il file locale delle variabili:

```bash
cp .env.example .env
```

Sostituire tutti i valori dimostrativi in `.env`. Per generare i segreti JWT:

```bash
openssl rand -hex 64
openssl rand -hex 64
```

Le due stringhe devono essere diverse. `INITIAL_ADMIN_PASSWORD` viene usata
soltanto quando la tabella utenti è vuota; dopo il primo accesso va cambiata
dal pannello.

## Avvio

Prima di passare dallo stack precedente a Compose, eseguire un backup e
fermare i processi o container che occupano le porte `3000` e `3320`.

```bash
docker compose up -d --build
```

Indirizzi:

- sito: `http://localhost:3000/`
- menu: `http://localhost:3000/menu/menu.html`
- admin: `http://localhost:3000/admin/`
- API: `http://localhost:3000/api/menu`

## Controlli e arresto

```bash
docker compose ps
docker compose logs -f app
docker compose down
```

`docker compose down` conserva database e immagini. Non usare
`docker compose down -v` salvo quando si vuole eliminare definitivamente ogni
dato persistente.

## Aggiornamento sulla VPS

Il repository è installato in `/opt/hamburgeria-sito` e usa il branch
`int-nestjs`:

```bash
cd /opt/hamburgeria-sito
sudo git pull --ff-only origin int-nestjs
docker compose up -d --build app
docker compose ps
```

Se sono cambiati anche `compose.yaml` o i servizi, omettere `app` nell'ultimo
comando di avvio.

## Database esistente

Il contenuto di `database/` viene importato soltanto quando il volume MySQL è
vuoto. Per trasferire l'attuale database reale useremo invece un backup
completo e lo ripristineremo nel volume Compose prima del passaggio definitivo.
