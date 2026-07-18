# scaricare l'immagine
docker pull mysql:8.4

- in alternativa se eseguo docker run e l'immagine non l'ho già scaricata, me la scarica automaticamente

# Creare il volume
docker volume create vol_dbfsan

# Container MySQL
docker run -d --name dbfsan -p 127.0.0.1:3335:3306 \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=db_dbfsan \
  -v vol_dbfsan/var/lib/mysql \
  mysql:8.4