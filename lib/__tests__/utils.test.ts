import { cn } from '../utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4');
  });

  it('should handle conditional classes', () => {
    const result = cn('px-2', true && 'py-1', false && 'hidden');
    expect(result).toBe('px-2 py-1');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['px-2', 'py-1'], 'text-white');
    expect(result).toBe('px-2 py-1 text-white');
  });

  it('should handle undefined and null values', () => {
    const result = cn('px-2', undefined, null, 'py-1');
    expect(result).toBe('px-2 py-1');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should merge conflicting tailwind classes correctly', () => {
    const result = cn('bg-red-500', 'bg-blue-500');
    expect(result).toBe('bg-blue-500');
  });
});
