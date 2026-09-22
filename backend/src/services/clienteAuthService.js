const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { obtenerTenantPorDefecto } = require('./tenantService');
const { enviarWhatsapp } = require('./whatsappService');

const OTP_EXPIRACION_MINUTOS = 5;
const JWT_EXPIRES_IN = '30d';

function crearError(mensaje, statusCode) {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  return error;
}

function generarCodigoOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const TELEFONO_REGEX = /^\d{10}$/;

function validarTelefono(telefono) {
  if (!telefono || !TELEFONO_REGEX.test(telefono)) {
    throw crearError('telefono debe tener exactamente 10 dígitos', 400);
  }
}

// Registro + login unificados: si el teléfono no existe, se registra con el
// nombre recibido; si ya existe, se ignora el nombre y se sigue directo al OTP.
async function solicitarOtp({ telefono, nombre }) {
  validarTelefono(telefono);

  const tenant = await obtenerTenantPorDefecto();

  let cliente = await prisma.cliente.findUnique({
    where: { tenantId_telefono: { tenantId: tenant.id, telefono } },
  });

  let esNuevoRegistro = false;
  if (!cliente) {
    if (!nombre) throw crearError('nombre es requerido para registrarte', 400);
    cliente = await prisma.cliente.create({
      data: { tenantId: tenant.id, telefono, nombre },
    });
    esNuevoRegistro = true;
  }

  // invalida códigos previos sin usar para que solo el último emitido sea válido
  await prisma.codigoVerificacion.updateMany({
    where: { clienteId: cliente.id, usado: false },
    data: { usado: true },
  });

  const codigo = generarCodigoOtp();
  const expiraEn = new Date(Date.now() + OTP_EXPIRACION_MINUTOS * 60000);

  await prisma.codigoVerificacion.create({
    data: { clienteId: cliente.id, codigo, expiraEn },
  });

  await enviarWhatsapp(
    telefono,
    `Tu código para reservar es *${codigo}*. Vence en ${OTP_EXPIRACION_MINUTOS} minutos.`
  );

  return {
    clienteId: cliente.id,
    telefono: cliente.telefono,
    esNuevoRegistro,
    expiraEnMinutos: OTP_EXPIRACION_MINUTOS,
  };
}

async function verificarOtp({ telefono, codigo }) {
  if (!telefono || !codigo) throw crearError('telefono y codigo son requeridos', 400);

  const tenant = await obtenerTenantPorDefecto();

  const cliente = await prisma.cliente.findUnique({
    where: { tenantId_telefono: { tenantId: tenant.id, telefono } },
  });
  if (!cliente) return null;

  const codigoValido = await prisma.codigoVerificacion.findFirst({
    where: {
      clienteId: cliente.id,
      codigo,
      usado: false,
      expiraEn: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!codigoValido) return null;

  await prisma.codigoVerificacion.update({
    where: { id: codigoValido.id },
    data: { usado: true },
  });

  const payload = { clienteId: cliente.id, tenantId: cliente.tenantId, telefono: cliente.telefono };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    token,
    cliente: {
      id: cliente.id,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      email: cliente.email,
    },
  };
}

module.exports = { solicitarOtp, verificarOtp };
