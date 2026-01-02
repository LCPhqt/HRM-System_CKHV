const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { connectAndSeed } = require('../src/config/db');
const authRoutes = require('../src/routes/auth');
const User = require('../src/models/User');
const bcrypt = require('bcryptjs');

// Create test app
const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Registration API Tests', () => {
  beforeAll(async () => {
    const uri = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/hrm_identity_test';
    await mongoose.connect(uri);
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('POST /auth/register', () => {
    test('should register successfully with valid data', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          confirm_password: 'password123',
          full_name: 'Test User'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('role', 'staff');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');

      // Verify user was created in database
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeTruthy();
      expect(user.role).toBe('staff');
    });

    test('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          password: 'password123',
          confirm_password: 'password123',
          full_name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email và mật khẩu là bắt buộc');
    });

    test('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          confirm_password: 'password123',
          full_name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email và mật khẩu là bắt buộc');
    });

    test('should return 400 when password and confirm_password do not match', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          confirm_password: 'password456',
          full_name: 'Test User'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Mật khẩu nhập lại không khớp');
    });

    test('should return 409 when email already exists', async () => {
      // Create existing user
      const passwordHash = await bcrypt.hash('password123', 10);
      await User.create({
        email: 'existing@example.com',
        passwordHash,
        role: 'staff'
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          confirm_password: 'password123',
          full_name: 'Test User'
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Email already registered');
    });

    test('should hash password before storing', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          confirm_password: 'password123',
          full_name: 'Test User'
        });

      expect(response.status).toBe(201);

      const user = await User.findOne({ email: 'test@example.com' });
      expect(user.passwordHash).not.toBe('password123');
      expect(user.passwordHash).toHaveLength(60); // bcrypt hash length
      
      // Verify password can be verified
      const isValid = await bcrypt.compare('password123', user.passwordHash);
      expect(isValid).toBe(true);
    });

    test('should work without full_name', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          confirm_password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
    });
  });

  describe('Login API Tests', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      const passwordHash = await bcrypt.hash('password123', 10);
      await User.create({
        email: 'login@example.com',
        passwordHash,
        role: 'staff'
      });
    });

    test('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('role', 'staff');
    });

    test('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email and password required');
    });

    test('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email and password required');
    });

    test('should return 401 when email does not exist', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    test('should return 401 when password is incorrect', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    test('should return valid JWT token on successful login', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeTruthy();
      
      // Verify token is a valid JWT
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(response.body.accessToken, process.env.JWT_SECRET || 'dev_secret');
      expect(decoded).toHaveProperty('email', 'login@example.com');
      expect(decoded).toHaveProperty('role', 'staff');
    });
  });
});

