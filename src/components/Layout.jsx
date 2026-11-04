import { NavLink, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div>
      <header style={{ background: '#1e4fa3', color: 'white', padding: '1rem' }}>
        <strong>NEXA Salud</strong>
        <nav style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <NavLink to="/paciente/reservar" style={{ color: 'white' }}>Reservar turno</NavLink>
          <NavLink to="/paciente/mis-turnos" style={{ color: 'white' }}>Mis turnos</NavLink>
          <NavLink to="/admin/agenda" style={{ color: 'white' }}>Agenda</NavLink>
          <NavLink to="/admin/pacientes" style={{ color: 'white' }}>Pacientes</NavLink>
          <NavLink to="/admin/historial" style={{ color: 'white' }}>Historial clínico</NavLink>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}