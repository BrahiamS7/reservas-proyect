import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useClienteAuth } from '../../context/ClienteAuthContext';

export default function ClienteLoginPage() {
  const { pedirOtp, confirmarOtp } = useClienteAuth();
  const navigate = useNavigate();

  const [paso, setPaso] = useState('telefono'); // 'telefono' | 'nombre' | 'codigo'
  const [telefono, setTelefono] = useState('');
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [esNuevo, setEsNuevo] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function onPedirOtp(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const resultado = await pedirOtp(telefono, nombre || undefined);
      if (resultado.requiereNombre) {
        setPaso('nombre');
      } else {
        setEsNuevo(resultado.esNuevoRegistro);
        setPaso('codigo');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function onConfirmarOtp(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await confirmarOtp(telefono, codigo);
      navigate('/cliente');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="pagina-centrada pagina-centrada-bloque">
      <Link to="/" className="link-volver link-volver-oscuro">
        ← Volver al inicio
      </Link>
      <div className="tarjeta tarjeta-oscura">
        <span className="hero-marca">Cliente</span>
        <h2>Reservar cancha</h2>

        {paso === 'telefono' && (
          <form onSubmit={onPedirOtp}>
            <label>
              Teléfono (WhatsApp, 10 dígitos)
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
                inputMode="numeric"
                maxLength={10}
                required
              />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={cargando}>
              {cargando ? 'Enviando...' : 'Continuar'}
            </button>
          </form>
        )}

        {paso === 'nombre' && (
          <form onSubmit={onPedirOtp}>
            <p>Es tu primera vez por acá. ¿Cómo te llamas?</p>
            <label>
              Nombre completo
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={cargando}>
              {cargando ? 'Enviando...' : 'Enviar código'}
            </button>
            <button type="button" onClick={() => setPaso('telefono')}>
              Volver
            </button>
          </form>
        )}

        {paso === 'codigo' && (
          <form onSubmit={onConfirmarOtp}>
            <p>
              {esNuevo ? '¡Bienvenido! ' : ''}Te enviamos un código por WhatsApp a {telefono}.
              <br />
              <small>(Modo desarrollo: revisá la consola del backend para ver el código)</small>
            </p>
            <label>
              Código
              <input value={codigo} onChange={(e) => setCodigo(e.target.value)} required />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={cargando}>
              {cargando ? 'Verificando...' : 'Confirmar'}
            </button>
            <button type="button" onClick={() => setPaso('telefono')}>
              Volver
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
