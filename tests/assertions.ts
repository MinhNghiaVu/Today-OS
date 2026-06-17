import assert from 'node:assert/strict';

export function expect(actual: unknown) {
	return {
		toBe(expected: unknown) {
			assert.equal(actual, expected);
		},
		toEqual(expected: unknown) {
			assert.deepEqual(actual, expected);
		},
		toBeTruthy() {
			assert.ok(actual);
		}
	};
}
