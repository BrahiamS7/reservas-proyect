const prisma = require('../config/prisma');

function crearError(mensaje, statusCode) {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  return error;
}

async function listar(tenantId) {
  return prisma.tipoCancha.findMany({ where: { tenantId }, orderBy: { nombre: 'asc' } });
}

async function crear(tenantId, { nombre, precio }) {
  if (!nombre) throw crearError('nombre es requerido', 400);
  if (precio === undefined || precio === null || Number(precio) <= 0) {
    throw crearError('precio debe ser un número mayor a 0', 400);
  }

  try {
    return await prisma.tipoCancha.create({ data: { tenantId, nombre, precio } });
  } catch (error) {
    if (error.code === 'P2002') {
      throw crearError(`Ya existe un tipo de cancha llamado "${nombre}"`, 409);
    }
    throw error;
  }
}

async function actualizar(tenantId, id, { nombre, precio }) {
  const data = {};
  if (nombre !== undefined) data.nombre = nombre;
  if (precio !== undefined) {
    if (Number(precio) <= 0) throw crearError('precio debe ser un número mayor a 0', 400);
    data.precio = precio;
  }
  if (Object.keys(data).length === 0) throw crearError('nada para actualizar', 400);

  try {
    const resultado = await prisma.tipoCancha.updateMany({ where: { id, tenantId }, data });
    if (resultado.count === 0) throw crearError('Tipo de cancha no encontrado', 404);
    return await prisma.tipoCancha.findUnique({ where: { id } });
  } catch (error) {
    if (error.statusCode) throw error;
    if (error.code === 'P2002') throw crearError(`Ya existe un tipo de cancha llamado "${nombre}"`, 409);
    throw error;
  }
}

module.exports = { listar, crear, actualizar };
