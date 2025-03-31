import { relations } from 'drizzle-orm';
import { equipment } from './equipment';
import { teams } from './teams';
import { users } from './users';
import { loans } from './loans';
import { checkouts } from './checkouts';
import { calibrations } from './calibrations';
import { history } from './history';

// 장비 관계 정의
export const equipmentRelations = relations(equipment, ({ one, many }) => ({
  team: one(teams, {
    fields: [equipment.teamId],
    references: [teams.id],
  }),
  manager: one(users, {
    fields: [equipment.managerId],
    references: [users.id],
  }),
  loans: many(loans),
  checkouts: many(checkouts),
  calibrations: many(calibrations),
  history: many(history),
}));

// 팀 관계 정의
export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(users),
  equipment: many(equipment),
}));

// 사용자 관계 정의
export const usersRelations = relations(users, ({ one, many }) => ({
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
  managedEquipment: many(equipment, { relationName: 'manager' }),
  loans: many(loans, { relationName: 'borrower' }),
  approvedLoans: many(loans, { relationName: 'approver' }),
  checkouts: many(checkouts, { relationName: 'user' }),
  approvedCheckouts: many(checkouts, { relationName: 'approver' }),
  performedCalibrations: many(calibrations, { relationName: 'performer' }),
  verifiedCalibrations: many(calibrations, { relationName: 'verifier' }),
  historyEvents: many(history, { relationName: 'performer' }),
}));

// 대여 관계 정의
export const loansRelations = relations(loans, ({ one }) => ({
  equipment: one(equipment, {
    fields: [loans.equipmentId],
    references: [equipment.id],
  }),
  borrower: one(users, {
    fields: [loans.borrowerId],
    references: [users.id],
    relationName: 'borrower',
  }),
  approver: one(users, {
    fields: [loans.approverId],
    references: [users.id],
    relationName: 'approver',
  }),
}));

// 대여 관계 정의 (Checkouts)
export const checkoutsRelations = relations(checkouts, ({ one }) => ({
  equipment: one(equipment, {
    fields: [checkouts.equipmentId],
    references: [equipment.id],
  }),
  user: one(users, {
    fields: [checkouts.userId],
    references: [users.id],
    relationName: 'user',
  }),
  approver: one(users, {
    fields: [checkouts.approverId],
    references: [users.id],
    relationName: 'approver',
  }),
}));

// 교정 관계 정의
export const calibrationsRelations = relations(calibrations, ({ one }) => ({
  equipment: one(equipment, {
    fields: [calibrations.equipmentId],
    references: [equipment.id],
  }),
  performer: one(users, {
    fields: [calibrations.performedBy],
    references: [users.id],
    relationName: 'performer',
  }),
  verifier: one(users, {
    fields: [calibrations.verifiedBy],
    references: [users.id],
    relationName: 'verifier',
  }),
}));

// 히스토리 관계 정의
export const historyRelations = relations(history, ({ one }) => ({
  equipment: one(equipment, {
    fields: [history.equipmentId],
    references: [equipment.id],
  }),
  performer: one(users, {
    fields: [history.performedBy],
    references: [users.id],
    relationName: 'performer',
  }),
})); 