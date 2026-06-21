#!/bin/bash

# ============================================================
# Script de arranque automático - Sistema de Parqueadero
# Levanta: personas (3001), vehiculos (3002), zonas (3003),
#          tickets-service (3004) y Kong (8000/8001)
# ============================================================

set -e  # Detener el script si algún comando falla de forma inesperada

BASE_DIR="$HOME/Escritorio/VII ESPE/Distribuidas/Uni2/Parqueadero"
LOG_DIR="$BASE_DIR/logs"
mkdir -p "$LOG_DIR"

# Colores para que la salida sea legible
VERDE='\033[0;32m'
ROJO='\033[0;31m'
AMARILLO='\033[1;33m'
NC='\033[0m' # Sin color

echo -e "${AMARILLO}=== Sistema de Parqueadero: arranque automático ===${NC}"
echo ""

# ------------------------------------------------------------
# Verificación temprana: Docker Desktop debe estar corriendo,
# si no, avisamos de inmediato en vez de descubrirlo al final.
# ------------------------------------------------------------
if ! docker ps > /dev/null 2>&1; then
  echo -e "${ROJO}Docker no está corriendo. Abre Docker Desktop manualmente, espera a que inicie,${NC}"
  echo -e "${ROJO}y vuelve a correr este script.${NC}"
  exit 1
fi

# ------------------------------------------------------------
# 0. Limpieza previa: matar procesos zombie en los puertos clave
#    y eliminar cualquier contenedor Kong anterior
# ------------------------------------------------------------
echo -e "${AMARILLO}[0/6] Limpiando puertos y contenedores previos...${NC}"

for puerto in 3001 3002 3003 3004; do
  PID=$(sudo ss -tlnp 2>/dev/null | grep ":${puerto} " | grep -oP 'pid=\K[0-9]+' | head -1)
  if [ -n "$PID" ]; then
    echo "  Puerto $puerto ocupado por PID $PID, liberando..."
    sudo kill -9 "$PID" 2>/dev/null || true
  fi
done

# Nota: NO se eliminan los puertos 8000/8001 ni el contenedor kong-dbless aquí.
# El paso 6 reinicia (docker start) el contenedor existente si ya está creado,
# en vez de recrearlo desde cero cada vez.

echo -e "${VERDE}  Limpieza completa.${NC}"
echo ""

# ------------------------------------------------------------
# Función auxiliar: espera hasta que un puerto responda HTTP,
# o se agote el tiempo máximo de espera (en segundos)
# ------------------------------------------------------------
esperar_puerto() {
  local puerto=$1
  local nombre=$2
  local intentos=0
  local max_intentos=30  # 30 x 1s = 30 segundos máximo

  while [ $intentos -lt $max_intentos ]; do
    if curl -s -o /dev/null -m 2 "http://localhost:${puerto}" 2>/dev/null; then
      echo -e "${VERDE}  ${nombre} respondiendo en puerto ${puerto}${NC}"
      return 0
    fi
    sleep 1
    intentos=$((intentos + 1))
  done

  echo -e "${ROJO}  ${nombre} NO respondió en puerto ${puerto} tras ${max_intentos}s. Revisa el log: ${LOG_DIR}/${nombre}.log${NC}"
  return 1
}

# ------------------------------------------------------------
# 1. backend-personas (3001)
# ------------------------------------------------------------
echo -e "${AMARILLO}[1/6] Levantando backend-personas (puerto 3001)...${NC}"
cd "$BASE_DIR/backend-personas"
nohup npm run start > "$LOG_DIR/personas.log" 2>&1 &
esperar_puerto 3001 "personas"
echo ""

# ------------------------------------------------------------
# 2. vehiculos (3002)
# ------------------------------------------------------------
echo -e "${AMARILLO}[2/6] Levantando vehiculos (puerto 3002)...${NC}"
cd "$BASE_DIR/vehiculos"
nohup npm run start > "$LOG_DIR/vehiculos.log" 2>&1 &
esperar_puerto 3002 "vehiculos"
echo ""

