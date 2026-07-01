# 🚀 GUÍA DE SETUP - AMBIENTE LOCAL

## 📋 Requisitos Previos

- **Node.js** 16+ (verificar: `node -v`)
- **npm** 8+ (verificar: `npm -v`)
- **PostgreSQL** 12+ (verificar: `psql --version`)
- **Git** (verificar: `git --version`)

---

## 🔧 Instalación Paso a Paso

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/WilmerBuestan/Parking_distribuidos.git
cd Parking_distribuidos
```

### Paso 2: Configurar variables de entorno

Para **cada servicio**, copiar `.env.example` a `.env`:

```bash
# Backend Personas
cp backend-personas/.env.example backend-personas/.env

# Tickets Service
cp tickets-service/.env.example tickets-service/.env

# Vehiculos
cp vehiculos/.env.example vehiculos/.env

# Zonas
cp zonas/.env.example zonas/.env

# Asignación-Trazabilidad
cp asignacion-trazabilidad/.env.example asignacion-trazabilidad/.env
```

### Paso 3: Personalizar .env si es necesario

Si tu PostgreSQL tiene **diferente usuario/contraseña**, edita:

```bash
# Ejemplo: cambiar credenciales
nano backend-personas/.env

# Editar:
DB_USUARIO=tu_usuario
DB_CONTRASENA=tu_contrasena
```

**IMPORTANTE:** El JWT_SECRET debe ser **IGUAL** en todos los servicios.

### Paso 4: Crear bases de datos PostgreSQL

```bash
# Conectar a PostgreSQL
psql -U postgres

# En la consola psql:
CREATE DATABASE db_personas;
CREATE DATABASE db_tickets;
CREATE DATABASE gestion_vehiculos;
CREATE DATABASE db_zonas;
CREATE DATABASE db_asignaciones;

# Verificar
\l

# Salir
\q
```

### Paso 5: Instalar dependencias en cada servicio

```bash
# Backend Personas
cd backend-personas
npm install
cd ..

# Tickets Service
cd tickets-service
npm install
cd ..

# Vehiculos
cd vehiculos
npm install
cd ..

# Zonas
cd zonas
npm install
cd ..

# Asignación
cd asignacion-trazabilidad
npm install
cd ..
```

### Paso 6: Arrancar todos los servicios

**Opción A: Script automatizado**
```bash
./levantar-sistema.sh
```

**Opción B: Terminales separadas**

En 5 terminales diferentes:

```bash
# Terminal 1 - Backend Personas
cd backend-personas && npm run start

# Terminal 2 - Tickets Service
cd tickets-service && npm run start

# Terminal 3 - Vehiculos
cd vehiculos && npm run start

# Terminal 4 - Zonas
cd zonas && npm run start

# Terminal 5 - Asignación
cd asignacion-trazabilidad && npm run start
```

### Paso 7: Verificar que están corriendo

```bash
# En el navegador o terminal:
curl http://localhost:3001/api/docs
curl http://localhost:3004/api/docs
curl http://localhost:3002/api/docs
curl http://localhost:3003/api/docs
curl http://localhost:3005/api/docs

# Deberías ver documentación Swagger en cada uno
```

---

## 🎯 Puertos de Servicios

| Servicio | Puerto | Swagger |
|----------|--------|---------|
| Backend Personas | 3001 | http://localhost:3001/api/docs |
| Vehiculos | 3002 | http://localhost:3002/api/docs |
| Zonas | 3003 | http://localhost:3003/api/docs |
| Tickets Service | 3004 | http://localhost:3004/api/docs |
| Asignación | 3005 | http://localhost:3005/api/docs |

---

## 📦 Variables de Entorno

### backend-personas/.env

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USUARIO=postgres
DB_CONTRASENA=admin123
DB_NOMBRE=db_personas
JWT_SECRET=cambia-esto-en-produccion
JWT_ACCESS_EXPIRES_IN=20m
JWT_REFRESH_EXPIRES_IN=7d
VEHICULOS_SERVICE_URL=http://localhost:3002
ASIGNACIONES_SERVICE_URL=http://localhost:3005
```

### tickets-service/.env

```env
PORT=3004
DB_HOST=localhost
DB_PORT=5432
DB_USUARIO=postgres
DB_CONTRASENA=admin123
DB_NOMBRE=db_tickets
JWT_SECRET=cambia-esto-en-produccion
PERSONAS_SERVICE_URL=http://localhost:3001
VEHICULOS_SERVICE_URL=http://localhost:3002
ZONAS_SERVICE_URL=http://localhost:3003
```

### vehiculos/.env

