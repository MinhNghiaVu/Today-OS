// @ts-nocheck
import { describe, test } from 'node:test';
import { expect } from './assertions.ts';
import { noteTitleFromContent } from '../src/lib/utils/capture.ts';

describe('capture helpers', () => {
	test('builds a short note title from the first non-empty line', () => {
		expect(noteTitleFromContent('Buy milk')).toBe('Buy milk');
		expect(noteTitleFromContent('\n\nStandup notes\nSecond line')).toBe('Standup notes');
	});

	test('truncates long note titles with an ellipsis', () => {
		const longLine = 'A'.repeat(70);
		expect(noteTitleFromContent(longLine)).toBe(`${'A'.repeat(57)}...`);
	});

	test('falls back when content is blank', () => {
		expect(noteTitleFromContent('   \n  ')).toBe('Quick note');
	});
});
