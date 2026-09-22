import { useEffect, useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  listarCanchas,
  crearCancha,
  actualizarCancha,
  desactivarCancha,
  listarTiposCancha,
} from '../../api/adminApi';

function Miniatura({ url }) {
  if (!url) return <span className="miniatura miniatura-vacia">Sin foto</span>;
  return <img src={url} alt="" className="miniatura" />;
}

function TablaCanchas({ canchas, onToggleActiva, onEditar, vacio }) {
  if (canchas.length === 0) return <p>{vacio}</p>;
  return (
    <table className="tabla">
      <thead>
        <tr>
          <th>Foto</th>
          <th>Nombre</th>
          <th>Tipo</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {canchas.map((c) => (
          <tr key={c.id}>
            <td>
              <Miniatura url={c.imagenUrl} />
            </td>
            <td>{c.nombre}</td>
            <td>{c.tipoCancha?.nombre}</td>
            <td>
              <button onClick={() => onEditar(c)}>Editar</button>{' '}
              <button onClick={() => onToggleActiva(c)}>{c.activa ? 'Desactivar' : 'Activar'}</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function CanchasPanel() {
  const { token } = useAdminAuth();
  const [canchas, setCanchas] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [nombre, setNombre] = useState('');
  const [tipoCanchaId, setTipoCanchaId] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(null); // { id, nombre, tipoCanchaId, imagenUrl }

  async function cargar() {
    const [c, t] = await Promise.all([listarCanchas(token), listarTiposCancha(token)]);
    setCanchas(c);
    setTipos(t);
    if (!tipoCanchaId && t.length) setTipoCanchaId(t[0].id);
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCrear(e) {
    e.preventDefault();
    setError('');
    try {
      await crearCancha(token, { nombre, tipoCanchaId, imagenUrl: imagenUrl || undefined });
      setNombre('');
      setImagenUrl('');
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onToggleActiva(cancha) {
    setError('');
    try {
      if (cancha.activa) {
        await desactivarCancha(token, cancha.id);
      } else {
        await actualizarCancha(token, cancha.id, { activa: true });
      }
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  function onEditar(cancha) {
    setEditando({
      id: cancha.id,
      nombre: cancha.nombre,
      tipoCanchaId: cancha.tipoCanchaId,
      imagenUrl: cancha.imagenUrl || '',
    });
  }

  async function onGuardarEdicion(e) {
    e.preventDefault();
    setError('');
    try {
      await actualizarCancha(token, editando.id, {
        nombre: editando.nombre,
        tipoCanchaId: editando.tipoCanchaId,
        imagenUrl: editando.imagenUrl,
      });
      setEditando(null);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  const activas = canchas.filter((c) => c.activa);
  const inactivas = canchas.filter((c) => !c.activa);

  return (
    <div>
      <h3>Canchas</h3>
      {error && <p className="error">{error}</p>}

      {editando && (
        <div className="modal-fondo" onClick={() => setEditando(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Editar cancha</h3>
            <form onSubmit={onGuardarEdicion} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label>
                Nombre
                <input
                  value={editando.nombre}
                  onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                />
              </label>
              <label>
                Tipo
                <select
                  value={editando.tipoCanchaId}
                  onChange={(e) => setEditando({ ...editando, tipoCanchaId: e.target.value })}
                >
                  {tipos.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                URL de imagen
                <input
                  value={editando.imagenUrl}
                  onChange={(e) => setEditando({ ...editando, imagenUrl: e.target.value })}
                  placeholder="https://..."
                />
              </label>
              {editando.imagenUrl && <img src={editando.imagenUrl} alt="" className="miniatura-preview" />}
              <div className="modal-acciones">
                <button type="submit" className="btn-primary">Guardar</button>
                <button type="button" onClick={() => setEditando(null)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <h4>Activas</h4>
      <TablaCanchas canchas={activas} onToggleActiva={onToggleActiva} onEditar={onEditar} vacio="No hay canchas activas." />

      <h4>Inactivas</h4>
      <TablaCanchas
        canchas={inactivas}
        onToggleActiva={onToggleActiva}
        onEditar={onEditar}
        vacio="No hay canchas inactivas."
      />

      <form className="form-inline" onSubmit={onCrear}>
        <input placeholder="Nombre (ej. Volley 3)" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <select value={tipoCanchaId} onChange={(e) => setTipoCanchaId(e.target.value)} required>
          {tipos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre}
            </option>
          ))}
        </select>
        <input
          placeholder="URL de imagen (opcional)"
          value={imagenUrl}
          onChange={(e) => setImagenUrl(e.target.value)}
        />
        <button type="submit" className="btn-primary">Crear cancha</button>
      </form>
    </div>
  );
}
