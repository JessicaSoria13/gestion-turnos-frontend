# Frontend NEXA Salud (Angular 22)

Proyecto basado en el repositorio que pasó el profe: https://github.com/fborzi/angular
(misma estructura `core/` + `features/`, interceptor JWT y guard). Para entender cada concepto
de Angular comparado con Spring Boot, ver [GUIA_CONCEPTOS.md](./GUIA_CONCEPTOS.md).

## Cómo levantarlo

Requisitos: Node.js 20 o superior (`node -v`) y el backend corriendo en `http://localhost:8081`.

```bash
cd frontend
npm install      # solo la primera vez (o cuando cambie package.json)
npm start        # http://localhost:4200
```

`npm start` ya usa el proxy de desarrollo ([proxy.conf.mjs](./proxy.conf.mjs)): las llamadas a
`/api/...` se redirigen al backend en el puerto 8081 y se les quita el header `Origin`, así el backend
las ve como del mismo origen y no hace falta tocar su CORS. Si cambiás el proxy, reiniciá `npm start`
(Ctrl+C y de nuevo): el proxy no se recarga solo.

## Dónde va cada cosa

```text
src/app/
├── core/                      # Código compartido (una sola instancia)
│   ├── guards/auth.guard.ts   # authGuard (hay sesión) y rolGuard('PACIENTE' | 'ADMINISTRADOR')
│   ├── interceptors/          # jwt.interceptor.ts: agrega el token y maneja el 401
│   ├── models/                # Interfaces de los DTOs del backend (auth.model.ts, ...)
│   ├── services/              # Un servicio por recurso del backend (auth.service.ts, ...)
│   └── utils/errores.ts       # mensajeDeError(): muestra el "mensaje" del ErrorResponse del backend
├── features/                  # Pantallas, una carpeta por módulo
│   ├── auth/login/            # Login con DNI, contraseña y elección de rol
│   └── en-construccion/       # Pantalla provisoria para rutas que todavía no existen
├── app.ts / app.html          # Encabezado con menú según el rol y Cerrar sesión
├── app.routes.ts              # Rutas: /paciente/... solo PACIENTE, /admin/... solo ADMINISTRADOR
└── app.config.ts              # HttpClient + interceptor JWT + router
```

## Cómo agregar una pantalla

1. Crear el componente: `npx ng generate component features/<modulo>/<pantalla>`
2. Si llama al backend, crear o usar un servicio en `core/services/` (los componentes no usan
   `HttpClient` directo). El token lo agrega solo el interceptor.
3. En `app.routes.ts`, reemplazar `EnConstruccionComponent` de **tu** ruta por tu componente.
4. Mostrar los errores con `mensajeDeError(err)` y las clases globales `.mensaje-error` / `.mensaje-exito`.

## Comandos

| Comando | Para qué |
| --- | --- |
| `npm start` | Servidor de desarrollo en `localhost:4200` con live-reload y proxy al backend |
| `npm run build` | Compila en `dist/` (verifica que no haya errores) |
| `npm test` | Tests unitarios (Vitest) |
