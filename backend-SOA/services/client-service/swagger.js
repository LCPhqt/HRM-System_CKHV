/**
 * Swagger Configuration for Client Service
 * Port: 5007
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Client Service API',
      version: '1.0.0',
      description: `
## 🤝 Client Service

Quản lý khách hàng:
- CRUD khách hàng
- Import/Export khách hàng
- Thống kê theo trạng thái
- Soft delete & restore
- Audit logs

**Port:** 5007

### Phân quyền:
- **Staff**: Chỉ xem/quản lý khách hàng của mình
- **Admin**: Xem/quản lý tất cả khách hàng
      `
    },
    servers: [
      { url: 'http://localhost:5007', description: 'Client Service (Direct)' },
      { url: 'http://localhost:4000', description: 'Via Gateway' }
    ],
    tags: [
      { name: 'Customers', description: 'CRUD khách hàng' },
      { name: 'Import/Export', description: 'Import và thống kê' },
      { name: 'Trash', description: 'Quản lý khách hàng đã xóa (Admin)' },
      { name: 'Audit', description: 'Lịch sử thao tác' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      },
      schemas: {
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Công ty ABC' },
            cccd: { type: 'string', example: '079123456789' },
            email: { type: 'string', example: 'contact@abc.com' },
            phone: { type: 'string', example: '028-12345678' },
            address: { type: 'string', example: '456 Lê Lợi, Q1, TP.HCM' },
            ownerId: { type: 'string', example: '507f1f77bcf86cd799439010', description: 'ID nhân viên phụ trách' },
            ownerName: { type: 'string', example: 'staff@example.com' },
            status: { type: 'string', enum: ['lead', 'active', 'inactive'], example: 'active' },
            deleted: { type: 'boolean', example: false },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
            deletedBy: { type: 'string', nullable: true },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        CustomerCreate: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Công ty XYZ' },
            cccd: { type: 'string', example: '079987654321' },
            email: { type: 'string', example: 'contact@xyz.com' },
            phone: { type: 'string', example: '028-87654321' },
            address: { type: 'string', example: '789 Pasteur, Q3, TP.HCM' },
            ownerId: { type: 'string', description: 'Admin: có thể set. Staff: auto-assign từ token' },
            ownerName: { type: 'string', description: 'Admin: có thể set' },
            status: { type: 'string', enum: ['lead', 'active', 'inactive'], default: 'lead' }
          }
        },
        CustomerUpdate: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            cccd: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            ownerId: { type: 'string', description: 'Chỉ Admin được thay đổi' },
            ownerName: { type: 'string', description: 'Chỉ Admin được thay đổi' },
            status: { type: 'string', enum: ['lead', 'active', 'inactive'] }
          }
        },
        CustomerStats: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 100 },
            active: { type: 'integer', example: 45 },
            lead: { type: 'integer', example: 35 },
            inactive: { type: 'integer', example: 15 },
            other: { type: 'integer', example: 5 },
            activePercent: { type: 'number', example: 45.0 },
            leadPercent: { type: 'number', example: 35.0 },
            inactivePercent: { type: 'number', example: 15.0 },
            otherPercent: { type: 'number', example: 5.0 }
          }
        },
        ImportRequest: {
          oneOf: [
            {
              type: 'array',
              items: { $ref: '#/components/schemas/CustomerCreate' },
              example: [{ name: 'KH1', email: 'kh1@mail.com' }, { name: 'KH2', phone: '0901234567' }]
            },
            {
              type: 'object',
              properties: {
                customers: { type: 'array', items: { $ref: '#/components/schemas/CustomerCreate' } }
              }
            }
          ]
        },
        ImportReport: {
          type: 'object',
          properties: {
            createdCount: { type: 'integer', example: 10 },
            skippedCount: { type: 'integer', example: 2 },
            errorCount: { type: 'integer', example: 0 },
            created: { type: 'array', items: { $ref: '#/components/schemas/Customer' } },
            skipped: { type: 'array', items: { type: 'object' } }
          }
        },
        AuditLog: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            customerId: { type: 'string' },
            action: { type: 'string', enum: ['create', 'update', 'delete', 'restore', 'import', 'hard_delete'] },
            actorId: { type: 'string' },
            actorEmail: { type: 'string' },
            before: { type: 'object', nullable: true },
            after: { type: 'object', nullable: true },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        BulkIds: {
          type: 'object',
          required: ['ids'],
          properties: {
            ids: { type: 'array', items: { type: 'string' }, example: ['id1', 'id2', 'id3'] }
          }
        },
        BulkResult: {
          type: 'object',
          properties: {
            restoredCount: { type: 'integer' },
            deletedCount: { type: 'integer' },
            skippedCount: { type: 'integer' },
            skipped: { type: 'array', items: { type: 'object' } }
          }
        },
        Count: {
          type: 'object',
          properties: { count: { type: 'integer', example: 42 } }
        },
        Error: {
          type: 'object',
          properties: { message: { type: 'string' } }
        },
        Success: {
          type: 'object',
          properties: { message: { type: 'string' } }
        }
      }
    },
    paths: {
      '/client/customers': {
        get: {
          tags: ['Customers'],
          summary: 'Danh sách khách hàng',
          description: 'Staff: chỉ thấy khách hàng của mình. Admin: thấy tất cả.',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Tìm theo tên, email, phone' },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['lead', 'active', 'inactive'] } },
            { name: 'ownerId', in: 'query', schema: { type: 'string' }, description: 'Filter theo owner (Admin only)' },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
          ],
          responses: {
            200: { content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Customer' } } } } }
          }
        },
        post: {
          tags: ['Customers'],
          summary: 'Tạo khách hàng mới',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerCreate' } } }
          },
          responses: {
            201: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Customer' } } } },
            400: { description: 'Khách hàng đã tồn tại' }
          }
        }
      },
      '/client/customers/count': {
        get: {
          tags: ['Customers'],
          summary: 'Đếm số lượng khách hàng',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'ownerId', in: 'query', schema: { type: 'string' } }
          ],
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Count' } } } }
          }
        }
      },
      '/client/customers/stats': {
        get: {
          tags: ['Import/Export'],
          summary: 'Thống kê theo trạng thái',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'ownerId', in: 'query', schema: { type: 'string' } }
          ],
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerStats' } } } }
          }
        }
      },
      '/client/customers/import': {
        post: {
          tags: ['Import/Export'],
          summary: 'Import nhiều khách hàng',
          description: 'Body là array hoặc { customers: [...] }. Staff: auto-assign ownerId.',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ImportRequest' } } }
          },
          responses: {
            201: { content: { 'application/json': { schema: { $ref: '#/components/schemas/ImportReport' } } } }
          }
        }
      },
      '/client/customers/deleted': {
        get: {
          tags: ['Trash'],
          summary: 'Danh sách đã xóa (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'ownerId', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } }
          ],
          responses: {
            200: { content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Customer' } } } } },
            403: { description: 'Chỉ Admin' }
          }
        }
      },
      '/client/customers/restore/bulk': {
        post: {
          tags: ['Trash'],
          summary: 'Khôi phục nhiều KH (Admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/BulkIds' } } }
          },
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/BulkResult' } } } }
          }
        }
      },
      '/client/customers/hard/bulk': {
        post: {
          tags: ['Trash'],
          summary: 'Xóa vĩnh viễn nhiều KH (Admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/BulkIds' } } }
          },
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/BulkResult' } } } }
          }
        }
      },
      '/client/customers/{id}': {
        get: {
          tags: ['Customers'],
          summary: 'Chi tiết khách hàng',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Customer' } } } },
            403: { description: 'Không có quyền xem' },
            404: { description: 'Không tìm thấy' }
          }
        },
        put: {
          tags: ['Customers'],
          summary: 'Cập nhật khách hàng',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerUpdate' } } } },
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Customer' } } } },
            403: { description: 'Không có quyền sửa' }
          }
        },
        delete: {
          tags: ['Customers'],
          summary: 'Xóa mềm khách hàng',
          description: 'Đánh dấu deleted=true, có thể restore',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } }
          }
        }
      },
      '/client/customers/{id}/logs': {
        get: {
          tags: ['Audit'],
          summary: 'Lịch sử thao tác',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'action', in: 'query', schema: { type: 'string' } },
            { name: 'actorId', in: 'query', schema: { type: 'string' } },
            { name: 'from', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'to', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } }
          ],
          responses: {
            200: { content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } } } } }
          }
        }
      },
      '/client/customers/{id}/restore': {
        post: {
          tags: ['Trash'],
          summary: 'Khôi phục 1 KH (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Customer' } } } }
          }
        }
      },
      '/client/customers/{id}/hard': {
        delete: {
          tags: ['Trash'],
          summary: 'Xóa vĩnh viễn 1 KH (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Success' } } } }
          }
        }
      }
    }
  },
  apis: []
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Client Service API',
    swaggerOptions: { persistAuthorization: true, displayRequestDuration: true }
  }));

  console.log('📚 Swagger UI: http://localhost:5007/api-docs');
}

module.exports = { setupSwagger, swaggerSpec };

