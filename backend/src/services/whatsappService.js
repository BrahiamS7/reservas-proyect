// Envío de WhatsApp vía la API oficial de Meta (WhatsApp Cloud API).
// Si no hay credenciales en .env, o el envío falla, el mensaje se imprime en
// consola para poder seguir probando el flujo completo.
//
// TEMPORAL: código de país fijo en Colombia (57), igual que timezone.js.
// Si se revende a un negocio en otro país, esto debería ser un campo por Tenant.
const CODIGO_PAIS = '57';
const GRAPH_VERSION = 'v23.0';

async function enviarWhatsapp(telefono, mensaje) {
  const { WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID } = process.env;

  if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    console.log(`[WHATSAPP MOCK] -> ${telefono}: ${mensaje}`);
    return;
  }

  try {
    const respuesta = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: `${CODIGO_PAIS}${telefono}`,
          type: 'text',
          text: { body: mensaje },
        }),
      }
    );

    if (!respuesta.ok) {
      const detalle = await respuesta.json().catch(() => ({}));
      throw new Error(detalle.error?.message || `HTTP ${respuesta.status}`);
    }
  } catch (error) {
    console.error(`[WHATSAPP ERROR] No se pudo enviar a ${telefono}: ${error.message}`);
    console.log(`[WHATSAPP FALLBACK] -> ${telefono}: ${mensaje}`);
  }
}

module.exports = { enviarWhatsapp };
