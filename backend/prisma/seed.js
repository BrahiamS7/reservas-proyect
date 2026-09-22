require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../src/config/prisma');

async function main() {
  const tenantNombre = process.env.TENANT_NOMBRE || 'Complejo Deportivo Demo';
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error('ADMIN_EMAIL y ADMIN_PASSWORD deben estar definidos en .env para correr el seed');
  }

  let tenant = await prisma.tenant.findFirst({ where: { nombre: tenantNombre } });
  if (!tenant) {
    tenant = await prisma.tenant.create({ data: { nombre: tenantNombre } });
    console.log(`Tenant creado: ${tenant.nombre} (${tenant.id})`);
  } else {
    console.log(`Tenant ya existía: ${tenant.nombre} (${tenant.id})`);
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.usuarioAdmin.upsert({
    where: { email: adminEmail },
    update: { passwordHash, tenantId: tenant.id },
    create: {
      tenantId: tenant.id,
      nombre: 'Administrador',
      email: adminEmail,
      passwordHash,
    },
  });
  console.log(`Admin listo: ${admin.email}`);

  const horaApertura = new Date(Date.UTC(1970, 0, 1, 8, 0, 0));
  const horaCierre = new Date(Date.UTC(1970, 0, 1, 23, 0, 0));

  for (let diaSemana = 0; diaSemana <= 6; diaSemana++) {
    const existente = await prisma.horarioOperacion.findFirst({ where: { tenantId: tenant.id, diaSemana } });
    if (!existente) {
      await prisma.horarioOperacion.create({
        data: { tenantId: tenant.id, diaSemana, horaInicio: horaApertura, horaFin: horaCierre },
      });
    }
  }
  console.log('Horario de operación (todos los días, 08:00-23:00) listo');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
