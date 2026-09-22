const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const JWT_EXPIRES_IN = '8h';

async function login(email, password) {
  const admin = await prisma.usuarioAdmin.findUnique({ where: { email } });
  if (!admin) return null;

  const passwordValida = await bcrypt.compare(password, admin.passwordHash);
  if (!passwordValida) return null;

  const payload = {
    adminId: admin.id,
    tenantId: admin.tenantId,
    email: admin.email,
    rol: admin.rol,
  };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    token,
    admin: {
      id: admin.id,
      nombre: admin.nombre,
      email: admin.email,
      rol: admin.rol,
      tenantId: admin.tenantId,
    },
  };
}

module.exports = { login };
