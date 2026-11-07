import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch, cerrarSesion } from '../../api/cliente'

const estiloInput = { display: 'block', width: '100%', padding: '0.5rem', boxSizing: 'border-box' }
const estiloPagina = { maxWidth: '360px', margin: '4rem auto', padding: '0 1rem' }
const estiloForm = { display: 'flex', flexDirection: 'column', gap: '1rem' }

export default function RecuperarContrasena() {
  // paso: 'solicitar' -> 'confirmar' -> 'listo'
  const [paso, setPaso] = useState('solicitar')
  const [email, setEmail] = useState('')
  const [codigo, setCodigo] = useState('')
  const [contrasenaNueva, setContrasenaNueva] = useState('')
  const [repetirContrasena, setRepetirContrasena] = useState('')
  const [aviso, setAviso] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  // Llama al back y devuelve { ok, datos }. Si no hay conexion, muestra el error y devuelve null.
  async function enviar(path, cuerpo) {
    setError('')
    setCargando(true)
    cerrarSesion()
    try {
      const respuesta = await apiFetch(path, {
        method: 'POST',
        body: JSON.stringify(cuerpo),
      })
      const datos = await respuesta.json()
      return { ok: respuesta.ok, datos }
    } catch {
      setError('No se pudo conectar con el servidor')
      return null
    } finally {
      setCargando(false)
    }
  }

  async function solicitar(e) {
    e.preventDefault()
    const resultado = await enviar('/auth/recuperar-contrasena/solicitar', { email })
    if (!resultado) return

    if (resultado.ok) {
      setAviso(resultado.datos.mensaje)
      setPaso('confirmar')
    } else {
      setError(resultado.datos.mensaje)
    }
  }

  async function confirmar(e) {
    e.preventDefault()
    if (contrasenaNueva !== repetirContrasena) {
      setError('Las contraseñas no coinciden')
      return
    }

    const resultado = await enviar('/auth/recuperar-contrasena/confirmar', {
      token: codigo.trim(),
      contrasenaNueva,
    })
    if (!resultado) return

    if (resultado.ok) {
      setPaso('listo')
    } else {
      setError(resultado.datos.mensaje)
    }
  }

  if (paso === 'listo') {
    return (
      <div style={estiloPagina}>
        <h1>Contraseña actualizada</h1>
        <p>Ya podés ingresar con tu nueva contraseña.</p>
        <Link to="/login">Ir a ingresar</Link>
      </div>
    )
  }

  return (
    <div style={estiloPagina}>
      <h1>Recuperar contraseña</h1>

      {paso === 'solicitar' && (
        <form onSubmit={solicitar} style={estiloForm}>
          <p style={{ margin: 0 }}>Ingresá el email con el que te registraste y te enviamos un código.</p>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={estiloInput} />
          </label>

          {error && <p style={{ color: 'crimson', margin: 0 }}>{error}</p>}

          <button type="submit" disabled={cargando} style={{ padding: '0.6rem' }}>
            {cargando ? 'Enviando...' : 'Enviar código'}
          </button>
        </form>
      )}

      {paso === 'confirmar' && (
        <form onSubmit={confirmar} style={estiloForm}>
          <p style={{ margin: 0, color: 'green' }}>{aviso}</p>
          <label>
            Código recibido por email
            <input type="text" value={codigo} onChange={(e) => setCodigo(e.target.value)} required style={estiloInput} />
          </label>
          <label>
            Contraseña nueva (mínimo 6 caracteres)
            <input type="password" value={contrasenaNueva} onChange={(e) => setContrasenaNueva(e.target.value)} required minLength={6} style={estiloInput} />
          </label>
          <label>
            Repetir contraseña nueva
            <input type="password" value={repetirContrasena} onChange={(e) => setRepetirContrasena(e.target.value)} required style={estiloInput} />
          </label>

          {error && <p style={{ color: 'crimson', margin: 0 }}>{error}</p>}

          <button type="submit" disabled={cargando} style={{ padding: '0.6rem' }}>
            {cargando ? 'Guardando...' : 'Cambiar contraseña'}
          </button>
          <button type="button" onClick={() => { setPaso('solicitar'); setError('') }} style={{ padding: '0.6rem' }}>
            No me llegó el código, volver a pedirlo
          </button>
        </form>
      )}

      <p><Link to="/login">Volver a ingresar</Link></p>
    </div>
  )
}
