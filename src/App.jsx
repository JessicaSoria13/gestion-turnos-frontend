import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import EnConstruccion from './pages/EnConstruccion'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<EnConstruccion titulo="Ingresar" />} />
      <Route path="/registro" element={<EnConstruccion titulo="Registrarme" />} />
      <Route element={<Layout />}>
        <Route path="/paciente/reservar" element={<EnConstruccion titulo="Reservar turno" />} />
        <Route path="/paciente/mis-turnos" element={<EnConstruccion titulo="Mis turnos" />} />
        <Route path="/admin/agenda" element={<EnConstruccion titulo="Agenda" />} />
        <Route path="/admin/pacientes" element={<EnConstruccion titulo="Pacientes" />} />
        <Route path="/admin/historial" element={<EnConstruccion titulo="Historial clínico" />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}