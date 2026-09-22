const express = require('express');
const cors = require('cors');
const prisma = require('./config/prisma');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const clienteAuthRoutes = require('./routes/clienteAuthRoutes');
const tipoCanchaRoutes = require('./routes/tipoCanchaRoutes');
const canchaRoutes = require('./routes/canchaRoutes');
const clienteCanchaRoutes = require('./routes/clienteCanchaRoutes');
const adminReservaRoutes = require('./routes/adminReservaRoutes');
const clienteReservaRoutes = require('./routes/clienteReservaRoutes');
const clienteProductoRoutes = require('./routes/clienteProductoRoutes');
const adminProductoRoutes = require('./routes/adminProductoRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

app.use('/api/admin', adminAuthRoutes);
app.use('/api/cliente', clienteAuthRoutes);
app.use('/api/admin/tipos-cancha', tipoCanchaRoutes);
app.use('/api/admin/canchas', canchaRoutes);
app.use('/api/cliente', clienteCanchaRoutes);
app.use('/api/admin/reservas', adminReservaRoutes);
app.use('/api/cliente/reservas', clienteReservaRoutes);
app.use('/api/cliente/productos', clienteProductoRoutes);
app.use('/api/admin/productos', adminProductoRoutes);

module.exports = app;
