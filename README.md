# Sistema de Parqueadero — Microservicios Distribuidos

Proyecto de la materia **Aplicaciones Distribuidas** (ESPE). Sistema de gestión de parqueadero compuesto por 5 microservicios independientes, un API Gateway (Kong) y un frontend en React.

**Autores:** Wilmer Buestan, Germán Cáceres, Jefferson Masapanta

---

## 1. Arquitectura del sistema

```
                         ┌─────────────────────┐
                         │   Frontend React    │
                         │  (localhost:5173)    │
                         └──────────┬───────────┘
                                    │ fetch
                                    ▼
                         ┌─────────────────────┐
                         │   Kong API Gateway   │
                         │  (localhost:8000)     │
                         └──────────┬───────────┘
                                    │
        ┌──────────────┬───────────┼───────────┬──────────────┬───────────────────────┐
        ▼              ▼           ▼           ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐
│   personas   │ │  vehiculos   │ │    zonas     │ │   tickets    │ │ asignacion-trazabi-  │
│  (NestJS)    │ │  (NestJS)    │ │ (Spring Boot)│ │  (NestJS)    │ │ lidad (NestJS)       │
│  puerto 3001 │ │  puerto 3002 │ │  puerto 3003 │ │  puerto 3004 │ │  puerto 3005         │
└──────────────┘ └──────────────┘ └──────────────┘ └──────┬───────┘ └──────────┬───────────┘
                                                            │                    │
                                          tickets llama      │   asignacion llama a personas
                                          directo a los 3    │   y vehiculos para validar
                                          para orquestar      └──────────────────────────────
                                          la emisión de tickets
```

**Qué hace cada parte:**

- **personas-service**: gestión de personas y usuarios. Búsqueda por cédula, username, apellido.
- **vehiculos-service**: gestión de vehículos (Auto, Camioneta, Motocicleta). Búsqueda por placa, disponibilidad.
- **zonas-service**: gestión de zonas de parqueo y sus espacios individuales (cada espacio tiene su propio estado: LIBRE, OCUPADO, RESERVADO, MANTENIMIENTO).
- **tickets-service**: el orquestador. Al emitir un ticket de entrada, valida la persona, el vehículo y la zona contra los otros 3 servicios, asigna un espacio libre específico, y guarda el ticket.
- **asignacion-trazabilidad**: gestiona la relación propietario-vehículo (quién es dueño de qué auto). Registra automáticamente un log de auditoría (CREACION / MODIFICACION / ELIMINACION) usando un TypeORM EventSubscriber desacoplado del servicio. Incluye consulta de flota completa por usuario vía llamada batch a vehiculos-service.
- **Kong**: único punto de entrada externo. El frontend solo conoce la URL de Kong, nunca los puertos individuales de cada microservicio.
- **Frontend React**: interfaz para emitir tickets, buscar personas/vehículos, ver zonas, y un dashboard de tickets activos.

---

## 2. Prerrequisitos (instalar antes de clonar)

Necesitas 5 herramientas: **Node.js**, **Java 21**, **PostgreSQL**, **Docker** y **Git**.

### 2.1 Node.js (v20 o superior)

**Windows:**
1. Descarga el instalador desde https://nodejs.org (elige la versión **LTS**).
2. Ejecuta el instalador, deja todas las opciones por defecto.
3. Verifica abriendo PowerShell o CMD:
   ```
   node -v
   npm -v
   ```

