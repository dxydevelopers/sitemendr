const { describe, it, expect, vi, beforeEach } = require('vitest');
const { validateDiscountCode, calculateDiscount } = require('../services/discountService');
const { prisma } = require('../config/db');

// Mock prisma
vi.mock('../config/db', () => ({
  prisma: {
    discountCode: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('DiscountService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateDiscountCode', () => {
    it('should validate a correct active discount code', async () => {
      const mockCode = {
        id: '1',
        code: 'SUPPORTER-2026-TEST',
        isActive: true,
        validFrom: new Date(Date.now() - 100000),
        expiresAt: new Date(Date.now() + 100000),
        maxUses: 10,
        currentUses: 0,
        minPurchaseAmount: 50,
        discountType: 'percentage',
        discountValue: 10,
        supporterId: null,
      };

      prisma.discountCode.findUnique.mockResolvedValue(mockCode);

      const result = await validateDiscountCode('SUPPORTER-2026-TEST', 'user-1', 100);
      
      expect(result.valid).toBe(true);
      expect(result.discountCode.code).toBe('SUPPORTER-2026-TEST');
    });

    it('should fail if code is expired', async () => {
      const mockCode = {
        id: '1',
        code: 'EXPIRED-CODE',
        isActive: true,
        validFrom: new Date(Date.now() - 200000),
        expiresAt: new Date(Date.now() - 100000),
        discountType: 'percentage',
        discountValue: 10,
      };

      prisma.discountCode.findUnique.mockResolvedValue(mockCode);

      const result = await validateDiscountCode('EXPIRED-CODE', 'user-1', 100);
      
      expect(result.valid).toBe(false);
      expect(result.message).toContain('expired');
    });

    it('should fail if minimum purchase amount not met', async () => {
      const mockCode = {
        id: '1',
        code: 'MIN-PURCHASE',
        isActive: true,
        validFrom: new Date(Date.now() - 100000),
        expiresAt: new Date(Date.now() + 100000),
        minPurchaseAmount: 500,
        discountType: 'percentage',
        discountValue: 10,
      };

      prisma.discountCode.findUnique.mockResolvedValue(mockCode);

      const result = await validateDiscountCode('MIN-PURCHASE', 'user-1', 100);
      
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Minimum purchase amount');
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate percentage discount correctly', () => {
      const discountCode = { discountType: 'percentage', discountValue: 15 };
      const amount = 200;
      const discount = calculateDiscount(discountCode, amount);
      expect(discount).toBe(30);
    });

    it('should calculate fixed discount correctly', () => {
      const discountCode = { discountType: 'fixed', discountValue: 50 };
      const amount = 200;
      const discount = calculateDiscount(discountCode, amount);
      expect(discount).toBe(50);
    });

    it('should not exceed total amount with fixed discount', () => {
      const discountCode = { discountType: 'fixed', discountValue: 500 };
      const amount = 200;
      const discount = calculateDiscount(discountCode, amount);
      expect(discount).toBe(200);
    });
  });
});
