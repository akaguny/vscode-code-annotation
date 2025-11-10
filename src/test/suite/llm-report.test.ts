import * as assert from 'assert';
import { getNotesInLLMFormat, getNotesInMarkdown } from '../../reporting';
import { Note } from '../../note-db';

const createNote = (overrides: Partial<Note>): Note => {
    const positionStart = overrides.positionStart ?? { line: 0, character: 0 };
    const positionEnd = overrides.positionEnd ?? positionStart;

    return {
        fileName: overrides.fileName ?? 'src/example.ts',
        fileLine: overrides.fileLine ?? positionStart.line,
        positionStart,
        positionEnd,
        text: overrides.text ?? 'Sample note',
        codeSnippet: overrides.codeSnippet ?? 'const value = 1;',
        status: overrides.status ?? 'pending',
        id: overrides.id ?? 1,
        createdAt: overrides.createdAt ?? new Date('2023-01-01T10:00:00.000Z'),
        resolvedAt: overrides.resolvedAt
    };
};

suite('Reporting', () => {
    const notes: Note[] = [
        createNote({
            text: 'Pending review',
            id: 1,
            status: 'pending',
            positionStart: { line: 2, character: 0 },
            positionEnd: { line: 2, character: 10 },
            codeSnippet: 'const foo = true;'
        }),
        createNote({
            text: 'Completed work',
            id: 2,
            status: 'done',
            positionStart: { line: 5, character: 4 },
            positionEnd: { line: 6, character: 2 },
            codeSnippet: 'function done() {\n    return true;\n}',
            resolvedAt: new Date('2023-01-02T08:30:00.000Z')
        })
    ];

    test('LLM format groups notes by status', () => {
        const report = getNotesInLLMFormat(notes);

        assert.ok(report.startsWith('# Code Review'), 'Report should start with heading');
        assert.ok(report.includes('## Pending'), 'Report should include pending section');
        assert.ok(report.includes('## Completed'), 'Report should include completed section');
        assert.match(report, /1\. Pending review \(.*#L3:1-L3:11\)/);
        assert.match(report, /2\. Completed work \(.*#L6:5-L7:3\)/);
    });

    test('Markdown report includes pending and done notes', () => {
        const markdown = getNotesInMarkdown(notes);

        assert.ok(markdown.includes('# Code Annotator - Summary'));
        assert.ok(markdown.includes('## Pending'));
        assert.ok(markdown.includes('## Done'));
        assert.ok(markdown.includes('Pending review'));
        assert.ok(markdown.includes('Completed work'));
        assert.ok(markdown.includes('Resolved at'));
    });
});
