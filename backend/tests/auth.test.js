const request = require('supertest');
const app = require('../src/app');

describe('Phase 2: Authentication & Authorization API Tests', () => {
  let adminToken = '';
  let teacherToken = '';
  let guardianToken = '';

  describe('POST /api/auth/login', () => {
    it('should successfully log in as an Admin and return a JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@school.com',
          password: 'Admin@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.role).toBe('ADMIN');
      expect(res.body.data.user.email).toBe('admin@school.com');
      adminToken = res.body.data.token;
    });

    it('should successfully log in as a Teacher', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'teacher@school.com',
          password: 'Teacher@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('TEACHER');
      expect(res.body.data.user).toHaveProperty('teacherProfile');
      teacherToken = res.body.data.token;
    });

    it('should successfully log in as a Guardian', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'guardian@school.com',
          password: 'Guardian@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('GUARDIAN');
      expect(res.body.data.user).toHaveProperty('guardianProfile');
      guardianToken = res.body.data.token;
    });

    it('should reject login with incorrect password (negative test)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@school.com',
          password: 'WrongPassword999!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid email or password/i);
    });

    it('should reject login with non-existent email (negative test)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ghost@school.com',
          password: 'SomePassword123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject login with missing fields (validation test)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toHaveProperty('email');
      expect(res.body.errors).toHaveProperty('password');
    });
  });

  describe('GET /api/auth/me (Protected Route)', () => {
    it('should return the current user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('admin@school.com');
    });

    it('should reject access when no authorization header is provided', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject access with an invalid/tampered token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.tampered.token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Role-Based Access Control (RBAC) on /api/audit', () => {
    it('should permit Admin to access audit logs', async () => {
      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('logs');
      expect(Array.isArray(res.body.data.logs)).toBe(true);
    });

    it('should forbid Teacher from accessing admin-only audit logs (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden: Role 'TEACHER' is not authorized/i);
    });

    it('should forbid Guardian from accessing admin-only audit logs (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${guardianToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden: Role 'GUARDIAN' is not authorized/i);
    });
  });
});
