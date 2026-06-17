// @ts-nocheck
import { describe, test } from 'node:test';
import { expect } from './assertions.ts';
import {
	DEFAULT_HABIT_ICON,
	HABIT_ICON_OPTIONS,
	inferHabitIcon,
	isHabitIconName,
	normalizeHabitIcon,
	resolveHabitIconInput
} from '../src/lib/utils/habit-icons.ts';

describe('habit icon helpers', () => {
	test('infers common habit icons from the habit name and unit', () => {
		expect(inferHabitIcon({ name: 'Water', unit: 'ml' })).toBe('droplets');
		expect(inferHabitIcon({ name: 'Walking Steps', unit: 'steps' })).toBe('footprints');
		expect(inferHabitIcon({ name: 'Calories', unit: 'kcal' })).toBe('flame');
		expect(inferHabitIcon({ name: 'Go outside', unit: 'minutes' })).toBe('tree-pine');
		expect(inferHabitIcon({ name: 'Meditation', unit: 'minutes' })).toBe('brain');
	});

	test('normalizes unknown icon values to the default icon', () => {
		expect(isHabitIconName('dumbbell')).toBe(true);
		expect(isHabitIconName('made-up')).toBe(false);
		expect(normalizeHabitIcon('made-up')).toBe(DEFAULT_HABIT_ICON);
		expect(HABIT_ICON_OPTIONS[0].value).toBe(DEFAULT_HABIT_ICON);
	});

	test('resolves submitted icons while preserving explicit user picks', () => {
		expect(resolveHabitIconInput('target', { name: 'Water', unit: 'ml' })).toBe('droplets');
		expect(resolveHabitIconInput('target', { name: 'Water', unit: 'ml' }, true)).toBe('target');
		expect(resolveHabitIconInput('moon', { name: 'Water', unit: 'ml' })).toBe('moon');
		expect(resolveHabitIconInput('made-up', { name: 'Walking Steps', unit: 'steps' })).toBe('footprints');
	});
});
