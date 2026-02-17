#!/bin/bash

# Wait for MySQL to be ready
until mysqladmin ping -h"$DB_HOST" -P"$DB_PORT" --silent; do
    echo "Waiting for MySQL to be ready..."
    sleep 2
done

# Execute SQL scripts
mysql -u root -p"$MYSQL_ROOT_PASSWORD" < /docker-entrypoint-initdb.d/online-init.sql
mysql -u root -p"$MYSQL_ROOT_PASSWORD" < /docker-entrypoint-initdb.d/local-init.sql
