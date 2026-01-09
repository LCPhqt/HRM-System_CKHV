/**
 * Swagger Configuration for HRM-CRM-MVP Backend SOA
 * 
 * Tích hợp Swagger UI vào Gateway để document toàn bộ API
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'HRM-Client-MVP API Documentation',
      version: '1.0.0',
      description: `
## 🏢 Hệ thống quản lý Nhân sự (HRM) và Khách hàng (Client)

Đây là tài liệu API cho hệ thống HRM-Client-MVP được xây dựng theo kiến trúc **Service-Oriented Architecture (SOA)**.

### 📦 Các Service:
- **Identity Service** (Port 5001): Xác thực và quản lý user
- **Profile Service** (Port 5002): Quản lý hồ sơ nhân viên
- **Admin HR Service** (Port 5003): Quản lý nhân sự cho Admin
- **Payroll Service** (Port 5004): Quản lý bảng lương
- **Department Service** (Port 5006): Quản lý phòng ban
- **Client Service** (Port 5007): Quản lý khách hàng

### 🔐 Xác thực:
Sử dụng **JWT Bearer Token**. Sau khi đăng nhập, thêm token vào header:
\`\`\`
Authorization: Bearer <your_token>
\`\`\`
      `,
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Gateway Server (Development)'
      }
    ],
    tags: [
      { name: 'Auth', description: 'Xác thực người dùng (đăng ký, đăng nhập)' },
      { name: 'Users', description: 'Quản lý tài khoản người dùng (Admin only)' },
      { name: 'Profiles', description: 'Quản lý hồ sơ nhân viên' },
      { name: 'Departments', description: 'Quản lý phòng ban' },
      { name: 'Employees', description: 'Quản lý nhân viên (Admin only)' },
      { name: 'Payroll', description: 'Quản lý bảng lương (Admin only)' },
      { name: 'Clients', description: 'Quản lý khách hàng' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT token sau khi đăng nhập'
        }
      },
      schemas: {
        // ============ AUTH SCHEMAS ============
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'confirm_password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', minLength: 6, example: 'password123' },
            confirm_password: { type: 'string', example: 'password123' },
            full_name: { type: 'string', example: 'Nguyễn Văn A' }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', example: 'password123' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            role: { type: 'string', enum: ['admin', 'staff'], example: 'staff' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', example: 'user@example.com' },
            role: { type: 'string', enum: ['admin', 'staff'], example: 'staff' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },

        // ============ PROFILE SCHEMAS ============
        Profile: {
          type: 'object',
          properties: {
            user_id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', example: 'user@example.com' },
            full_name: { type: 'string', example: 'Nguyễn Văn A' },
            phone: { type: 'string', example: '0901234567' },
            address: { type: 'string', example: '123 Nguyễn Huệ, Q1, TP.HCM' },
            department: { type: 'string', example: 'Phòng IT' },
            position: { type: 'string', example: 'Developer' },
            status: { type: 'string', enum: ['working', 'resigned', 'on_leave'], example: 'working' },
            avatar_url: { type: 'string', example: 'https://example.com/avatar.jpg' },
            date_of_birth: { type: 'string', format: 'date', example: '1990-01-15' },
            start_date: { type: 'string', format: 'date', example: '2022-01-01' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        ProfileUpdate: {
          type: 'object',
          properties: {
            full_name: { type: 'string', example: 'Nguyễn Văn A' },
            phone: { type: 'string', example: '0901234567' },
            address: { type: 'string', example: '123 Nguyễn Huệ, Q1, TP.HCM' },
            department: { type: 'string', example: 'Phòng IT' },
            position: { type: 'string', example: 'Developer' },
            avatar_url: { type: 'string', example: 'https://example.com/avatar.jpg' },
            date_of_birth: { type: 'string', format: 'date', example: '1990-01-15' }
          }
        },

        // ============ DEPARTMENT SCHEMAS ============
        Department: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Phòng IT' },
            code: { type: 'string', example: 'IT' },
            parentId: { type: 'string', nullable: true, example: null },
            location: { type: 'string', example: 'Tầng 5, Tòa A' },
            manager: { type: 'string', example: 'Trần Văn B' },
            staffCount: { type: 'integer', example: 15 },
            description: { type: 'string', example: 'Phòng công nghệ thông tin' },
            status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        DepartmentCreate: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Phòng Marketing' },
            code: { type: 'string', example: 'MKT' },
            parentId: { type: 'string', nullable: true },
            location: { type: 'string', example: 'Tầng 3, Tòa B' },
            manager: { type: 'string', example: 'Lê Văn C' },
            staffCount: { type: 'integer', example: 10 },
            description: { type: 'string', example: 'Phòng tiếp thị và truyền thông' },
            status: { type: 'string', enum: ['active', 'inactive'], default: 'active' }
          }
        },

        // ============ EMPLOYEE SCHEMAS ============
        Employee: {
          type: 'object',
          properties: {
            user_id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', example: 'employee@example.com' },
            full_name: { type: 'string', example: 'Phạm Văn D' },
            department: { type: 'string', example: 'Phòng IT' },
            position: { type: 'string', example: 'Senior Developer' },
            status: { type: 'string', enum: ['working', 'resigned', 'on_leave'], example: 'working' }
          }
        },
        EmployeeCreate: {
          type: 'object',
          required: ['email', 'password', 'full_name'],
          properties: {
            email: { type: 'string', format: 'email', example: 'newemployee@example.com' },
            password: { type: 'string', example: 'password123' },
            full_name: { type: 'string', example: 'Hoàng Văn E' },
            phone: { type: 'string', example: '0909876543' },
            department: { type: 'string', example: 'Phòng HR' },
            position: { type: 'string', example: 'HR Manager' }
          }
        },

        // ============ PAYROLL SCHEMAS ============
        PayrollRun: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            period: { type: 'string', example: '2025-01' },
            title: { type: 'string', example: 'Lương tháng 01/2025' },
            status: { type: 'string', enum: ['draft', 'processing', 'completed'], example: 'draft' },
            created_at: { type: 'string', format: 'date-time' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/PayrollItem' }
            }
          }
        },
        PayrollRunCreate: {
          type: 'object',
          required: ['period'],
          properties: {
            period: { type: 'string', example: '2025-01', description: 'Định dạng YYYY-MM' },
            title: { type: 'string', example: 'Lương tháng 01/2025' }
          }
        },
        PayrollItem: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439012' },
            user_id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            full_name: { type: 'string', example: 'Nguyễn Văn A' },
            email: { type: 'string', example: 'user@example.com' },
            department: { type: 'string', example: 'Phòng IT' },
            position: { type: 'string', example: 'Developer' },
            base_salary: { type: 'number', example: 20000000 },
            bonus: { type: 'number', example: 2000000 },
            deductions: { type: 'number', example: 500000 },
            net: { type: 'number', example: 21500000 },
            status: { type: 'string', enum: ['pending', 'approved', 'paid'], example: 'pending' }
          }
        },
        PayrollItemUpsert: {
          type: 'object',
          required: ['user_id', 'email'],
          properties: {
            user_id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', example: 'user@example.com' },
            full_name: { type: 'string', example: 'Nguyễn Văn A' },
            department: { type: 'string', example: 'Phòng IT' },
            position: { type: 'string', example: 'Developer' },
            base_salary: { type: 'number', example: 20000000 },
            bonus: { type: 'number', example: 2000000 },
            deductions: { type: 'number', example: 500000 }
          }
        },

        // ============ CUSTOMER SCHEMAS ============
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'Công ty ABC' },
            cccd: { type: 'string', example: '079123456789' },
            email: { type: 'string', example: 'contact@abc.com' },
            phone: { type: 'string', example: '028-12345678' },
            address: { type: 'string', example: '456 Lê Lợi, Q1, TP.HCM' },
            ownerId: { type: 'string', example: '507f1f77bcf86cd799439010' },
            ownerName: { type: 'string', example: 'staff@example.com' },
            status: { type: 'string', enum: ['lead', 'active', 'inactive'], example: 'active' },
            deleted: { type: 'boolean', example: false },
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
            ownerId: { type: 'string', description: 'Chỉ Admin được set (Staff auto-assign từ token)' },
            ownerName: { type: 'string', description: 'Chỉ Admin được set' },
            status: { type: 'string', enum: ['lead', 'active', 'inactive'], default: 'lead' }
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
        CustomerImportReport: {
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

        // ============ COMMON SCHEMAS ============
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Có lỗi xảy ra' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Thao tác thành công' }
          }
        },
        BulkIds: {
          type: 'object',
          required: ['ids'],
          properties: {
            ids: {
              type: 'array',
              items: { type: 'string' },
              example: ['id1', 'id2', 'id3']
            }
          }
        }
      }
    },
    paths: {
      // ============ AUTH ENDPOINTS ============
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Đăng ký tài khoản mới',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterRequest' }
              }
            }
          },
          responses: {
            201: {
              description: 'Đăng ký thành công',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } }
            },
            400: { description: 'Dữ liệu không hợp lệ', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } }
          }
        }
      },
      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Đăng nhập',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' }
              }
            }
          },
          responses: {
            200: {
              description: 'Đăng nhập thành công',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } }
            },
            400: { description: 'Email hoặc mật khẩu không đúng' },
            401: { description: 'Unauthorized' }
          }
        }
      },
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Lấy thông tin user hiện tại',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Thành công',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } }
            },
            401: { description: 'Chưa đăng nhập' }
          }
        }
      },

      // ============ USERS ENDPOINTS (Admin Only) ============
      '/users': {
        get: {
          tags: ['Users'],
          summary: 'Danh sách tất cả user (Admin)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Thành công',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/User' } }
                }
              }
            },
            403: { description: 'Forbidden - Chỉ Admin' }
          }
        }
      },
      '/users/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Chi tiết user (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            404: { description: 'Không tìm thấy user' }
          }
        },
        put: {
          tags: ['Users'],
          summary: 'Cập nhật user (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    role: { type: 'string', enum: ['admin', 'staff'] }
                  }
                }
              }
            }
          },
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            404: { description: 'Không tìm thấy user' }
          }
        },
        delete: {
          tags: ['Users'],
          summary: 'Xóa user (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Xóa thành công' },
            404: { description: 'Không tìm thấy user' }
          }
        }
      },

      // ============ PROFILES ENDPOINTS ============
      '/profiles/me': {
        get: {
          tags: ['Profiles'],
          summary: 'Lấy profile của tôi',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Profile' } } } },
            404: { description: 'Profile không tồn tại' }
          }
        },
        put: {
          tags: ['Profiles'],
          summary: 'Cập nhật profile của tôi',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ProfileUpdate' } } }
          },
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Profile' } } } }
          }
        }
      },
      '/profiles/public': {
        get: {
          tags: ['Profiles'],
          summary: 'Danh sách profile công khai (Staff & Admin)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'Danh sách profile rút gọn',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        user_id: { type: 'string' },
                        email: { type: 'string' },
                        full_name: { type: 'string' },
                        department: { type: 'string' },
                        position: { type: 'string' },
                        status: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/profiles': {
        get: {
          tags: ['Profiles'],
          summary: 'Danh sách đầy đủ profiles (Admin)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Profile' } } } } },
            403: { description: 'Chỉ Admin' }
          }
        }
      },
      '/profiles/{id}': {
        get: {
          tags: ['Profiles'],
          summary: 'Chi tiết profile (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Profile' } } } },
            404: { description: 'Không tìm thấy' }
          }
        },
        put: {
          tags: ['Profiles'],
          summary: 'Admin cập nhật profile',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/ProfileUpdate' } } } },
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Profile' } } } }
          }
        },
        delete: {
          tags: ['Profiles'],
          summary: 'Xóa profile (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Xóa thành công' }
          }
        }
      },
      '/profiles/bootstrap': {
        post: {
          tags: ['Profiles'],
          summary: 'Bootstrap profile (Internal use)',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['user_id', 'email'],
                  properties: {
                    user_id: { type: 'string' },
                    email: { type: 'string' },
                    full_name: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: { 201: { description: 'Tạo thành công' } }
        }
      },

      // ============ DEPARTMENTS ENDPOINTS ============
      '/departments': {
        get: {
          tags: ['Departments'],
          summary: 'Danh sách phòng ban',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Department' } } } } }
          }
        },
        post: {
          tags: ['Departments'],
          summary: 'Tạo phòng ban mới (Admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/DepartmentCreate' } } }
          },
          responses: {
            201: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Department' } } } },
            400: { description: 'Tên hoặc mã phòng ban đã tồn tại' }
          }
        }
      },
      '/departments/{id}': {
        get: {
          tags: ['Departments'],
          summary: 'Chi tiết phòng ban',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Department' } } } },
            404: { description: 'Không tìm thấy' }
          }
        },
        put: {
          tags: ['Departments'],
          summary: 'Cập nhật phòng ban (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/DepartmentCreate' } } } },
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Department' } } } }
          }
        },
        delete: {
          tags: ['Departments'],
          summary: 'Xóa phòng ban (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Xóa thành công' }
          }
        }
      },

      // ============ ADMIN EMPLOYEES ENDPOINTS ============
      '/admin/employees': {
        get: {
          tags: ['Employees'],
          summary: 'Danh sách nhân viên (Admin)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Employee' } } } } }
          }
        },
        post: {
          tags: ['Employees'],
          summary: 'Tạo nhân viên mới (Admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/EmployeeCreate' } } }
          },
          responses: {
            201: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Employee' } } } }
          }
        }
      },
      '/admin/employees/{id}': {
        get: {
          tags: ['Employees'],
          summary: 'Chi tiết nhân viên (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Employee' } } } }
          }
        },
        put: {
          tags: ['Employees'],
          summary: 'Cập nhật nhân viên (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/ProfileUpdate' } } } },
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Employee' } } } }
          }
        },
        delete: {
          tags: ['Employees'],
          summary: 'Xóa nhân viên (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Xóa thành công' }
          }
        }
      },

      // ============ PAYROLL ENDPOINTS ============
      '/payroll/runs': {
        get: {
          tags: ['Payroll'],
          summary: 'Danh sách kỳ lương (Admin)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/PayrollRun' } } } } }
          }
        },
        post: {
          tags: ['Payroll'],
          summary: 'Tạo kỳ lương mới (Admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PayrollRunCreate' } } }
          },
          responses: {
            201: { content: { 'application/json': { schema: { $ref: '#/components/schemas/PayrollRun' } } } }
          }
        }
      },
      '/payroll/runs/{id}': {
        get: {
          tags: ['Payroll'],
          summary: 'Chi tiết kỳ lương (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/PayrollRun' } } } }
          }
        },
        put: {
          tags: ['Payroll'],
          summary: 'Cập nhật kỳ lương (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    status: { type: 'string', enum: ['draft', 'processing', 'completed'] }
                  }
                }
              }
            }
          },
          responses: { 200: { description: 'Cập nhật thành công' } }
        },
        delete: {
          tags: ['Payroll'],
          summary: 'Xóa kỳ lương (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Xóa thành công' } }
        }
      },
      '/payroll/runs/{id}/items': {
        post: {
          tags: ['Payroll'],
          summary: 'Thêm/cập nhật item lương (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PayrollItemUpsert' } } }
          },
          responses: {
            201: { content: { 'application/json': { schema: { $ref: '#/components/schemas/PayrollItem' } } } }
          }
        }
      },
      '/payroll/runs/{id}/items/{itemId}': {
        put: {
          tags: ['Payroll'],
          summary: 'Cập nhật item lương (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'itemId', in: 'path', required: true, schema: { type: 'string' } }
          ],
          requestBody: {
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PayrollItemUpsert' } } }
          },
          responses: { 200: { description: 'Cập nhật thành công' } }
        }
      },
      '/payroll/runs/{id}/recalc': {
        post: {
          tags: ['Payroll'],
          summary: 'Tính lại lương cho kỳ (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/PayrollItem' } } } } }
          }
        }
      },
      '/payroll/runs/{id}/export': {
        get: {
          tags: ['Payroll'],
          summary: 'Xuất CSV bảng lương (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: {
              description: 'File CSV',
              content: { 'text/csv': { schema: { type: 'string', format: 'binary' } } }
            }
          }
        }
      },

      // ============ CLIENT ENDPOINTS ============
      '/client/customers': {
        get: {
          tags: ['Clients'],
          summary: 'Danh sách khách hàng',
          description: 'Staff chỉ xem khách hàng của mình, Admin xem tất cả',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Tìm theo tên, email, phone' },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['lead', 'active', 'inactive'] } },
            { name: 'ownerId', in: 'query', schema: { type: 'string' }, description: 'Chỉ Admin được dùng' },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
          ],
          responses: {
            200: { content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Customer' } } } } }
          }
        },
        post: {
          tags: ['Clients'],
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
          tags: ['Clients'],
          summary: 'Đếm số lượng khách hàng',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'ownerId', in: 'query', schema: { type: 'string' } }
          ],
          responses: {
            200: {
              content: { 'application/json': { schema: { type: 'object', properties: { count: { type: 'integer' } } } } }
            }
          }
        }
      },
      '/client/customers/stats': {
        get: {
          tags: ['Clients'],
          summary: 'Thống kê khách hàng theo trạng thái',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'ownerId', in: 'query', schema: { type: 'string' } }
          ],
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerStats' } } } }
          }
        }
      },
      '/client/customers/deleted': {
        get: {
          tags: ['Clients'],
          summary: 'Danh sách khách hàng đã xóa (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'ownerId', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'limit', in: 'query', schema: { type: 'integer' } }
          ],
          responses: {
            200: { content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Customer' } } } } }
          }
        }
      },
      '/client/customers/import': {
        post: {
          tags: ['Clients'],
          summary: 'Import nhiều khách hàng',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    { type: 'array', items: { $ref: '#/components/schemas/CustomerCreate' } },
                    { type: 'object', properties: { customers: { type: 'array', items: { $ref: '#/components/schemas/CustomerCreate' } } } }
                  ]
                }
              }
            }
          },
          responses: {
            201: { content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerImportReport' } } } }
          }
        }
      },
      '/client/customers/restore/bulk': {
        post: {
          tags: ['Clients'],
          summary: 'Khôi phục nhiều khách hàng (Admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/BulkIds' } } }
          },
          responses: {
            200: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      restoredCount: { type: 'integer' },
                      skippedCount: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/client/customers/hard/bulk': {
        post: {
          tags: ['Clients'],
          summary: 'Xóa vĩnh viễn nhiều khách hàng (Admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/BulkIds' } } }
          },
          responses: {
            200: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      deletedCount: { type: 'integer' },
                      skippedCount: { type: 'integer' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/client/customers/{id}': {
        get: {
          tags: ['Clients'],
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
          tags: ['Clients'],
          summary: 'Cập nhật khách hàng',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/CustomerCreate' } } } },
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Customer' } } } }
          }
        },
        delete: {
          tags: ['Clients'],
          summary: 'Xóa mềm khách hàng',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Xóa thành công' }
          }
        }
      },
      '/client/customers/{id}/logs': {
        get: {
          tags: ['Clients'],
          summary: 'Lịch sử thao tác khách hàng',
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
          tags: ['Clients'],
          summary: 'Khôi phục khách hàng đã xóa (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { content: { 'application/json': { schema: { $ref: '#/components/schemas/Customer' } } } }
          }
        }
      },
      '/client/customers/{id}/hard': {
        delete: {
          tags: ['Clients'],
          summary: 'Xóa vĩnh viễn khách hàng (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Đã xóa vĩnh viễn' }
          }
        }
      }
    }
  },
  apis: [] // Không dùng annotation vì đã define trực tiếp trong definition
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  // Swagger JSON endpoint
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { font-size: 2rem; color: #3b82f6; }
    `,
    customSiteTitle: 'HRM-Client API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showExtensions: true
    }
  }));

  console.log('📚 Swagger UI available at http://localhost:4000/api-docs');
}

module.exports = { setupSwagger, swaggerSpec };

