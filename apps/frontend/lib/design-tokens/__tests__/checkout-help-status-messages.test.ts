import { CheckoutStatusValues } from '@equipment-management/schemas';
import koMessages from '@/messages/ko/checkouts.json';
import enMessages from '@/messages/en/checkouts.json';

const checkoutStatusValues = Object.values(CheckoutStatusValues).sort();

describe('checkout help status messages', () => {
  it.each([
    ['ko', koMessages],
    ['en', enMessages],
  ])('keeps help.status scoped to CheckoutStatus enum values for %s', (_locale, messages) => {
    expect(Object.keys(messages.help.status).sort()).toEqual(checkoutStatusValues);
  });

  it.each([
    ['ko', koMessages],
    ['en', enMessages],
  ])('keeps non-enum UI statuses under help.statusUi for %s', (_locale, messages) => {
    expect(messages.help.statusUi.completed.description).toBeTruthy();
    expect(messages.help.statusUi.return_rejected.description).toBeTruthy();
    expect(messages.help.status).not.toHaveProperty('completed');
    expect(messages.help.status).not.toHaveProperty('return_rejected');
  });
});
