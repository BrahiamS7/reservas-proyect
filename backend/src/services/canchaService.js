const prisma = require('../config/prisma');
const { crearError, validarNombreSimple, validarUrlImagenOpcional } = require('../utils/validacion');

function validarNombre(nombre) {
  return validarNombreSimple(nombre, 'nombre de la cancha');
}

async function verificarTipoCancha(tenantId, tipoCanchaId) {
  const tipo = await prisma.tipoCancha.findFirst({ where: { id: tipoCanchaId, tenantId } });
  if (!tipo) throw crearError('tipoCanchaId inválido para este tenant', 400);
}

async function listar(tenantId) {
  return prisma.cancha.findMany({
    where: { tenantId },
    include: { tipoCancha: true },
    orderBy: { nombre: 'asc' },
  });
}

async function crear(tenantId, { nombre, tipoCanchaId, imagenUrl }) {
  if (!nombre) throw crearError('nombre es requerido', 400);
  if (!tipoCanchaId) throw crearError('tipoCanchaId es requerido', 400);
  const nombreValidado = validarNombre(nombre);
  const imagenValidada = validarUrlImagenOpcional(imagenUrl);

  await verificarTipoCancha(tenantId, tipoCanchaId);

  return prisma.cancha.create({
    data: { tenantId, nombre: nombreValidado, tipoCanchaId, imagenUrl: imagenValidada },
    include: { tipoCancha: true },
  });
}

async function actualizar(tenantId, id, { nombre, tipoCanchaId, activa, imagenUrl }) {
  const data = {};
  if (nombre !== undefined) data.nombre = validarNombre(nombre);
  if (activa !== undefined) data.activa = activa;
  if (imagenUrl !== undefined) data.imagenUrl = validarUrlImagenOpcional(imagenUrl);
  if (tipoCanchaId !== undefined) {
    await verificarTipoCancha(tenantId, tipoCanchaId);
    data.tipoCanchaId = tipoCanchaId;
  }
  if (Object.keys(data).length === 0) throw crearError('nada para actualizar', 400);

  const resultado = await prisma.cancha.updateMany({ where: { id, tenantId }, data });
  if (resultado.count === 0) throw crearError('Cancha no encontrada', 404);

  return prisma.cancha.findUnique({ where: { id }, include: { tipoCancha: true } });
}

async function desactivar(tenantId, id) {
  const resultado = await prisma.cancha.updateMany({
    where: { id, tenantId },
    data: { activa: false },
  });
  if (resultado.count === 0) throw crearError('Cancha no encontrada', 404);

  return prisma.cancha.findUnique({ where: { id } });
}

module.exports = { listar, crear, actualizar, desactivar };
