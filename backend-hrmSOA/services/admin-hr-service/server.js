require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const adminRoutes = require('./src/routes/admin');

const PORT = process.env.PORT || 5003;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'admin-hr' }));

app.use('/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ message: 'Admin service error' });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Admin HR service listening on port ${PORT}`);
});

