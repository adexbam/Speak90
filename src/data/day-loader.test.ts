import { getDayByNumber, loadDays } from './day-loader';

describe('day-loader', () => {
  it('loads the MVP days in order', () => {
    const days = loadDays();

    expect(days).toHaveLength(10);
    expect(days[0].dayNumber).toBe(1);
    expect(days[days.length - 1].dayNumber).toBe(10);
  });

  it('returns a day by number when valid', () => {
    const day = getDayByNumber(1);

    expect(day).toBeDefined();
    expect(day?.dayNumber).toBe(1);
    expect(day?.sections.length).toBeGreaterThan(0);
  });

  it('returns undefined for invalid day numbers', () => {
    expect(getDayByNumber(0)).toBeUndefined();
    expect(getDayByNumber(-3)).toBeUndefined();
    expect(getDayByNumber(999)).toBeUndefined();
  });
});
