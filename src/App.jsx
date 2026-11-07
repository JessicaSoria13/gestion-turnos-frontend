import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import RutaProtegida from './components/RutaProtegida'
import EnConstruccion from './pages/EnConstruccion'
import Login from './pages/auth/Login'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<EnConstruccion titulo="Registrarme" />} />
      <Route element={<Layout />}>
        <Route element={<RutaProtegida rolRequerido="PACIENTE" />}>
          <Route path="/paciente/reservar" element={<EnConstruccion titulo="Reservar turno" />} />
          <Route path="/paciente/mis-turnos" element={<EnConstruccion titulo="Mis turnos" />} />
        </Route>
        <Route element={<RutaProtegida rolRequerido="ADMINISTRADOR" />}>
          <Route path="/admin/agenda" element={<EnConstruccion titulo="Agenda" />} />
          <Route path="/admin/pacientes" element={<EnConstruccion titulo="Pacientes" />} />
          <Route path="/admin/historial" element={<EnConstruccion titulo="Historial clínico" />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}
