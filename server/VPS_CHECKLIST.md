# Checklist futura VPS

## Percorso del progetto

Il repository è installato sulla VPS in:

```text
/opt/hamburgeria-sito
```

Per aggiornare normalmente codice, sito e container applicativo:

```bash
cd /opt/hamburgeria-sito
sudo git pull --ff-only origin int-nestjs
docker compose up -d --build app
docker compose ps
```

Se un aggiornamento modifica anche `compose.yaml`, il database o altri servizi,
avviare invece tutto lo stack:

```bash
docker compose up -d --build
```

## Attivazione dell'archiviazione dei log amministrativi

Questa operazione **non è ancora stata eseguita**. Andrà effettuata sulla VPS
dopo aver installato il progetto.

Prima di procedere, impostare `WorkingDirectory` ed `ExecStart` usando il
percorso `/opt/hamburgeria-sito` nel file:

```text
server/systemd/bourmet-audit-archive.service
```

I due valori devono contenere il percorso assoluto nel quale verrà installato
il progetto sulla VPS, non il percorso usato sul computer di sviluppo.

Successivamente, dalla cartella principale del progetto, eseguire:

```bash
sudo install -m 0644 server/systemd/bourmet-audit-archive.service /etc/systemd/system/
sudo install -m 0644 server/systemd/bourmet-audit-archive.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now bourmet-audit-archive.timer
```

Verificare infine che il timer sia attivo:

```bash
systemctl list-timers bourmet-audit-archive.timer
```

Per controllare l'ultima esecuzione e gli eventuali errori:

```bash
systemctl status bourmet-audit-archive.timer
journalctl -u bourmet-audit-archive.service
```
