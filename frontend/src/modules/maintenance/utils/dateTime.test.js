import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDateTime, formatDateTimeOrFallback, formatDurationMinutes } from './dateTime.js';

test('formatDateTime renders ISO timestamps with a real date and time', () => {
  const formatted = formatDateTime('2026-04-20T05:30:00Z');

  assert.notEqual(formatted, 'N/A');
  assert.match(formatted, /\d{4}|\bApr\b|\bAM\b|\bPM\b/i);
});

test('formatDateTime does not fall back to misleading just-now text for missing values', () => {
  assert.equal(formatDateTime(null), 'N/A');
  assert.equal(formatDateTime('not-a-date'), 'N/A');
});

test('formatDateTimeOrFallback returns Pending for missing timestamps', () => {
  assert.equal(formatDateTimeOrFallback(null), 'Pending');
  assert.equal(formatDateTimeOrFallback('not-a-date', 'Waiting'), 'Waiting');
});

test('formatDurationMinutes renders compact duration text', () => {
  assert.equal(formatDurationMinutes(0), '0m');
  assert.equal(formatDurationMinutes(125), '2h 5m');
  assert.equal(formatDurationMinutes(1505), '1d 1h 5m');
});
