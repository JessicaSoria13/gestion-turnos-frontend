# Guía de Conceptos de Angular para 3° Año (Con paralelismo a Spring Boot y JWT)

Esta guía está diseñada para explicar paso a paso cómo funciona el proyecto utilizando conceptos que ya conocés de tu backend en **Spring Boot, Spring Security (JWT) y PostgreSQL**.

---

## 1. Arquitectura y Separación de Responsabilidades (`core/` y `features/`)

Cuando desarrollás el backend en **Spring Boot**, no escribís las consultas SQL ni la validación del token JWT adentro del `Controller`. Separás el código en paquetes (`entity/dto`, `repository`, `service`, `security`, `controller`). En **Angular** aplicamos exactamente la misma filosofía dividiendo el proyecto en dos grandes carpetas dentro de `src/app/`:

- **`core/`**: Todo lo que es único y transversal a toda la aplicación (Modelos, Servicios HTTP, el Interceptor de JWT y los Guards de seguridad).
- **`features/`**: Las pantallas visuales divididas por módulo funcional (`auth/login`, `productos/producto-lista`, `productos/producto-formulario`).

### Tabla de equivalencias (Spring Boot vs. Angular)

| Concepto en Spring Boot (Java) | Equivalente en Angular (TypeScript) | Archivos en nuestro proyecto |
| :--- | :--- | :--- |
| `Entity` o `DTO` (`Producto`, `Categoria`, `LoginRequest`) | **Modelo / Interfaz** (`interface`) | [`src/app/core/models/`](./src/app/core/models/) |
| `@Service` (`ProductoService`, `AuthService`) | **Servicio** (`@Injectable()`) | [`src/app/core/services/`](./src/app/core/services/) |
| `JwtAuthFilter` (`OncePerRequestFilter`) | **Interceptor HTTP** (`HttpInterceptorFn`) | [`src/app/core/interceptors/jwt.interceptor.ts`](./src/app/core/interceptors/jwt.interceptor.ts) |
| `@PreAuthorize` / `SecurityFilterChain` | **Guard de Rutas** (`CanActivateFn`) | [`src/app/core/guards/auth.guard.ts`](./src/app/core/guards/auth.guard.ts) |
| `@Autowired` | **Inyección de Dependencias** (`inject(...)`) | Usado en servicios, guards y componentes |
| `application.properties` | **Variables de Entorno** (`environment.ts`) | [`src/environments/environment.development.ts`](./src/environments/environment.development.ts) |
| `@RestController` + Vista | **Componentes** (`.ts`, `.html`, `.css`) | [`src/app/features/`](./src/app/features/) |

---

## 2. Los Modelos (`Producto` y `Categoria`) y las Claves Foráneas (Foreign Keys)

En PostgreSQL tenemos dos tablas relacionadas: `producto` tiene una clave foránea (`categoria`) que apunta al `id` de la tabla `categoria`. Por eso definimos dos interfaces en `src/app/core/models/`:

```typescript
// src/app/core/models/categoria.model.ts
export interface Categoria {
  id: number;
  nombre: string;
}

// src/app/core/models/producto.model.ts
export interface Producto {
  id?: number;
  nombre: string;
  descripcion: string;
  costo: number;
  precio: number;
  categoria: number;          // Foreign Key: guarda el ID numérico de Categoria
  ultimaModificacion: string; // Fecha ISO que envía Spring Boot
}
```

### ¿Cómo mostramos el nombre de la categoría en vez de solo el número?
En [`ProductoListaComponent`](./src/app/features/productos/producto-lista/producto-lista.component.ts), al iniciar la pantalla pedimos tanto los productos (`GET /productos`) como las categorías (`GET /categorias`), y creamos un método traductor muy simple:

