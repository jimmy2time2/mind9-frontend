import { describe, it, expect, beforeEach } from 'vitest';
import { Cache } from '../lib/cache';

describe('Cache', () => {
  let cache: Cache<string>;

  beforeEach(() => {
    cache = new Cache({ maxAge: 1000, maxSize: 3 });
  });

  it('stores and retrieves values', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('respects maxSize', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');
    cache.set('key4', 'value4');

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key4')).toBe('value4');
  });

  it('respects maxAge', async () => {
    cache.set('key1', 'value1');
    
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    expect(cache.get('key1')).toBeNull();
  });

  it('correctly handles deletion', () => {
    cache.set('key1', 'value1');
    cache.delete('key1');
    expect(cache.get('key1')).toBeNull();
  });

  it('clears all entries', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.clear();
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });
});