import {
  CSS_FONT_STACKS,
  FONT_CSS_VARIABLE_NAMES,
  FONT_CSS_VARIABLES,
  FONT_USAGE_CLASSES,
} from '@equipment-management/shared-constants';
import { FONT } from '../brand';

describe('font policy', () => {
  it('exposes runtime CSS variables from the shared SSOT', () => {
    expect(FONT_CSS_VARIABLES[FONT_CSS_VARIABLE_NAMES.sans]).toBe(CSS_FONT_STACKS.sans);
    expect(FONT_CSS_VARIABLES[FONT_CSS_VARIABLE_NAMES.display]).toBe(CSS_FONT_STACKS.display);
    expect(FONT_CSS_VARIABLES[FONT_CSS_VARIABLE_NAMES.body]).toBe(CSS_FONT_STACKS.body);
    expect(FONT_CSS_VARIABLES[FONT_CSS_VARIABLE_NAMES.mono]).toBe(CSS_FONT_STACKS.mono);
  });

  it('keeps frontend semantic font helpers aligned with shared usage classes', () => {
    expect(FONT).toEqual(FONT_USAGE_CLASSES);
  });
});