```typescript
obtenerNombreCategoria(idCategoria: number): string {
  const encontrada = this.categorias().find((cat) => cat.id === idCategoria);
  return encontrada ? `${encontrada.nombre} (#${idCategoria})` : `ID #${idCategoria}`;
}
```
Así, si el producto tiene `categoria: 1`, la tabla busca en el arreglo de categorías cuál tiene `id === 1` y muestra **`Periféricos (#1)`**.

---

## 3. Inyección de Dependencias (`@Injectable` e `inject`)

En [`src/app/core/services/producto.service.ts`](./src/app/core/services/producto.service.ts) vemos:

```typescript
@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private readonly http = inject(HttpClient);
  // ...
}
```

- **`@Injectable({ providedIn: 'root' })`**: Es el equivalente exacto a poner `@Service` arriba de una clase en Spring Boot. Le dice a Angular: *"Administrá vos la creación de esta clase y creá una única instancia compartida (Singleton) para toda la aplicación"*.
- **`inject(HttpClient)`**: Es el equivalente a `@Autowired` en Spring. En lugar de hacer `new HttpClient()` a mano, le pedimos a Angular que nos "inyecte" su cliente HTTP ya configurado en [`src/app/app.config.ts`](./src/app/app.config.ts).

---

## 4. Peticiones Asíncronas (`GET` y `POST`): `HttpClient`, `Observable` y `.subscribe()`

Cuando Angular se comunica con `http://localhost:8000`, el servidor de Spring Boot puede tardar varios milisegundos en consultar o insertar en PostgreSQL. **El navegador no puede quedarse congelado esperando esa respuesta.**

Por eso, en [`ProductoService`](./src/app/core/services/producto.service.ts) tenemos dos métodos que devuelven un **`Observable`**:

```typescript
// 1. Lectura (Equivalente a @GetMapping en Spring Boot)
obtenerProductos(): Observable<Producto[]> {
  return this.http.get<Producto[]>(this.apiUrl);
}

// 2. Creación (Equivalente a @PostMapping con @RequestBody en Spring Boot)
crearProducto(nuevoProducto: Producto): Observable<Producto> {
  return this.http.post<Producto>(this.apiUrl, nuevoProducto);
}
```

- En `http.get<Producto[]>(url)`: Le pedimos al servidor la lista de productos.
- En `http.post<Producto>(url, nuevoProducto)`: Le enviamos en el cuerpo (**Body**) de la petición HTTP el objeto `nuevoProducto` convertido automáticamente a JSON.

### ¿Cómo escucha el Componente la respuesta? Con `.subscribe()`
Llamar a `obtenerProductos()` o `crearProducto()` **no dispara la petición hasta que alguien se suscribe**:

```typescript
this.productoService.obtenerProductos().subscribe({
  next: (datosRecibidos) => {
    // Se ejecuta cuando Spring Boot responde con éxito (HTTP 200 OK)
    this.productos.set(datosRecibidos);
    this.cargando.set(false);
  },
  error: (err) => {
    // Se ejecuta si el servidor está apagado, hay error de red o HTTP 401/403/500
    this.cargando.set(false);
    this.mensajeError.set('No se pudo conectar...');
  }
});
```

---

## 5. Autenticación con JWT y Spring Security (`AuthService`, `localStorage` e `Interceptor`)

Cuando tu backend en Spring Boot tiene **Spring Security + JWT**, el flujo completo entre Angular y Java funciona en **3 pasos**:

### Paso 1: Iniciar sesión y guardar el token en `localStorage`
En [`AuthService.login()`](./src/app/core/services/auth.service.ts), enviamos el usuario y contraseña a `POST /auth/login`. Cuando Spring Boot valida la contraseña con `BCrypt` y nos devuelve el JSON con el `token`, lo guardamos en el almacenamiento del navegador (`localStorage`):

```typescript
login(credenciales: LoginRequest): Observable<LoginResponse> {
  return this.http.post<LoginResponse>(this.authUrl, credenciales).pipe(
    tap((respuesta) => {
      localStorage.setItem('token', respuesta.token);
    })
  );
}
```
> **¿Qué es `localStorage`?** Es una pequeña memoria clave-valor que tiene el navegador web para nuestro sitio. A diferencia de las variables comunes de TypeScript, lo que guardás en `localStorage` **no se borra si el usuario refresca la página con F5**.

### Paso 2: El Interceptor (`jwtInterceptor`) adjunta el token en cada petición
Si tenés 20 servicios distintos en Angular (`ProductoService`, `CategoriaService`, `TurnoService`, etc.), sería muy tedioso y propenso a errores tener que leer `localStorage` y armar la cabecera `Authorization: Bearer ...` en cada método.

Para eso existe [`jwt.interceptor.ts`](./src/app/core/interceptors/jwt.interceptor.ts):

```typescript
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloned);
  }

  return next(req);
};
```
> **Paralelismo con Spring Boot:** Así como en Spring Security tenés un filtro (`JwtAuthFilter`) que intercepta cada petición **que entra** al backend para leer la cabecera `Authorization`, en Angular el `jwtInterceptor` intercepta cada petición **que sale** del frontend para pegarle esa cabecera `Authorization: Bearer <token>`.

### Paso 3: Proteger pantallas en Angular con `authGuard`
En [`auth.guard.ts`](./src/app/core/guards/auth.guard.ts) tenemos un guardián de rutas (`CanActivateFn`). Si en `app.routes.ts` le agregamos `canActivate: [authGuard]` a una ruta, Angular verifica primero si el usuario tiene sesión activa; si no la tiene, lo redirige automáticamente a `/login`.

---

## 6. Formularios y Two-Way Data Binding (`[(ngModel)]`)

En [`producto-formulario.component.html`](./src/app/features/productos/producto-formulario/producto-formulario.component.html) y en [`login.component.html`](./src/app/features/auth/login/login.component.html) usamos `[(ngModel)]`.

### A. ¿Qué significa `[(ngModel)]`?
Se lo conoce como *"Banana in a box"* (`[()]`) o **enlace bidireccional (Two-Way Data Binding)**:
- Si el usuario escribe en el `<input>`, Angular actualiza automáticamente la propiedad del objeto en el archivo `.ts`.
- Y si desde el archivo `.ts` cambiamos el valor de la variable, el `<input>` se actualiza solo en la pantalla.

### B. ¿Cómo funciona el `<select>` de Categorías?
El usuario humano quiere elegir **"Periféricos"** o **"Monitores"** por su nombre, pero nuestra tabla de PostgreSQL necesita recibir el **ID numérico (`1`, `2`, etc.)** en el campo `categoria`:

```html
<select name="categoria" [(ngModel)]="nuevoProducto.categoria" required>
  @for (cat of categorias(); track cat.id) {
    <option [ngValue]="cat.id">{{ cat.nombre }} (ID: {{ cat.id }})</option>
  }
</select>
```
- Adentro de `<option>...</option>` mostramos `{{ cat.nombre }}` para que lo lea el usuario.
- En `[ngValue]="cat.id"` le indicamos a Angular que el valor real que debe guardarse en `nuevoProducto.categoria` es el **número `id`**.

---

## 7. Anatomía de un Componente: `.ts`, `.html` y `.css`

Cada pantalla en Angular es un **Componente** y se divide en 3 archivos con responsabilidades estrictas:

1. **Lógica (`.ts`)**:
   - **`ngOnInit()`**: Método del *ciclo de vida* que Angular ejecuta automáticamente una vez cuando el componente aparece en pantalla.
   - **`signal(...)`**: Guarda el estado reactivo de la pantalla (`productos`, `categorias`, `cargando`, `mensajeError`).

2. **Vista (`.html`)**:
   - **Interpolación `{{ ... }}`**: Muestra el valor de una variable o función en el HTML.
   - **Event Binding `(click)="..."` y `(ngSubmit)="..."`**: Ejecuta un método de TypeScript cuando el usuario hace clic o envía un formulario.
   - **Control de flujo `@if` y `@for`**: Muestra bloques condicionalmente o repite filas `<tr>` / opciones `<option>`.
   - **Pipes (`| currency`, `| date`)**: Formatean precios y fechas visualmente en la tabla sin modificar el dato real.

3. **Estilos encapsulados (`.css`)**:
   - El CSS de un componente **solo afecta a ese componente**, evitando conflictos de nombres con otras pantallas.

---

## 8. El clásico problema de CORS (Cross-Origin Resource Sharing)

Cuando levantes tu backend en Spring Boot (`http://localhost:8000`) y tu frontend en Angular (`http://localhost:4200`) al mismo tiempo, es muy común que **en Postman la API funcione perfecto, pero en Angular dé error de conexión**.

### ¿Por qué pasa esto?
Por seguridad, todos los navegadores web bloquean por defecto las peticiones JavaScript que van desde un origen (`localhost:4200`) hacia otro origen o puerto distinto (`localhost:8000`), a menos que el servidor destino diga explícitamente *"Acepto peticiones desde `localhost:4200`"*.

### ¿Cómo se soluciona?
Tenés dos opciones:
1. **En Spring Boot**: Agregar `@CrossOrigin(origins = "http://localhost:4200")` en tus Controllers (o configurar `CorsConfigurationSource` en tu `SecurityConfig` permitiendo los headers `Authorization` y `Content-Type`).
2. **En Angular**: Usar el archivo [`proxy.conf.json`](./proxy.conf.json) incluido en este proyecto levantando con `pnpm run start:proxy` / `npm run start:proxy`.