**Mac:**
```bash
brew install node
```
(Si no tienes Homebrew, instálalo primero desde https://brew.sh)

**Linux (Ubuntu/Zorin/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verifica en cualquier sistema:
```bash
node -v   # debe mostrar v20.x.x o superior
npm -v
```

### 2.2 Java 21 (JDK)

**Windows:**
1. Descarga el JDK 21 desde https://adoptium.net/temurin/releases/?version=21
2. Ejecuta el instalador `.msi`, marca la opción "Set JAVA_HOME variable" si aparece.
3. Verifica en CMD:
   ```
   java -version
   ```

**Mac:**
```bash
brew install openjdk@21
echo 'export PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Linux:**
```bash
sudo apt install openjdk-21-jdk
```

Verifica en cualquier sistema:
```bash
java -version   # debe mostrar version "21.x.x"
```

### 2.3 PostgreSQL

**Windows:**
1. Descarga el instalador desde https://www.postgresql.org/download/windows/
2. Durante la instalación, vas a definir una contraseña para el usuario `postgres` — **anótala**, la vas a necesitar.
3. Deja el puerto por defecto (5432).

**Mac:**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Linux:**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

En Linux, después de instalar, define una contraseña para el usuario `postgres`:
```bash
sudo -u postgres psql
ALTER USER postgres PASSWORD 'admin123';
\q
```

> **Importante:** este proyecto usa `admin123` como contraseña en los archivos de configuración de ejemplo (`.env`, `application.yaml`). Si usas una contraseña distinta, vas a tener que ajustarla en cada servicio (ver sección 4).

### 2.4 Docker

**Windows:** instala **Docker Desktop** desde https://www.docker.com/products/docker-desktop — requiere WSL2 activado (el instalador te guía si no lo tienes).

**Mac:** instala **Docker Desktop** desde el mismo link de arriba (hay versión para Apple Silicon e Intel).

**Linux:**
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```
Cierra sesión y vuelve a entrar para que el cambio de grupo tome efecto.

**Verificación universal**, en cualquier sistema, abre Docker Desktop (o en Linux confirma que el servicio esté activo) y corre:
```bash
docker ps
```
Si no da error de conexión, Docker está listo.

> ⚠️ **Docker Desktop debe estar ABIERTO y corriendo** cada vez que quieras usar Kong. No es un servicio que se inicia solo en segundo plano en todos los sistemas — ábrelo manualmente antes de levantar el proyecto.

### 2.5 Git

**Windows:** descarga desde https://git-scm.com/download/win

**Mac:** ya viene instalado, o `brew install git`

**Linux:** `sudo apt install git`

---

## 3. Clonar el proyecto

```bash
git clone https://github.com/WilmerBuestan/Parking_distribuidos.git
cd Parking_distribuidos
```

La estructura que vas a ver:

```
Parking_distribuidos/
├── backend-personas/          (NestJS, puerto 3001)
├── vehiculos/                  (NestJS, puerto 3002)
├── zonas/                      (Spring Boot, puerto 3003)
├── tickets-service/            (NestJS, puerto 3004)
├── asignacion-trazabilidad/    (NestJS, puerto 3005 — propietario-vehículo + auditoría)
├── kong/                       (configuración del API Gateway)
├── frontend/                   (React + Vite + Tailwind)
└── levantar-sistema.sh         (script de arranque automático, solo Linux/Mac)
```

---

## 4. Configuración inicial (una sola vez)

### 4.1 Crear las 4 bases de datos

Conéctate a PostgreSQL y crea las bases de datos que necesita cada servicio:

```bash
psql -U postgres
```
(te va a pedir la contraseña que definiste en el paso 2.3)

Dentro de `psql`, ejecuta:
```sql
CREATE DATABASE db_personas;
CREATE DATABASE gestion_vehiculos;
CREATE DATABASE zonas_db;
CREATE DATABASE db_tickets;
CREATE DATABASE db_asignaciones;
\q
```

> Si en tu proyecto local las bases ya tienen otros nombres, ajusta los `.env` de cada servicio para que coincidan (ver siguiente paso).

### 4.2 Crear los archivos `.env`

Cada servicio NestJS necesita su propio archivo `.env` en su carpeta raíz. **Estos archivos NO se suben a Git** (están en `.gitignore` por seguridad), así que cada quien debe crear el suyo.

**`backend-personas/.env`:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_USUARIO=postgres
DB_CONTRASENA=admin123
DB_NOMBRE=db_personas
PORT=3001
```

**`vehiculos/.env`:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_USUARIO=postgres
DB_CONTRASENA=admin123
DB_NOMBRE=gestion_vehiculos
PORT=3002
```

**`tickets-service/.env`:**
```env
PORT=3004

DB_HOST=localhost
DB_PORT=5432
DB_USUARIO=postgres
DB_CONTRASENA=admin123
DB_NOMBRE=db_tickets

PERSONAS_SERVICE_URL=http://localhost:3001
VEHICULOS_SERVICE_URL=http://localhost:3002
ZONAS_SERVICE_URL=http://localhost:3003
```

**`asignacion-trazabilidad/.env`:**
```env
PORT=3005

DB_HOST=localhost
DB_PORT=5432
DB_USUARIO=postgres
DB_CONTRASENA=admin123
DB_NOMBRE=db_asignaciones

PERSONAS_SERVICE_URL=http://localhost:3001
VEHICULOS_SERVICE_URL=http://localhost:3002
```

> Reemplaza `admin123` por la contraseña real que configuraste en PostgreSQL si es distinta.

### 4.3 Configurar zonas (Spring Boot)

`zonas` no usa `.env`, usa un archivo YAML que **sí está en el repositorio** (`zonas/src/main/resources/application.yaml`). Revísalo y ajusta usuario/contraseña si los tuyos son distintos a los de ejemplo:

```yaml
server:
  port: 3003

spring:
  application:
    name: zonas-api
  datasource:
    url: jdbc:postgresql://localhost:5432/zonas_db
    username: postgres
    password: admin123
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
```

### 4.4 Instalar dependencias de cada servicio

Desde la raíz del proyecto:

```bash
cd backend-personas && npm install && cd ..
cd vehiculos && npm install && cd ..
cd tickets-service && npm install && cd ..
cd asignacion-trazabilidad && npm install && cd ..
cd frontend && npm install && cd ..
```

`zonas` no necesita este paso — Gradle descarga sus dependencias automáticamente la primera vez que lo ejecutes (siguiente sección).

---

## 5. Levantar el sistema completo

Tienes dos formas: **automática** (recomendada, solo Linux/Mac) o **manual** (los 3 sistemas).

### 5.1 Opción A — Script automático (Linux/Mac)

1. Abre **Docker Desktop** manualmente y espera a que esté listo.
2. Da permisos de ejecución la primera vez:
   ```bash
   chmod +x levantar-sistema.sh
   ```
3. Ejecuta:
   ```bash
   ./levantar-sistema.sh
   ```

El script levanta los 4 microservicios y Kong en orden, esperando a que cada uno responda antes de continuar al siguiente. Si Docker no está abierto, te lo va a decir de inmediato en vez de fallar a medias.

> En Windows, este script no es compatible directamente (es bash). Usa la Opción B.

### 5.2 Opción B — Manual (cualquier sistema operativo)

Necesitas **5 terminales abiertas simultáneamente** (una por cada servicio + Kong), o una terminal por pestañas.

**Terminal 1 — personas:**
```bash
cd backend-personas
npm run start
```
Espera a ver `Nest application successfully started`.

**Terminal 2 — vehiculos:**
```bash
cd vehiculos
npm run start
```

**Terminal 3 — zonas:**

Linux/Mac:
```bash
cd zonas
./gradlew bootRun
```

Windows (usa `gradlew.bat`, no `gradlew`):
```cmd
cd zonas
gradlew.bat bootRun
```
La primera vez tarda más porque descarga dependencias de Gradle. Espera a ver `Started ZonasApplication`.

**Terminal 4 — tickets-service:**
```bash
cd tickets-service
npm run start
```

**Terminal 5 — asignacion-trazabilidad:**
```bash
cd asignacion-trazabilidad
npm run start
```
Espera a ver `Nest application successfully started`.

**Terminal 6 — Kong (requiere Docker Desktop abierto):**
```bash
cd kong
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
  kong:latest
```

**En Windows (PowerShell o CMD), usa este comando en una sola línea** (Windows no interpreta bien el `\` para continuar línea como Linux/Mac):
```cmd
docker run -d --name kong-dbless --add-host=host.docker.internal:host-gateway -v "%cd%/kong.yml:/kong/declarative/kong.yml" -e "KONG_DATABASE=off" -e "KONG_DECLARATIVE_CONFIG=/kong/declarative/kong.yml" -e "KONG_ADMIN_LISTEN=0.0.0.0:8001" -p 8000:8000 -p 8001:8001 kong:latest
```

### 5.3 Levantar el frontend

En una terminal adicional:
```bash
cd frontend
npm run dev
```

Abre el navegador en **http://localhost:5173**

---

## 6. Verificar que todo funciona

### 6.1 Revisar cada servicio individualmente

| Servicio | URL de verificación |
|---|---|
| personas | http://localhost:3001/personas |
| vehiculos | http://localhost:3002/vehiculos |
| zonas | http://localhost:3003/zonas |
| tickets-service | http://localhost:3004/tickets/activos |
| asignacion-trazabilidad | http://localhost:3005/asignaciones |

Cada una debería devolver un JSON (puede estar vacío `[]` si no hay datos aún, eso es normal).

### 6.2 Revisar la documentación interactiva (Swagger)

| Servicio | URL de Swagger |
|---|---|
| personas | http://localhost:3001/api/docs |
| vehiculos | http://localhost:3002/api/docs |
| zonas | http://localhost:3003/swagger-ui.html |
| tickets-service | http://localhost:3004/api/docs |
| asignacion-trazabilidad | http://localhost:3005/api/docs |

### 6.3 Revisar Kong

```bash
curl http://localhost:8000/api/personas
```
Debería devolver lo mismo que el puerto 3001 directo, pero pasando por Kong.

### 6.4 Revisar el frontend

Abre http://localhost:5173 — deberías ver el dashboard completo: formulario de emisión de ticket, búsqueda de persona, búsqueda de vehículo, tickets activos, y listado de zonas.

---

## 7. Problemas comunes (troubleshooting)

### "EADDRINUSE: address already in use"
Algún servicio quedó corriendo de una sesión anterior. Libera el puerto:

**Linux/Mac:**
```bash
lsof -i :3001        # reemplaza 3001 por el puerto que falle
kill -9 <PID>
```

**Windows:**
```cmd
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### "Cannot connect to the Docker daemon"
Docker Desktop no está abierto. Ábrelo manualmente y espera unos 20-30 segundos antes de reintentar.

### Errores de CORS en la consola del navegador
Kong necesita el plugin CORS configurado en `kong/kong.yml` (ya viene incluido en este repo). Si lo modificaste, reinicia el contenedor:
```bash
docker restart kong-dbless
```

### El contenedor Kong ya existe (conflicto de nombre)
Si ya creaste `kong-dbless` antes y solo necesitas volver a levantarlo:
```bash
docker start kong-dbless
```
En vez de volver a correr `docker run` (que falla si el nombre ya existe).

### Kong no puede comunicarse con los microservicios (Linux específicamente)
En algunas configuraciones de Linux con firewall activo, el tráfico de Docker hacia el host puede bloquearse. Si Kong da timeout en todas las rutas:
```bash
sudo iptables -I DOCKER-USER -s 172.17.0.0/16 -d 172.17.0.1 -p tcp -m multiport --dports 3001,3002,3003,3004 -j ACCEPT
```
(Esta regla no es permanente, se pierde al reiniciar la máquina — hay que repetirla cada vez si ocurre, o configurarla en un script de inicio del sistema.)

### Spring Boot (zonas) no compila / springdoc falla
Este proyecto usa Spring Boot 4.x, que requiere específicamente `springdoc-openapi-starter-webmvc-ui` versión **3.0.3 o superior** (versiones 2.x son para Spring Boot 3 y no son compatibles). Ya está fijado en `build.gradle`, no debería requerir cambios.

---

## 8. Flujo de prueba sugerido

Para confirmar que todo el sistema funciona de extremo a extremo, en este orden:

1. Crea una persona desde `POST /personas` (puedes usar Swagger UI directamente, botón "Try it out").
2. Crea un vehículo desde `POST /vehiculos`.
3. Verifica que exista al menos una zona con espacios `LIBRE` desde `GET /zonas`.
4. Desde el frontend (`localhost:5173`), llena el formulario "Emitir ticket de entrada" con la cédula y placa que creaste, elige una zona, y emite el ticket.
5. Verifica en el dashboard "Tickets activos" que aparezca.
6. Dale click a "Registrar salida" y confirma que el ticket se cierre con tarifa calculada.

---

## 9. Apagar el sistema

Para detener todo:

```bash
# Detener los procesos de Node (Ctrl+C en cada terminal, o):
# Linux/Mac:
lsof -ti:3001,3002,3004 | xargs kill -9

# Detener zonas (Ctrl+C en su terminal)

# Detener Kong (se mantiene creado, solo se detiene):
docker stop kong-dbless
```