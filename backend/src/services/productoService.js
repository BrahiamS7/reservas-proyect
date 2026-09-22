const prisma = require('../config/prisma');

async function listarDisponibles(tenantId) {
  return prisma.producto.findMany({
    where: { tenantId, disponible: true, stock: { gt: 0 } },
    orderBy: { nombre: 'asc' },
    select: { id: true, nombre: true, precio: true, imagenUrl: true },
  });
}

module.exports = { listarDisponibles };
