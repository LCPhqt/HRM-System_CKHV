require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { connectAndSeed } = require('./src/config/db');
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');

const PORT = process.env.PORT || 5001;

async function start() {
  await connectAndSeed();
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'identity' }));

  app.use('/auth', authRoutes);
  app.use('/users', userRoutes);

  app.use((err, _req, res, _next) => {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ message: 'Identity service error' });
  });

  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Identity service listening on port ${PORT}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start identity service', err);
  process.exit(1);
});

