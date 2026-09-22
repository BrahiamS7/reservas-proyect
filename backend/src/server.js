require('dotenv').config();

const app = require('./app');
const recordatorioWhatsappJob = require('./jobs/recordatorioWhatsappJob');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  recordatorioWhatsappJob.iniciar();
});
