const prisma = require('../config/prisma');

// TEMPORAL: hasta que el sistema se venda a más de un negocio, todo el flujo
// de cliente opera sobre el único tenant existente. Cuando haya más de uno,
// esto debe reemplazarse por una resolución real (subdominio, dominio propio, etc).
async function obtenerTenantPorDefecto() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    throw new Error('No hay ningún tenant configurado. Corré "npx prisma db seed" primero.');
  }
  return tenant;
}

module.exports = { obtenerTenantPorDefecto };
