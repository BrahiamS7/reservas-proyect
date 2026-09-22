import { useEffect, useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { listarProductos, crearProducto, actualizarProducto, desactivarProducto } from '../../api/adminApi';

function Miniatura({ url }) {
  if (!url) return <span className="miniatura miniatura-vacia">Sin foto</span>;
  return <img src={url} alt="" className="miniatura" />;
}

function TablaProductos({ productos, editando, setEditando, onGuardarEdicion, onToggleDisponible, vacio }) {
  if (productos.length === 0) return <p>{vacio}</p>;
  return (
    <table className="tabla">
      <thead>
        <tr>
          <th>Foto</th>
          <th>Nombre</th>
          <th>Precio</th>
          <th>Stock</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {productos.map((p) =>
          editando?.id === p.id ? (
            <tr key={p.id}>
              <td colSpan={5}>
                <form className="fila-edicion" onSubmit={onGuardarEdicion} style={{ flexWrap: 'wrap' }}>
                  <input
                    value={editando.nombre}
                    onChange={(e) => setEditando({ ...editando, nombre: e.target.value })}
                  />
                  <input
                    type="number"
                    value={editando.precio}
                    onChange={(e) => setEditando({ ...editando, precio: e.target.value })}
                  />
                  <input
                    type="number"
                    value={editando.stock}
                    onChange={(e) => setEditando({ ...editando, stock: e.target.value })}
                  />
                  <input
                    placeholder="URL de imagen"
                    value={editando.imagenUrl}
                    onChange={(e) => setEditando({ ...editando, imagenUrl: e.target.value })}
                  />
                  <button type="submit" className="btn-primary">Guardar</button>
                  <button type="button" onClick={() => setEditando(null)}>
                    Cancelar
                  </button>
                </form>
              </td>
            </tr>
          ) : (
            <tr key={p.id}>
              <td>
                <Miniatura url={p.imagenUrl} />
              </td>
              <td>{p.nombre}</td>
              <td>${Number(p.precio).toLocaleString('es-CO')}</td>
              <td>{p.stock}</td>
              <td>
                <button
                  onClick={() =>
                    setEditando({
                      id: p.id,
                      nombre: p.nombre,
                      precio: p.precio,
                      stock: p.stock,
                      imagenUrl: p.imagenUrl || '',
                    })
                  }
                >
                  Editar
                </button>{' '}
                <button onClick={() => onToggleDisponible(p)}>{p.disponible ? 'Desactivar' : 'Activar'}</button>
              </td>
            </tr>
          )
        )}
      </tbody>
    </table>
  );
}

export default function ProductosPanel() {
  const { token } = useAdminAuth();
  const [productos, setProductos] = useState([]);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(null);

  async function cargar() {
    setProductos(await listarProductos(token));
  }

  useEffect(() => {
    cargar();
  }, []);

  async function onCrear(e) {
    e.preventDefault();
    setError('');
    try {
      await crearProducto(token, {
        nombre,
        precio: Number(precio),
        stock: Number(stock || 0),
        imagenUrl: imagenUrl || undefined,
      });
      setNombre('');
      setPrecio('');
      setStock('');
      setImagenUrl('');
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onGuardarEdicion(e) {
    e.preventDefault();
    setError('');
    try {
      await actualizarProducto(token, editando.id, {
        nombre: editando.nombre,
        precio: Number(editando.precio),
        stock: Number(editando.stock),
        imagenUrl: editando.imagenUrl,
      });
      setEditando(null);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function onToggleDisponible(producto) {
    setError('');
    try {
      if (producto.disponible) {
        await desactivarProducto(token, producto.id);
      } else {
        await actualizarProducto(token, producto.id, { disponible: true });
      }
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  const activos = productos.filter((p) => p.disponible);
  const inactivos = productos.filter((p) => !p.disponible);

  const props = { editando, setEditando, onGuardarEdicion, onToggleDisponible };

  return (
    <div>
      <h3>Productos (bebidas)</h3>
      {error && <p className="error">{error}</p>}

      <h4>Disponibles</h4>
      <TablaProductos productos={activos} {...props} vacio="No hay productos disponibles." />

      <h4>Inactivos</h4>
      <TablaProductos productos={inactivos} {...props} vacio="No hay productos inactivos." />

      <form className="form-inline" onSubmit={onCrear}>
        <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
        <input type="number" placeholder="Precio" value={precio} onChange={(e) => setPrecio(e.target.value)} required />
        <input type="number" placeholder="Stock" value={stock} onChange={(e) => setStock(e.target.value)} />
        <input
          placeholder="URL de imagen (opcional)"
          value={imagenUrl}
          onChange={(e) => setImagenUrl(e.target.value)}
        />
        <button type="submit" className="btn-primary">Crear producto</button>
      </form>
    </div>
  );
}
