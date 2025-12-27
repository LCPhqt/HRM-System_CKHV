console.log("✅ PROFILE SERVICE UPDATED - RUNNING CORRECT FILE");
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { connect } = require('./src/config/db');
const profileRoutes = require('./src/routes/profiles');
const departmentRoutes = require("./src/routes/departments");

const PORT = process.env.PORT || 5002;

async function start() {
  await connect();
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'profile' }));

  app.use('/profiles', profileRoutes);
  app.use("/departments", departmentRoutes);

  app.use((err, _req, res, _next) => {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ message: 'Profile service error' });
  });

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Profile service listening on port ${PORT}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start profile service', err);
  process.exit(1);
});

