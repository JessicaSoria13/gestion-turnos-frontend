// Proxy de desarrollo: redirige /api al backend Spring Boot en el 8081.
// Además le saca al pedido el header "Origin" que agrega el navegador:
// así el backend lo recibe como un pedido del mismo origen y no aplica CORS
// (SecurityConfig solo permite http://localhost:5173 y no hace falta tocarlo).
export default {
  '/api': {
    target: 'http://localhost:8081',
    secure: false,
    changeOrigin: true,
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.removeHeader('origin');
      });
    },
  },
};
