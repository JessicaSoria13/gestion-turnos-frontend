import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../../api/cliente'

const estiloInput = { display: 'block', width: '100%', padding: '0.5rem', boxSizing: 'border-box' }

const formularioVacio = {
  dni: '',
  nombreApellido: '',
  fechaNacimiento: '',
  email: '',
  celular: '',
  contrasena: '',
  repetirContrasena: '',
}

export default function Registro() {
  const [form, setForm] = useState(formularioVacio)
  const [error, setError] = useState('')
  const [detalles, setDetalles] = useState([])
  const [exito, setExito] = useState(false)
  const [cargando, setCargando] = useState(false)

  function cambiar(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setDetalles([])

    if (form.contrasena !== form.repetirContrasena) {
      setError('Las contraseñas no coinciden')
      return
    }

    setCargando(true)

    // Los campos opcionales vacios se mandan como null, no como texto vacio
    const cuerpo = {
      dni: form.dni,
      nombreApellido: form.nombreApellido,
      fechaNacimiento: form.fechaNacimiento,
      email: form.email || null,
      celular: form.celular || null,
      contrasena: form.contrasena,
    }

    try {
      const respuesta = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(cuerpo),
      })
      const datos = await respuesta.json()

      if (respuesta.ok) {
        setExito(true)
        return
      }

      setError(datos.mensaje)
      setDetalles(datos.detalles || [])
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setCargando(false)
    }
  }

  if (exito) {
    return (
      <div style={{ maxWidth: '360px', margin: '4rem auto', padding: '0 1rem' }}>
        <h1>Registro exitoso</h1>
        <p>Tu cuenta de paciente ya está creada.</p>
        <Link to="/login">Ir a ingresar</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '360px', margin: '4rem auto', padding: '0 1rem' }}>
      <h1>Registrarme</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label>
          DNI
          <input type="text" name="dni" value={form.dni} onChange={cambiar} required maxLength={10} style={estiloInput} />
        </label>

        <label>
          Nombre y apellido
          <input type="text" name="nombreApellido" value={form.nombreApellido} onChange={cambiar} required maxLength={100} style={estiloInput} />
        </label>

        <label>
          Fecha de nacimiento
          <input type="date" name="fechaNacimiento" value={form.fechaNacimiento} onChange={cambiar} required style={estiloInput} />
        </label>

        <label>
          Email (para recuperar tu contraseña)
          <input type="email" name="email" value={form.email} onChange={cambiar} maxLength={100} style={estiloInput} />
        </label>

        <label>
          Celular (opcional)
          <input type="tel" name="celular" value={form.celular} onChange={cambiar} maxLength={20} style={estiloInput} />
        </label>

        <label>
          Contraseña (mínimo 6 caracteres)
          <input type="password" name="contrasena" value={form.contrasena} onChange={cambiar} required minLength={6} style={estiloInput} />
        </label>

        <label>
          Repetir contraseña
          <input type="password" name="repetirContrasena" value={form.repetirContrasena} onChange={cambiar} required style={estiloInput} />
        </label>

        {error && (
          <div style={{ color: 'crimson' }}>
            <p style={{ margin: 0 }}>{error}</p>
            {detalles.length > 0 && (
              <ul style={{ margin: '0.5rem 0 0' }}>
                {detalles.map((d) => <li key={d}>{d}</li>)}
              </ul>
            )}
          </div>
        )}

        <button type="submit" disabled={cargando} style={{ padding: '0.6rem' }}>
          {cargando ? 'Registrando...' : 'Registrarme'}
        </button>
      </form>

      <p>¿Ya tenés cuenta? <Link to="/login">Ingresar</Link></p>
    </div>
  )
}
