import * as vscode from 'vscode';

import { getNotes, Note } from './note-db';
import { getRelativePathForFileName,
    getTimeStampsString } from './utils';

const getCodeSnippetString = (note: Note): string => {
    const moreThanOneLine = note.positionEnd.line !== note.positionStart.line;
    const firstLineOffset = moreThanOneLine ? note.positionStart.character : 0;
    let codeSnippet = note.codeSnippet;
    if (moreThanOneLine && firstLineOffset) {
        const offsetSpace = Array(firstLineOffset + 1).join(' ');
        codeSnippet = offsetSpace + codeSnippet;
    }
    return codeSnippet;
};

// TODO: We should use Jinja or something like this to generate these markdown files
export const getNoteInMarkdown = (note: Note): string => {
    let result = `### - ${note.text}\n\n`;
    if (note.createdAt)
    { result += `Created at ${getTimeStampsString(note.createdAt)}\n`; }
    if (note.resolvedAt)
    { result += `Resolved at ${getTimeStampsString(note.resolvedAt)}\n`; }

    result += '```\n';
    if (note.fileName.length > 0) {
        result += `\`${getRelativePathForFileName(note.fileName)}\`\n\n`;
        result += '```\n';
        result += `${getCodeSnippetString(note)}\n`;
        result += '```\n';
    }
    return result;
};

export const getNotesInMarkdown = (): string => {
    const notes = getNotes();

    let result = '# Code Annotator - Summary\n';
    result += '\n---\n';
    result += '## Pending\n';

    for (let i in notes) {
        const note = notes[i];
        if (note.status === 'pending') {
            result += getNoteInMarkdown(note);
        }
    }

    result += '\n---\n';
    result += '## Done\n';

    for (let i in notes) {
        const note = notes[i];
        if (note.status !== 'pending') {
            result += getNoteInMarkdown(note);
        }
    }

    return result;
};

export const generateMarkdownReport = (): void => {
    const newFile = vscode.Uri.parse('untitled:summary.md');

    vscode.workspace.openTextDocument(newFile).then(summaryFile => {
        const edit = new vscode.WorkspaceEdit();
        let notesSummary = getNotesInMarkdown();

        const existingContentRange = new vscode.Range(new vscode.Position(0, 0),
            new vscode.Position(summaryFile.lineCount + 1, 0));
        edit.replace(newFile, existingContentRange, notesSummary);

        return vscode.workspace.applyEdit(edit).then(success => {
            if (success) {
                vscode.window.showTextDocument(summaryFile, /*column=*/undefined, /*preserveFocus=*/false);
            } else {
                vscode.window.showInformationMessage('Error: Code Annotation could not generate a summary');
            }
        });
    });
};

export const copySummaryToClipboard = async (): Promise<void> => {
    const notesSummary = getNotesInMarkdown();
    await vscode.env.clipboard.writeText(notesSummary);
    vscode.window.showInformationMessage('Notes summary copied to clipboard!');
};

const getLineReference = (note: Note): string => {
    const fileName = getRelativePathForFileName(note.fileName);
    const startLine = note.positionStart.line + 1;
    const startCol = note.positionStart.character + 1;
    const endLine = note.positionEnd.line + 1;
    const endCol = note.positionEnd.character + 1;

    if (startLine === endLine && startCol === endCol) {
        return `${fileName}#L${startLine}:${startCol}`;
    }
    return `${fileName}#L${startLine}:${startCol}-L${endLine}:${endCol}`;
};

const getNoteInLLMFormat = (note: Note, index: number): string => {
    let result = `${index}. ${note.text}`;

    if (note.fileName.length > 0) {
        result += ` (${getLineReference(note)})`;
    }

    result += '\n';
    return result;
};

export const getNotesInLLMFormat = (): string => {
    const notes = getNotes();

    let result = '# Code Review\n\n';

    const pendingNotes = notes.filter(n => n.status === 'pending');
    const completedNotes = notes.filter(n => n.status === 'done');

    if (pendingNotes.length > 0) {
        result += '## Pending\n\n';
        pendingNotes.forEach((note, index) => {
            result += getNoteInLLMFormat(note, index + 1);
        });
        result += '\n';
    }

    if (completedNotes.length > 0) {
        result += '## Completed\n\n';
        completedNotes.forEach((note, index) => {
            result += getNoteInLLMFormat(note, index + 1);
        });
    }

    return result;
};

export const copyLLMReportToClipboard = async (): Promise<void> => {
    const llmReport = getNotesInLLMFormat();
    await vscode.env.clipboard.writeText(llmReport);
    vscode.window.showInformationMessage('LLM report copied to clipboard!');
};
