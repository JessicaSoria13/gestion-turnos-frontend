import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch, guardarSesion, cerrarSesion } from '../../api/cliente'

const estiloInput = { display: 'block', width: '100%', padding: '0.5rem', boxSizing: 'border-box' }

export default function Login() {
  const [dni, setDni] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [rol, setRol] = useState('')
  const [pedirRol, setPedirRol] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setCargando(true)

    // Si quedo una sesion vieja, la borramos para que un 401 no nos saque de esta pantalla
    cerrarSesion()

    const cuerpo = { dni, contrasena }
    if (rol) {
      cuerpo.rol = rol
    }

    try {
      const respuesta = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify(cuerpo),
      })
      const datos = await respuesta.json()

      if (respuesta.ok) {
        guardarSesion(datos.token, datos.rol)
        navigate(datos.rol === 'ADMINISTRADOR' ? '/admin/agenda' : '/paciente/reservar')
        return
      }

      // 400 sin rol elegido = el DNI tiene los dos roles activos
      if (respuesta.status === 400 && !rol) {
        setPedirRol(true)
      }
      setError(datos.mensaje)
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{ maxWidth: '360px', margin: '4rem auto', padding: '0 1rem' }}>
      <h1>Ingresar</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label>
          DNI
          <input type="text" value={dni} onChange={(e) => setDni(e.target.value)} required style={estiloInput} />
        </label>

        <label>
          Contraseña
          <input type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} required style={estiloInput} />
        </label>

        {pedirRol && (
          <label>
            Ingresar como
            <select value={rol} onChange={(e) => setRol(e.target.value)} required style={estiloInput}>
              <option value="">Elegí un rol</option>
              <option value="PACIENTE">Paciente</option>
              <option value="ADMINISTRADOR">Administrador</option>
            </select>
          </label>
        )}

        {error && <p style={{ color: 'crimson', margin: 0 }}>{error}</p>}

        <button type="submit" disabled={cargando} style={{ padding: '0.6rem' }}>
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <p><Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link></p>
      <p>¿No tenés cuenta? <Link to="/registro">Registrarme</Link></p>
    </div>
  )
}
