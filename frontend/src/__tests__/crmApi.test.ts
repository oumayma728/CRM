import { describe, it, expect } from 'vitest';
import { camelize } from '../app/services/crmApi';

describe('camelize', () => {
  it('converts snake_case keys recursively and leaves camelCase untouched', () => {
    const input = {
      clock_in: '2026-09-29T08:00:00Z',
      break_type: null,
      agentName: 'Karim',
      team: [{ user_id: 1, total_calls: 3 }],
    };
    expect(camelize(input)).toEqual({
      clockIn: '2026-09-29T08:00:00Z',
      breakType: null,
      agentName: 'Karim',
      team: [{ userId: 1, totalCalls: 3 }],
    });
  });

  it('keeps scalars and arrays of scalars', () => {
    expect(camelize([1, 'a', null])).toEqual([1, 'a', null]);
    expect(camelize('x')).toBe('x');
  });
});
