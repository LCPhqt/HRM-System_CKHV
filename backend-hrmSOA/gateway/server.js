console.log("✅ GATEWAY UPDATED - DEPARTMENTS ROUTE ENABLED");
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const {
  PORT = 4000,
  IDENTITY_SERVICE_URL = 'http://localhost:5001',
  PROFILE_SERVICE_URL = 'http://localhost:5002',
  ADMIN_HR_SERVICE_URL = 'http://localhost:5003',
  PAYROLL_SERVICE_URL = 'http://localhost:5004'
} = process.env;

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Helper to forward parsed JSON body to proxied services
const proxyWithBody = (target) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    onProxyReq: (proxyReq, req) => {
      if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    }
  });

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'gateway' }));

app.use('/auth', proxyWithBody(IDENTITY_SERVICE_URL));
app.use('/users', proxyWithBody(IDENTITY_SERVICE_URL));
app.use('/profiles', proxyWithBody(PROFILE_SERVICE_URL));
app.use('/admin', proxyWithBody(ADMIN_HR_SERVICE_URL));
app.use('/payroll', proxyWithBody(PAYROLL_SERVICE_URL));

app.use('/departments', proxyWithBody(PROFILE_SERVICE_URL));  

app.use((err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ message: 'Gateway error' });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Gateway listening on port ${PORT}`);
});

