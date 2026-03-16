import { HttpException } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { RateLimitGuard } from './rate-limit.guard';

function makeContext(ip: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ ip }),
    }),
  } as unknown as ExecutionContext;
}

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;

  beforeEach(() => {
    guard = new RateLimitGuard();
  });

  it('allows the first request', () => {
    expect(guard.canActivate(makeContext('1.2.3.4'))).toBe(true);
  });

  it('allows up to 5 requests from the same ip', () => {
    for (let i = 0; i < 5; i++) {
      expect(() => guard.canActivate(makeContext('10.0.0.1'))).not.toThrow();
    }
  });

  it('blocks the 6th request from the same ip', () => {
    for (let i = 0; i < 5; i++) {
      guard.canActivate(makeContext('10.0.0.2'));
    }

    expect(() => guard.canActivate(makeContext('10.0.0.2'))).toThrow(
      HttpException,
    );
  });

  it('does not affect other ips', () => {
    for (let i = 0; i < 5; i++) {
      guard.canActivate(makeContext('10.0.0.3'));
    }

    expect(() => guard.canActivate(makeContext('10.0.0.4'))).not.toThrow();
  });

  it('returns 429 when blocked', () => {
    for (let i = 0; i < 5; i++) {
      guard.canActivate(makeContext('10.0.0.5'));
    }

    try {
      guard.canActivate(makeContext('10.0.0.5'));
    } catch (e) {
      expect((e as HttpException).getStatus()).toBe(429);
    }
  });
});
