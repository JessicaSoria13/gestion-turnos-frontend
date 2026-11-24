# Frontend NEXA Salud (Angular 22)

Proyecto basado en el repositorio que pasó el profe: https://github.com/fborzi/angular
(misma estructura `core/` + `features/`, interceptor JWT y guard).

El **backend** (Spring Boot), la base de datos, la colección de Postman y `contexto.md` (reglas del
proyecto) están en el otro repositorio:
https://github.com/JessicaSoria13/gestion-turnos-database

## Cómo levantarlo

Requisitos: Node.js 20 o superior (`node -v`) y el backend de `gestion-turnos-database` corriendo
(por defecto en `http://localhost:8080`).

```bash
git clone https://github.com/JessicaSoria13/gestion-turnos-frontend.git
cd gestion-turnos-frontend
npm install      # solo la primera vez (o cuando cambie package.json)
npm start        # http://localhost:4200
```

`npm start` ya usa el proxy de desarrollo ([proxy.conf.mjs](./proxy.conf.mjs)): las llamadas a
`/api/...` se redirigen al backend y se les quita el header `Origin`, así el backend las ve como del
mismo origen y no hace falta tocar su CORS. Si cambiás el proxy, reiniciá `npm start` (Ctrl+C y de
nuevo): el proxy no se recarga solo.

**¿Tu backend no corre en el 8080?** (por ejemplo, usás el 8081 porque XAMPP ocupa el 8080) Definí una
sola vez la variable de entorno con tu puerto y abrí una terminal nueva:

```bash
setx BACKEND_PORT 8081
```

Si la consola de `npm start` muestra errores `ECONNREFUSED` o el login responde 502, el proxy no
encuentra el backend: revisá que esté levantado y en el puerto correcto.

## Dónde va cada cosa

```text
src/app/
├── core/                      # Código compartido (una sola instancia)
│   ├── guards/auth.guard.ts   # rolGuard('PACIENTE' | 'ADMINISTRADOR'): protege las rutas por rol
│   ├── interceptors/          # jwt.interceptor.ts: agrega el token y maneja el 401
│   ├── models/                # Interfaces de los DTOs del backend (auth.model.ts, ...)
│   ├── services/              # Un servicio por recurso del backend (auth.service.ts, ...)
│   │                          # + toast.service.ts: avisos flotantes de éxito o error
│   └── utils/                 # errores.ts: mensajeDeError() · scroll.ts: llevarA(id) baja al panel abierto
├── features/                  # Pantallas, una carpeta por módulo
│   ├── auth/login/            # Login con DNI, contraseña y elección de rol
│   ├── auth/registro/         # Registro de paciente (POST /auth/register)
│   ├── auth/recuperar-contrasena/  # Pedir código por email y cambiar la contraseña
│   ├── turnos-del-dia/        # Administrador: turnos de una fecha (hoy por defecto), atender y cancelar
│   ├── agenda/                # Administrador: disponibilidad semanal y bloqueos
│   ├── pacientes/             # Administrador: pacientes y sus coberturas
│   ├── historial/             # Administrador: turnos, consultas, diagnósticos y tratamientos
│   └── turnos/                # Paciente: reservar turno y mis turnos (+ fechas.ts)
├── shared/                    # Componentes reutilizables
│   ├── campo-fecha/           # Campo de fecha dd/mm/aaaa con calendario
│   ├── toasts/                # Muestra los avisos de ToastService abajo a la izquierda
│   └── layout-acceso/         # Panel azul + tarjeta de login, registro y recuperar contraseña
├── app.ts / app.html          # Encabezado con menú según el rol y Cerrar sesión
├── app.routes.ts              # Rutas: /paciente/... solo PACIENTE, /admin/... solo ADMINISTRADOR
└── app.config.ts              # HttpClient + interceptor JWT + router
```

## Cómo agregar una pantalla

1. Crear el componente: `npx ng generate component features/<modulo>/<pantalla>`
2. Si llama al backend, crear o usar un servicio en `core/services/` (los componentes no usan
   `HttpClient` directo). El token lo agrega solo el interceptor.
3. Agregar la ruta en `app.routes.ts`, dentro de `paciente` o `admin` según quién la usa (así queda
   protegida por `rolGuard`), y el link en `ENLACES_POR_ROL` de `app.ts`.
4. Usar las clases globales de `src/styles.css` (`.tarjeta`, `.identificador`, `.campo`, `.btn`,
   `.tabla`, ...). El resultado de cada acción se avisa con `ToastService`:
   `toast.exito('Cobertura agregada')` o `toast.error(mensajeDeError(err))`. Aparece abajo a la
   izquierda, se esté viendo la parte de la pantalla que sea.
5. Si al tocar un botón se abre un panel o formulario más abajo, darle un `id` y la clase
   `destino-scroll`, y llamar a `llevarA('ese-id')` para que la pantalla baje sola hasta ahí.

## Comandos

| Comando | Para qué |
| --- | --- |
| `npm start` | Servidor de desarrollo en `localhost:4200` con live-reload y proxy al backend |
| `npm run build` | Compila en `dist/` (verifica que no haya errores) |
| `npm test` | Tests unitarios (Vitest) |
