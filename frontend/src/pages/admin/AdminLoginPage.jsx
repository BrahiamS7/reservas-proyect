import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(email, password);
      navigate('/admin');
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
      <form className="tarjeta tarjeta-oscura" onSubmit={onSubmit}>
        <span className="hero-marca">Administrador</span>
        <h2>Panel del complejo</h2>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          Contraseña
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
        <Link to="/cliente/login" className="link-secundario">
          ¿Sos cliente? Reservá una cancha acá
        </Link>
      </form>
    </div>
  );
}
