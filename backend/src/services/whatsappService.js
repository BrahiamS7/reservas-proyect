// Envío de WhatsApp vía Twilio Sandbox (gratuito para desarrollo/pruebas).
// Si no hay credenciales configuradas en .env, cae a un mock por consola
// para poder seguir probando el flujo sin depender de Twilio.
//
// TEMPORAL: código de país fijo en Colombia (+57), igual que timezone.js.
// Si se revende a un negocio en otro país, esto debería ser un campo por Tenant.
const CODIGO_PAIS = '57';

let clienteTwilio = null;

function obtenerClienteTwilio() {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) return null;

  if (!clienteTwilio) {
    const twilio = require('twilio');
    clienteTwilio = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return clienteTwilio;
}

function numeroWhatsapp(telefono) {
  return `whatsapp:+${CODIGO_PAIS}${telefono}`;
}

async function enviarWhatsapp(telefono, mensaje) {
  const client = obtenerClienteTwilio();
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!client || !from) {
    console.log(`[WHATSAPP MOCK] -> ${telefono}: ${mensaje}`);
    return;
  }

  try {
    await client.messages.create({ from, to: numeroWhatsapp(telefono), body: mensaje });
  } catch (error) {
    console.error(`[WHATSAPP ERROR] No se pudo enviar a ${telefono}: ${error.message}`);
  }
}

module.exports = { enviarWhatsapp };
