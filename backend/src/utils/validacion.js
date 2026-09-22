function crearError(mensaje, statusCode) {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  return error;
}

const NOMBRE_REGEX = /^[\p{L}\p{N} ]+$/u;

function validarNombreSimple(nombre, etiqueta = 'nombre') {
  const limpio = (nombre || '').trim();
  if (!limpio) throw crearError(`${etiqueta} es requerido`, 400);
  if (!NOMBRE_REGEX.test(limpio)) {
    throw crearError(`El ${etiqueta} solo puede tener letras, números y espacios`, 400);
  }
  return limpio;
}

function validarUrlImagenOpcional(url) {
  if (url === undefined || url === null || url === '') return null;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('protocolo inválido');
  } catch {
    throw crearError('imagenUrl debe ser una URL válida (http/https)', 400);
  }
  return url;
}

module.exports = { crearError, validarNombreSimple, validarUrlImagenOpcional };
