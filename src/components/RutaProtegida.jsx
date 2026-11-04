import { Navigate, Outlet } from 'react-router-dom'
import { obtenerToken, obtenerRol } from '../api/cliente'

export default function RutaProtegida({ rolRequerido }) {
  const token = obtenerToken()
  const rol = obtenerRol()

  if (!token) {
    return <Navigate to="/login" />
  }

  if (rolRequerido && rol !== rolRequerido) {
    return <Navigate to="/login" />
  }

  return <Outlet />
}
