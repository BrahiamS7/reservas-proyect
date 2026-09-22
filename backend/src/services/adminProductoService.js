const prisma = require('../config/prisma');
const { crearError, validarNombreSimple, validarUrlImagenOpcional } = require('../utils/validacion');

function validarNombre(nombre) {
  return validarNombreSimple(nombre, 'nombre del producto');
}

async function listar(tenantId) {
  return prisma.producto.findMany({ where: { tenantId }, orderBy: { nombre: 'asc' } });
}

async function crear(tenantId, { nombre, precio, stock, imagenUrl }) {
  const nombreValidado = validarNombre(nombre);
  if (precio === undefined || precio === null || Number(precio) <= 0) {
    throw crearError('precio debe ser un número mayor a 0', 400);
  }
  const stockInicial = stock !== undefined ? Number(stock) : 0;
  if (stockInicial < 0) throw crearError('stock no puede ser negativo', 400);
  const imagenValidada = validarUrlImagenOpcional(imagenUrl);

  return prisma.producto.create({
    data: { tenantId, nombre: nombreValidado, precio, stock: stockInicial, imagenUrl: imagenValidada },
  });
}

async function actualizar(tenantId, id, { nombre, precio, stock, disponible, imagenUrl }) {
  const data = {};
  if (nombre !== undefined) data.nombre = validarNombre(nombre);
  if (precio !== undefined) {
    if (Number(precio) <= 0) throw crearError('precio debe ser un número mayor a 0', 400);
    data.precio = precio;
  }
  if (stock !== undefined) {
    if (Number(stock) < 0) throw crearError('stock no puede ser negativo', 400);
    data.stock = Number(stock);
  }
  if (disponible !== undefined) data.disponible = disponible;
  if (imagenUrl !== undefined) data.imagenUrl = validarUrlImagenOpcional(imagenUrl);
  if (Object.keys(data).length === 0) throw crearError('nada para actualizar', 400);

  const resultado = await prisma.producto.updateMany({ where: { id, tenantId }, data });
  if (resultado.count === 0) throw crearError('Producto no encontrado', 404);
  return prisma.producto.findUnique({ where: { id } });
}

async function desactivar(tenantId, id) {
  const resultado = await prisma.producto.updateMany({
    where: { id, tenantId },
    data: { disponible: false },
  });
  if (resultado.count === 0) throw crearError('Producto no encontrado', 404);
  return prisma.producto.findUnique({ where: { id } });
}

module.exports = { listar, crear, actualizar, desactivar };
