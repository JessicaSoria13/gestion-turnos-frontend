// Proxy de desarrollo: redirige /api al backend Spring Boot (repo gestion-turnos-database).
//
// Puerto del backend: 8080 por defecto (el de application.properties.example). Si en tu compu el
// backend corre en otro puerto (por ejemplo 8081 porque XAMPP ocupa el 8080), definí la variable de
// entorno BACKEND_PORT una sola vez en Windows:  setx BACKEND_PORT 8081  (y abrí una terminal nueva).
//
// Además le saca al pedido el header "Origin" que agrega el navegador: así el backend lo recibe
// como un pedido del mismo origen y no aplica CORS (no hace falta tocar SecurityConfig).
const puertoBackend = process.env.BACKEND_PORT || '8080';

export default {
  '/api': {
    target: `http://localhost:${puertoBackend}`,
    secure: false,
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.removeHeader('origin');
      });
    },
  },
};