# ------------------------------------------------------------
# 3. zonas (3003) - Spring Boot, tarda más en levantar
# ------------------------------------------------------------
echo -e "${AMARILLO}[3/6] Levantando zonas (puerto 3003, Spring Boot, puede tardar ~10-15s)...${NC}"
cd "$BASE_DIR/zonas"
nohup ./gradlew bootRun > "$LOG_DIR/zonas.log" 2>&1 &
esperar_puerto 3003 "zonas"
echo ""

# ------------------------------------------------------------
# 4. tickets-service (3004)
# ------------------------------------------------------------
echo -e "${AMARILLO}[4/6] Levantando tickets-service (puerto 3004)...${NC}"
cd "$BASE_DIR/tickets-service"
nohup npm run start > "$LOG_DIR/tickets.log" 2>&1 &
esperar_puerto 3004 "tickets-service"
echo ""

# ------------------------------------------------------------
# 5. Regla de iptables necesaria para que Kong (Docker) alcance
#    a los microservicios del host
# ------------------------------------------------------------
echo -e "${AMARILLO}[5/6] Aplicando regla de red Docker -> host...${NC}"
sudo iptables -C DOCKER-USER -s 172.17.0.0/16 -d 172.17.0.1 -p tcp -m multiport --dports 3001,3002,3003,3004 -j ACCEPT 2>/dev/null \
  || sudo iptables -I DOCKER-USER -s 172.17.0.0/16 -d 172.17.0.1 -p tcp -m multiport --dports 3001,3002,3003,3004 -j ACCEPT
echo -e "${VERDE}  Regla aplicada.${NC}"
echo ""

# ------------------------------------------------------------
# 6. Kong (8000 proxy / 8001 admin)
# ------------------------------------------------------------
echo -e "${AMARILLO}[6/6] Levantando Kong (DB-less)...${NC}"
cd "$BASE_DIR/kong"

if docker ps -a --format '{{.Names}}' | grep -q '^kong-dbless$'; then
  echo "  El contenedor kong-dbless ya existe, reiniciándolo..."
  docker start kong-dbless > /dev/null
else
  echo "  Creando contenedor kong-dbless..."
  docker run -d --name kong-dbless \
    --add-host=host.docker.internal:host-gateway \
    -v "$(pwd)/kong.yml:/kong/declarative/kong.yml" \
    -e "KONG_DATABASE=off" \
    -e "KONG_DECLARATIVE_CONFIG=/kong/declarative/kong.yml" \
    -e "KONG_PROXY_ACCESS_LOG=/dev/stdout" \
    -e "KONG_ADMIN_ACCESS_LOG=/dev/stdout" \
    -e "KONG_PROXY_ERROR_LOG=/dev/stderr" \
    -e "KONG_ADMIN_ERROR_LOG=/dev/stderr" \
    -e "KONG_ADMIN_LISTEN=0.0.0.0:8001" \
    -p 8000:8000 \
    -p 8001:8001 \
    kong:latest > "$LOG_DIR/kong-docker.log" 2>&1
fi

esperar_puerto 8001 "kong-admin"
echo ""

# ------------------------------------------------------------
# Resumen final
# ------------------------------------------------------------
echo -e "${AMARILLO}=== Resumen ===${NC}"
echo "  Personas:         http://localhost:3001  (vía Kong: http://localhost:8000/api/personas)"
echo "  Vehiculos:        http://localhost:3002  (vía Kong: http://localhost:8000/api/vehiculos)"
echo "  Zonas:            http://localhost:3003  (vía Kong: http://localhost:8000/api/zonas)"
echo "  Tickets-service:  http://localhost:3004  (vía Kong: http://localhost:8000/api/tickets)"
echo "  Kong Admin API:   http://localhost:8001"
echo ""
echo "  Logs en: $LOG_DIR"
echo -e "${VERDE}Sistema arriba.${NC}"