```env
PORT=3002
DB_HOST=localhost
DB_PORT=5432
DB_USUARIO=postgres
DB_CONTRASENA=admin123
DB_NOMBRE=gestion_vehiculos
JWT_SECRET=cambia-esto-en-produccion
PERSONAS_SERVICE_URL=http://localhost:3001
```

### zonas/.env

```env
PORT=3003
DB_HOST=localhost
DB_PORT=5432
DB_USUARIO=postgres
DB_CONTRASENA=admin123
DB_NOMBRE=db_zonas
JWT_SECRET=cambia-esto-en-produccion
PERSONAS_SERVICE_URL=http://localhost:3001
```

### asignacion-trazabilidad/.env

```env
PORT=3005
DB_HOST=localhost
DB_PORT=5432
DB_USUARIO=postgres
DB_CONTRASENA=admin123
DB_NOMBRE=db_asignaciones
JWT_SECRET=cambia-esto-en-produccion
PERSONAS_SERVICE_URL=http://localhost:3001
VEHICULOS_SERVICE_URL=http://localhost:3002
```

---

## 🧪 Probar la API

### Opción 1: Con Postman (Recomendado)

```bash
# Importar colección
# Ver: Parqueadero-Tickets-Auth-Collection.postman_collection.json
# En: ~/.copilot/session-state/144dd260-9aa8-4c62-bd51-6ed9e2e8f240/files/
```

### Opción 2: Con cURL

```bash
# Registrar usuario
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Admin",
    "apellido": "Sistema",
    "cedula": "9999999999",
    "email": "admin@test.com",
    "username": "admin",
    "password": "Admin123!",
    "roles": ["ADMIN"]
  }'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin123!"
  }'

# Ver documentación
curl http://localhost:3001/api/docs
```

---

## 🆘 Troubleshooting

### Error: "ENOENT: no such file or directory, open '.env'"

```
→ Falta el archivo .env
→ Solución: cp .env.example .env
```

### Error: "connect ECONNREFUSED 127.0.0.1:5432"

```
→ PostgreSQL no está corriendo
→ Solución en Linux:
   sudo systemctl start postgresql
→ Solución en Mac:
   brew services start postgresql
→ Solución en Windows:
   Abrir Services y buscar "PostgreSQL"
```

### Error: "database does not exist"

```
→ Las bases de datos no fueron creadas
→ Solución:
   psql -U postgres
   CREATE DATABASE db_personas;
   CREATE DATABASE db_tickets;
   (etc...)
```

### Error: "JWT_SECRET is not defined"

```
→ La variable no está en .env
→ Solución: Agregar a cada .env:
   JWT_SECRET=cambia-esto-en-produccion
```

### Puerto 3001/3002/etc en uso

```
→ Otro proceso usa el puerto
→ Solución en Linux/Mac:
   lsof -i :3001
   kill -9 <PID>
→ Solución en Windows:
   netstat -ano | findstr :3001
   taskkill /PID <PID> /F
```

### Error: "Cannot find module '@nestjs/common'"

```
→ Dependencias no instaladas
→ Solución:
   npm install
```

---

## 📊 Verificación Final

```bash
# Verificar servicios corriendo
for port in 3001 3002 3003 3004 3005; do
  curl -s http://localhost:$port/api/docs > /dev/null && echo "✅ Puerto $port OK" || echo "❌ Puerto $port FALLO"
done

# Debe mostrar 5 ✅
```

---

## 🔐 Seguridad

**IMPORTANTE:** Leer `SEGURIDAD_Y_CONFIGURACION.md` para:
- Por qué usar .env
- Cómo NO hardcodear credenciales
- Cómo generar JWT_SECRET seguro
- Diferencias entre ambientes (Local, Staging, Producción)

---

## 📚 Documentación

- **Guía de Pruebas:** `GUIA_PRUEBAS_POSTMAN.md`
- **Checklist Rápido:** `GUIA_RAPIDA_PASO_A_PASO.md`
- **Seguridad:** `SEGURIDAD_Y_CONFIGURACION.md`
- **Cambios Tickets:** `CAMBIOS_TICKETS.md`
- **Auth Fase E:** `FASE_E_AUTH_GUARDS.md`

---

## 🎓 Próximos Pasos

1. Leer `SEGURIDAD_Y_CONFIGURACION.md` (importante)
2. Ejecutar `GUIA_RAPIDA_PASO_A_PASO.md` para probar
3. Revisar documentación Swagger en http://localhost:3001/api/docs
4. Leer código en carpetas `src/` de cada servicio

---

## 🤝 Soporte

Si tienes problemas:
1. Revisar la sección "Troubleshooting" arriba
2. Ver logs en terminal (npm run start)
3. Consultar documentación en `*.md` archivos

**Versión:** 1.0  
**Última actualización:** 2026-07-01
