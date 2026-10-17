import {AppError, toAppError} from '../../src/lib/appError';

describe('toAppError', () => {
  it('keeps an AppError as it is', () => {
    const e = new AppError('timeout', 'slow');
    expect(toAppError(e)).toBe(e);
  });

  it('detects network failures', () => {
    expect(toAppError(new TypeError('Network request failed')).code).toBe('network');
    expect(toAppError({message: 'Failed to fetch'}).code).toBe('network');
  });

  it('wraps server-style errors with their message', () => {
    const e = toAppError({message: 'permission denied', code: '42501'});
    expect(e.code).toBe('server');
    expect(e.message).toBe('permission denied');
  });

  it('handles strings and empty values', () => {
    expect(toAppError('boom').message).toBe('boom');
    expect(toAppError(undefined).code).toBe('unknown');
    expect(toAppError(null).code).toBe('unknown');
  });

  it('is a real Error subclass', () => {
    expect(new AppError('unknown', 'x')).toBeInstanceOf(Error);
    expect(new AppError('unknown', 'x')).toBeInstanceOf(AppError);
  });
});
