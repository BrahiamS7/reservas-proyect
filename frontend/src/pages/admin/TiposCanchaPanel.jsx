import { useEffect, useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { listarTiposCancha, crearTipoCancha, actualizarTipoCancha } from '../../api/adminApi';

export default function TiposCanchaPanel() {
  const { token } = useAdminAuth();
  const [tipos, setTipos] = useState([]);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(null); // { id, nombre, precio }

  async function cargar() {
    setTipos(await listarTiposCancha(token));
  }

  useEffect(() => {
    cargar();
  }, []);

  async function onCrear(e) {
    e.preventDefault();
    setError('');
    try {
      await crearTipoCancha(token, { nombre, precio: Number(precio) });
      setNombre('');
      setPrecio('');
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onGuardarEdicion(e) {
    e.preventDefault();
    setError('');
    try {
      await actualizarTipoCancha(token, editando.id, {
        nombre: editando.nombre,
        precio: Number(editando.precio),
      });
      setEditando(null);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h3>Tipos de Cancha</h3>
      {error && <p className="error">{error}</p>}

      <table className="tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Precio/hora</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tipos.map((t) =>
            editando?.id === t.id ? (
              <tr key={t.id}>
                <td colSpan={3}>
                  <form className="fila-edicion" onSubmit={onGuardarEdicion}>
                    <input
                      value={editando.nombre}
                      onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                    />
                    <input
                      type="number"
                      value={editando.precio}
                      onChange={(e) => setEditando({ ...editando, precio: e.target.value })}
                    />
                    <button type="submit" className="btn-primary">Guardar</button>
                    <button type="button" onClick={() => setEditando(null)}>
                      Cancelar
                    </button>
                  </form>
                </td>
              </tr>
            ) : (
              <tr key={t.id}>
                <td>{t.nombre}</td>
                <td>${Number(t.precio).toLocaleString('es-CO')}</td>
                <td>
                  <button onClick={() => setEditando({ id: t.id, nombre: t.nombre, precio: t.precio })}>
                    Editar
                  </button>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>

      <form className="form-inline" onSubmit={onCrear}>
        <input placeholder="Nombre (ej. Volleyball)" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <input
          type="number"
          placeholder="Precio por hora"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          required
        />
        <button type="submit" className="btn-primary">Crear tipo de cancha</button>
      </form>
    </div>
  );
}
