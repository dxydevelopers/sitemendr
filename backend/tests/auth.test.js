import { describe, it, expect, beforeAll, vi } from 'vitest';
import jwt from 'jsonwebtoken';

// Mock JWT secret for testing
const TEST_JWT_SECRET = 'test-jwt-secret-for-testing';

describe('Authentication Middleware', () => {
  
  describe('JWT Token Generation', () => {
    it('should generate a valid JWT token', () => {
      const payload = {
        userId: '12345678-1234-1234-1234-123456789012',
        email: 'test@example.com',
        role: 'user'
      };
      
      const token = jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '24h' });
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
    
    it('should generate token with correct payload', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'admin'
      };
      
      const token = jwt.sign(payload, TEST_JWT_SECRET);
      const decoded = jwt.verify(token, TEST_JWT_SECRET);
      
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });
  });
  
  describe('JWT Token Verification', () => {
    it('should verify valid token', () => {
      const payload = { userId: '123', role: 'user' };
      const token = jwt.sign(payload, TEST_JWT_SECRET);
      
      const decoded = jwt.verify(token, TEST_JWT_SECRET);
      expect(decoded.userId).toBe('123');
    });
    
    it('should reject invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        jwt.verify(invalidToken, TEST_JWT_SECRET);
      }).toThrow();
    });
    
    it('should reject token with wrong secret', () => {
      const payload = { userId: '123' };
      const token = jwt.sign(payload, 'wrong-secret');
      
      expect(() => {
        jwt.verify(token, TEST_JWT_SECRET);
      }).toThrow();
    });
    
    it('should reject expired token', () => {
      const payload = { userId: '123' };
      const token = jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '-1s' });
      
      expect(() => {
        jwt.verify(token, TEST_JWT_SECRET);
      }).toThrow('jwt expired');
    });
  });
  
  describe('Token Expiration', () => {
    it('should create token with 24h expiration', () => {
      const payload = { userId: '123' };
      const token = jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '24h' });
      
      const decoded = jwt.verify(token, TEST_JWT_SECRET);
      const expDate = new Date(decoded.exp * 1000);
      const now = new Date();
      
      // Token should expire in approximately 24 hours
      const hoursUntilExpiry = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(hoursUntilExpiry).toBeGreaterThan(23);
      expect(hoursUntilExpiry).toBeLessThanOrEqual(24);
    });
    
    it('should handle different expiration times', () => {
      const payloads = [
        { expiresIn: '1h' },
        { expiresIn: '7d' },
        { expiresIn: '30d' }
      ];
      
      payloads.forEach(({ expiresIn }) => {
        const token = jwt.sign({ userId: '123' }, TEST_JWT_SECRET, { expiresIn });
        const decoded = jwt.verify(token, TEST_JWT_SECRET);
        expect(decoded.exp).toBeDefined();
      });
    });
  });
  
  describe('Token Normalization', () => {
    it('should handle userId as id in token', () => {
      // This tests the normalization logic in auth middleware
      const tokenWithUserId = jwt.sign({ userId: '123', email: 'test@test.com' }, TEST_JWT_SECRET);
      const tokenWithId = jwt.sign({ id: '456', email: 'test2@test.com' }, TEST_JWT_SECRET);
      
      const decoded1 = jwt.verify(tokenWithUserId, TEST_JWT_SECRET);
      const decoded2 = jwt.verify(tokenWithId, TEST_JWT_SECRET);
      
      // Simulate normalization logic from middleware
      decoded1.userId = decoded1.userId || decoded1.id;
      decoded2.userId = decoded2.userId || decoded2.id;
      
      expect(decoded1.userId).toBe('123');
      expect(decoded2.userId).toBe('456');
    });
  });
});

describe('Authorization Roles', () => {
  const checkRole = (userRole, requiredRole) => {
    const roleHierarchy = { admin: 3, manager: 2, user: 1 };
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  };
  
  it('admin should have access to admin resources', () => {
    expect(checkRole('admin', 'admin')).toBe(true);
    expect(checkRole('admin', 'manager')).toBe(true);
    expect(checkRole('admin', 'user')).toBe(true);
  });
  
  it('manager should have access to manager resources', () => {
    expect(checkRole('manager', 'admin')).toBe(false);
    expect(checkRole('manager', 'manager')).toBe(true);
    expect(checkRole('manager', 'user')).toBe(true);
  });
  
  it('user should only have access to user resources', () => {
    expect(checkRole('user', 'admin')).toBe(false);
    expect(checkRole('user', 'manager')).toBe(false);
    expect(checkRole('user', 'user')).toBe(true);
  });
});
