# Fase E - Implementación de Auth Guards en Todos los Microservicios

## Descripción

Replicar la autenticación JWT y sistema de permisos (Fase B-D del backend-personas) en todos los microservicios:
- tickets-service
- vehiculos-service
- zonas-service
- asignacion-trazabilidad

Cada microservicio verifica el JWT localmente sin llamar a personas-service, manteniendo desacoplamiento.

## Componentes Replicados

### 1. JwtAuthGuard
**Archivo:** `src/auth/guards/jwt-auth.guard.ts`

```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate
```

**Responsabilidad:**
- Verifica presencia de token Bearer en Authorization header
- Valida firma del JWT contra JWT_SECRET (mismo en todos los servicios)
- Extrae payload y lo adjunta a `request.user`
- Permite endpoints públicos marcados con `@Public()`
- Lanza UnauthorizedException si token es inválido/expirado

**Uso:** Registrado como APP_GUARD global

### 2. PermisosGuard
**Archivo:** `src/auth/guards/permisos.guard.ts`

```typescript
@Injectable()
export class PermisosGuard implements CanActivate
```

**Responsabilidad:**
- Verifica permisos requeridos mediante decorador `@RequierePermiso()`
- Compara `request.user.permisos` con permisos requeridos
- Permite wildcard `*` (acceso total)
- Lanza ForbiddenException si permisos insuficientes

**Uso:** Registrado como APP_GUARD global

### 3. Decoradores

#### @RequierePermiso(...permisos)
```typescript
@RequierePermiso('tickets:emitir', 'tickets:cobrar')
metodo() { ... }
```

Define qué permisos son requeridos. El usuario necesita CUALQUIERA de los especificados (OR lógico).

#### @Public()
```typescript
@Public()
@Get('health')
health() { ... }
```

Marca endpoints que no requieren autenticación (health checks, status).

## Permisos por Módulo

### tickets-service
```
tickets:emitir   → Crear entrada, procesar salida, anular ticket
tickets:cobrar   → Procesar pago, ver tickets
```

**Roles con acceso:**
- CLIENTE: ninguno (solo sus propios tickets)
- RECAUDADOR: tickets:emitir, tickets:cobrar
- ADMIN: todos
- ROOT: todos

### vehiculos-service
```
vehiculos:ver_propios       → Ver propios vehículos (CLIENTE)
vehiculos:crear_propio      → Crear vehículo propio (CLIENTE)
vehiculos:gestionar         → CRUD total de vehículos (ADMIN)
```

**Roles con acceso:**
- CLIENTE: vehiculos:ver_propios, vehiculos:crear_propio
- ADMIN: vehiculos:gestionar
- ROOT: todos

### zonas-service
```
zonas:ver           → Ver zonas públicas
zonas:gestionar     → CRUD de zonas (ADMIN)
espacios:ver        → Ver estado de espacios
espacios:gestionar  → Cambiar estado de espacios (ADMIN)
```

**Roles con acceso:**
- CLIENTE: zonas:ver, espacios:ver
- ADMIN: zonas:gestionar, espacios:gestionar
- ROOT: todos

### asignacion-trazabilidad
```
asignaciones:gestionar  → Crear/editar asignaciones
trazabilidad:ver        → Ver historial de movimientos
```

**Roles con acceso:**
- ADMIN: asignaciones:gestionar, trazabilidad:ver
- ROOT: todos

## Configuración en app.module.ts

### Importar JwtModule
```typescript
JwtModule.registerAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: { expiresIn: '15m' },
  }),
  inject: [ConfigService],
})
```

### Registrar Guards Globalmente
```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,
  },
  {
    provide: APP_GUARD,
    useClass: PermisosGuard,
  },
]
```

## Dependencias Requeridas

```json
{
  "dependencies": {
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^11.0.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1"
  }
}
```

## Estructura del Token JWT

Generado por backend-personas, verificado localmente en cada microservicio:

