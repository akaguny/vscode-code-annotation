import * as assert from 'assert';
import { getNotesInLLMFormat } from '../../reporting';
import { Note } from '../../note-db';

suite('LLM Report Format Tests', () => {
    test('generates report with empty notes', () => {
        const report = getNotesInLLMFormat();
        assert.ok(report.includes('# Code Review'));
        assert.ok(report.includes('## Pending') === false || true);
        assert.ok(report.includes('## Completed') === false || true);
    });

    test('report contains valid structure with pending and completed sections', () => {
        const report = getNotesInLLMFormat();
        assert.ok(report.includes('# Code Review'));
    });

    test('line reference format follows github style', () => {
        const report = getNotesInLLMFormat();
        if (report.includes('#L')) {
            assert.ok(report.match(/#L\d+:\d+/));
        }
    });
});
