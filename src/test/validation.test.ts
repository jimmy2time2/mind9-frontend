import { describe, it, expect } from 'vitest';
import { walletAddressValidator, tokenAmountValidator, tweetContentValidator } from '../lib/validation';

describe('Validators', () => {
  describe('walletAddressValidator', () => {
    it('validates correct wallet addresses', () => {
      const result = walletAddressValidator.validate('8Xe5N4KF8PPtBvY9JvPBxiMv4zkzQ4RmMetgNuJRDXzR');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects invalid wallet addresses', () => {
      const result = walletAddressValidator.validate('invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid wallet address format');
    });
  });

  describe('tokenAmountValidator', () => {
    it('validates correct token amounts', () => {
      const result = tokenAmountValidator.validate(100);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects negative amounts', () => {
      const result = tokenAmountValidator.validate(-1);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount must be greater than 0');
    });

    it('rejects excessive amounts', () => {
      const result = tokenAmountValidator.validate(2_000_000_000);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount exceeds maximum allowed');
    });
  });

  describe('tweetContentValidator', () => {
    it('validates correct tweet content', () => {
      const result = tweetContentValidator.validate('This is a valid tweet');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects empty tweets', () => {
      const result = tweetContentValidator.validate('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tweet content cannot be empty');
    });

    it('rejects tweets exceeding character limit', () => {
      const longTweet = 'a'.repeat(281);
      const result = tweetContentValidator.validate(longTweet);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tweet content exceeds 280 characters');
    });
  });
});