```json
{
  "userId": "uuid",
  "username": "user123",
  "roles": ["CLIENTE", "RECAUDADOR"],
  "permisos": [
    "tickets:emitir",
    "tickets:cobrar",
    "vehiculos:ver_propios",
    "vehiculos:crear_propio"
  ],
  "iat": 1625097600,
  "exp": 1625098500
}
```

## Variables de Entorno Requeridas

Mismo JWT_SECRET en todos los servicios:

```env
JWT_SECRET=your-super-secret-key-same-everywhere
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

## Ejemplo de Uso en Endpoints

### Endpoint Protegido
```typescript
@Patch('salida/:ticketId')
@RequierePermiso('tickets:emitir')
procesarSalida(@Param('ticketId') ticketId: string) {
  return this.ticketsService.procesarSalida(ticketId);
}
```

**Comportamiento:**
1. JwtAuthGuard valida token
2. PermisosGuard verifica `tickets:emitir` en request.user.permisos
3. Si pasa ambos, ejecuta método
4. Si falla, lanza excepción (401 o 403)

### Endpoint Público
```typescript
@Get('health')
@Public()
health() {
  return { status: 'ok' };
}
```

**Comportamiento:**
1. JwtAuthGuard detecta @Public() y permite acceso
2. No requiere token

## Manejo de Errores

### UnauthorizedException (401)
- Token no proporcionado
- Token inválido
- Token expirado

```json
{
  "statusCode": 401,
  "message": "Token inválido o expirado"
}
```

### ForbiddenException (403)
- Usuario autenticado pero sin permisos

```json
{
  "statusCode": 403,
  "message": "Se requieren permisos: tickets:emitir"
}
```

## Testing

### Test de Autenticación
```typescript
it('debe rechazar sin token', async () => {
  const resultado = await request(app.getHttpServer())
    .patch('/tickets/salida/123')
    .expect(401);
});

it('debe aceptar con token válido', async () => {
  const token = generarToken({ permisos: ['tickets:emitir'] });
  const resultado = await request(app.getHttpServer())
    .patch('/tickets/salida/123')
    .set('Authorization', `Bearer ${token}`)
    .expect(200);
});
```

## Ventajas del Diseño

1. **Desacoplado:** Cada microservicio verifica JWT localmente
2. **Escalable:** Fácil agregar nuevos microservicios
3. **Abierto a módulos futuros:** Permisos por módulo
4. **Seguro:** Mismo JWT_SECRET validado en todos lados
5. **Flexible:** Wildcards y múltiples permisos por endpoint

## Implementación Completada

### ✅ Archivos Creados
```
tickets-service/
  src/auth/guards/
    jwt-auth.guard.ts
    permisos.guard.ts
    public.decorator.ts
    requiere-permiso.decorator.ts
  app.module.ts (actualizado)
  tickets.controller.ts (actualizado con @RequierePermiso)

vehiculos-service/
  src/auth/guards/
    jwt-auth.guard.ts
    permisos.guard.ts
    public.decorator.ts
    requiere-permiso.decorator.ts

zonas-service/
  src/auth/guards/
    jwt-auth.guard.ts
    permisos.guard.ts
    public.decorator.ts
    requiere-permiso.decorator.ts

asignacion-trazabilidad/
  src/auth/guards/
    jwt-auth.guard.ts
    permisos.guard.ts
    public.decorator.ts
    requiere-permiso.decorator.ts
```

### ✅ Módulos a Actualizar (Next Step)
1. vehiculos-service: app.module.ts + controllers con @RequierePermiso
2. zonas-service: app.module.ts + controllers con @RequierePermiso
3. asignacion-trazabilidad: app.module.ts + controllers con @RequierePermiso

## Próximos Pasos

1. Actualizar package.json en cada servicio con dependencias JWT
2. Actualizar app.module.ts en cada servicio
3. Actualizar controllers con decoradores @RequierePermiso
4. Crear tests de autenticación
5. Validar integración con backend-personas
