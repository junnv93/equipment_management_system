import {
  getUrgencyFeedbackClasses,
  getCountBasedUrgency,
  getTimeBasedUrgency,
  getStatusBasedUrgency,
  URGENCY_FEEDBACK_MAP,
  VISUAL_FEEDBACK_TOKENS,
} from '../visual-feedback';

// ──────────────────────────────────────────
//  URGENCY_FEEDBACK_MAP 상수 검증
// ──────────────────────────────────────────
describe('URGENCY_FEEDBACK_MAP', () => {
  it('info → static', () => expect(URGENCY_FEEDBACK_MAP.info).toBe('static'));
  it('warning → subtle', () => expect(URGENCY_FEEDBACK_MAP.warning).toBe('subtle'));
  it('critical → attention', () => expect(URGENCY_FEEDBACK_MAP.critical).toBe('attention'));
  it('emergency → urgent', () => expect(URGENCY_FEEDBACK_MAP.emergency).toBe('urgent'));
});

// ──────────────────────────────────────────
//  getUrgencyFeedbackClasses
// ──────────────────────────────────────────
describe('getUrgencyFeedbackClasses()', () => {
  it('info → scale-100, ring 없음', () => {
    const classes = getUrgencyFeedbackClasses('info');
    expect(classes).toContain('scale-100');
    expect(classes).not.toContain('ring');
  });

  it('warning → scale-105, ring 없음', () => {
    const classes = getUrgencyFeedbackClasses('warning');
    expect(classes).toContain('scale-105');
    expect(classes).not.toContain('ring');
  });

  it('critical → scale-105 + ring', () => {
    const classes = getUrgencyFeedbackClasses('critical');
    expect(classes).toContain('scale-105');
    expect(classes).toContain('ring');
  });

  it('emergency → scale-110 + ring + animate-pulse (animation 포함)', () => {
    const classes = getUrgencyFeedbackClasses('emergency', true);
    expect(classes).toContain('scale-110');
    expect(classes).toContain('ring');
    expect(classes).toContain('animate-pulse');
  });

  it('emergency + includeAnimation=false → animate-pulse 미포함', () => {
    const classes = getUrgencyFeedbackClasses('emergency', false);
    expect(classes).toContain('scale-110');
    expect(classes).not.toContain('animate-pulse');
  });

  it('모든 urgency 레벨에서 transition 클래스 포함', () => {
    (['info', 'warning', 'critical', 'emergency'] as const).forEach((urgency) => {
      const classes = getUrgencyFeedbackClasses(urgency);
      expect(classes).toContain('motion-safe:transition-[transform]');
    });
  });

  it('빈 문자열 토큰은 필터링되어 연속 공백 없음', () => {
    const classes = getUrgencyFeedbackClasses('info');
    expect(classes).not.toMatch(/\s{2,}/); // 연속 공백 없음
  });
});

// ──────────────────────────────────────────
//  getCountBasedUrgency
// ──────────────────────────────────────────
describe('getCountBasedUrgency()', () => {
  it.each([
    [0, 'info'],
    [1, 'info'],
    [4, 'info'],
    [5, 'warning'],
    [9, 'warning'],
    [10, 'critical'],
    [19, 'critical'],
    [20, 'emergency'],
    [100, 'emergency'],
  ])('count=%i → %s', (count, expected) => {
    expect(getCountBasedUrgency(count)).toBe(expected);
  });
});

// ──────────────────────────────────────────
//  getTimeBasedUrgency
// ──────────────────────────────────────────
describe('getTimeBasedUrgency()', () => {
  it.each([
    [-1, 'emergency'], // 지연
    [0, 'critical'], // D-0 이내
    [3, 'critical'], // D-3 이내
    [4, 'warning'], // D-7 이내
    [7, 'warning'], // D-7
    [8, 'info'], // 여유 있음
    [30, 'info'],
  ])('daysUntilDue=%i → %s', (days, expected) => {
    expect(getTimeBasedUrgency(days)).toBe(expected);
  });
});

// ──────────────────────────────────────────
//  getStatusBasedUrgency
// ──────────────────────────────────────────
describe('getStatusBasedUrgency()', () => {
  it('normal → info', () => expect(getStatusBasedUrgency('normal')).toBe('info'));
  it('warning → warning', () => expect(getStatusBasedUrgency('warning')).toBe('warning'));
  it('error → critical', () => expect(getStatusBasedUrgency('error')).toBe('critical'));
  it('critical → emergency', () => expect(getStatusBasedUrgency('critical')).toBe('emergency'));
});

// ──────────────────────────────────────────
//  VISUAL_FEEDBACK_TOKENS 구조 검증
// ──────────────────────────────────────────
describe('VISUAL_FEEDBACK_TOKENS 구조', () => {
  it('urgent는 animation 속성을 가진다 (empty string이 아님)', () => {
    expect(VISUAL_FEEDBACK_TOKENS.urgent.animation).not.toBe('');
  });

  it('static/subtle/attention은 animation이 빈 문자열이다', () => {
    expect(VISUAL_FEEDBACK_TOKENS.static.animation).toBe('');
    expect(VISUAL_FEEDBACK_TOKENS.subtle.animation).toBe('');
    expect(VISUAL_FEEDBACK_TOKENS.attention.animation).toBe('');
  });

  it('attention은 ring 속성을 가진다', () => {
    expect(VISUAL_FEEDBACK_TOKENS.attention.ring).not.toBe('');
  });

  it('subtle은 ring이 없다', () => {
    expect(VISUAL_FEEDBACK_TOKENS.subtle.ring).toBe('');
  });
});
