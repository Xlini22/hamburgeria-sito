import { Injectable } from '@nestjs/common';

type AttemptState = {
  failures: number;
  firstFailureAt: number;
  blockedUntil: number;
  lastSeenAt: number;
};

@Injectable()
export class LoginAttemptsService {
  private readonly attempts = new Map<string, AttemptState>();
  private readonly windowMs = 15 * 60 * 1000;
  private readonly delaysMs = [0, 0, 5_000, 30_000, 15 * 60 * 1000];

  secondsUntilAllowed(ipAddress: string): number {
    const now = Date.now();
    const key = this.normalizeIp(ipAddress);
    const state = this.attempts.get(key);
    if (!state) return 0;
    if (now - state.firstFailureAt >= this.windowMs) {
      this.attempts.delete(key);
      return 0;
    }
    state.lastSeenAt = now;
    return Math.max(0, Math.ceil((state.blockedUntil - now) / 1000));
  }

  recordFailure(ipAddress: string): number {
    const now = Date.now();
    const key = this.normalizeIp(ipAddress);
    let state = this.attempts.get(key);
    if (!state || now - state.firstFailureAt >= this.windowMs) {
      state = {
        failures: 0,
        firstFailureAt: now,
        blockedUntil: 0,
        lastSeenAt: now,
      };
    }
    state.failures += 1;
    state.lastSeenAt = now;
    const delay =
      this.delaysMs[Math.min(state.failures, this.delaysMs.length) - 1];
    state.blockedUntil = Math.max(state.blockedUntil, now + delay);
    this.attempts.set(key, state);
    this.cleanup(now);
    return Math.ceil(delay / 1000);
  }

  reset(ipAddress: string) {
    this.attempts.delete(this.normalizeIp(ipAddress));
  }

  private normalizeIp(ipAddress: string) {
    return ipAddress || 'unknown';
  }

  private cleanup(now: number) {
    if (this.attempts.size < 1_000) return;
    for (const [key, state] of this.attempts) {
      if (now - state.lastSeenAt >= this.windowMs) this.attempts.delete(key);
    }
  }
}
