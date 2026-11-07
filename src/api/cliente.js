const BASE_URL = "http://localhost:8081/api/v1";

export function guardarSesion(token, rol) {
  localStorage.setItem("token", token);
  localStorage.setItem("rol", rol);
}

export function obtenerToken() {
  return localStorage.getItem("token");
}

export function obtenerRol() {
  return localStorage.getItem("rol");
}

export function cerrarSesion() {
  localStorage.removeItem("token");
  localStorage.removeItem("rol");
}

export async function apiFetch(path, opciones = {}) {
  const token = obtenerToken();

  const headers = {
    "Content-Type": "application/json",
    ...opciones.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const respuesta = await fetch(`${BASE_URL}${path}`, {
    ...opciones,
    headers,
  });

  // Solo redirige si habia sesion (token vencido o invalido).
  // En el login no hay token, asi el 401 llega a la pantalla y se muestra el error.
  if (respuesta.status === 401 && token) {
    cerrarSesion();
    window.location.href = "/login";
    return;
  }

  return respuesta;
}
