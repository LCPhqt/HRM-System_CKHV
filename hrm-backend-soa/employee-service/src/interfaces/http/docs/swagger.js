const swaggerUi = require('swagger-ui-express');

// Minimal OpenAPI spec for demo; expand as needed.
const spec = {
  openapi: '3.0.0',
  info: {
    title: 'Employee Service API',
    version: '1.0.0',
  },
  paths: {
    '/api/health': {
      get: {
        summary: 'Health check',
        responses: {
          200: { description: 'Service is healthy' },
        },
      },
    },
    '/api/employees': {
      get: {
        summary: 'List employees',
        responses: {
          200: { description: 'List employees' },
        },
      },
      post: {
        summary: 'Create employee',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  departmentId: { type: 'string' },
                  positionId: { type: 'string' },
                  status: { type: 'string' },
                },
                required: ['name', 'email'],
              },
            },
          },
        },
        responses: {
          201: { description: 'Created' },
        },
      },
    },
    '/api/employees/{id}': {
      get: {
        summary: 'Get employee by id',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } },
      },
      patch: {
        summary: 'Update employee',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { type: 'object' } },
          },
        },
        responses: { 200: { description: 'Updated' }, 404: { description: 'Not found' } },
      },
      delete: {
        summary: 'Delete employee',
        parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
        responses: { 204: { description: 'Deleted' }, 404: { description: 'Not found' } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  security: [{ bearerAuth: [] }],
};

const swaggerDocs = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(spec),
};

module.exports = swaggerDocs;
