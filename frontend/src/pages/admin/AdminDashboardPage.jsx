import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import TiposCanchaPanel from './TiposCanchaPanel';
import CanchasPanel from './CanchasPanel';
import ProductosPanel from './ProductosPanel';
import ReservasPanel from './ReservasPanel';

const TABS = [
  { id: 'reservas', label: 'Reservas', Componente: ReservasPanel },
  { id: 'canchas', label: 'Canchas', Componente: CanchasPanel },
  { id: 'tipos', label: 'Tipos de Cancha', Componente: TiposCanchaPanel },
  { id: 'productos', label: 'Productos', Componente: ProductosPanel },
];

export default function AdminDashboardPage() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('reservas');

  function onLogout() {
    logout();
    navigate('/admin/login');
  }

  const TabActivo = TABS.find((t) => t.id === tab).Componente;

  return (
    <div className="panel">
      <header className="panel-header">
        <h2 className="panel-titulo">Panel Admin</h2>
        <div>
          <span>{admin?.email}</span>{' '}
          <button onClick={onLogout}>Salir</button>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={t.id === tab ? 'tab-activo' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <section className="panel-contenido">
        <TabActivo />
      </section>
    </div>
  );
}
