import * as vscode from 'vscode';
import * as fs from 'fs';

import { getAnnotationFilePath, getConfiguration } from './configuration';
import { setDecorations } from './decoration/decoration';

export interface Position {
    line: number;
    character: number;
}

export interface Note {
    fileName: string;
    fileLine: number;
    positionStart: Position;
    positionEnd: Position;
    text: string;
    codeSnippet: string;
    status: 'pending' | 'done';
    id: number;
    createdAt: Date;
    resolvedAt: Date | undefined;
}

export interface NotesDb {
    notes: Note[];
    nextId: number;
}

export const getNotesDb = (): NotesDb => {
    const annotationFile = getAnnotationFilePath();
    const rawdata = fs.readFileSync(annotationFile, 'utf8');
    const annotations: NotesDb = JSON.parse(rawdata);
    return annotations;
};

export const getNotes = (): Note[] => {
    return getNotesDb().notes;
};

export const getNextId = (): number => {
    return getNotesDb().nextId;
};

export const saveDb = (db: NotesDb): void => {
    const data = JSON.stringify(db, null, 2);
    fs.writeFileSync(getAnnotationFilePath(), data);
    void vscode.commands.executeCommand('code-annotation.refreshEntry');
};

export const saveNotes = (notes: Note[]): void => {
    const db = getNotesDb();

    db.notes = notes;

    saveDb(db);
};

const createNote = (annotationText: string, fromSelection: boolean): Note => {
    const nextId = getNextId();

    let codeSnippet = '';
    let fileName = '';
    let selection: vscode.Selection | undefined;
    let positionStart: Position = { line: 0, character: 0 };
    let positionEnd: Position = { line: 0, character: 0 };

    const editor = vscode.window.activeTextEditor;
    if (fromSelection && editor) {
        fileName = editor.document.uri.fsPath;
        selection = editor.selection;
        if (selection) {
            codeSnippet = editor.document.getText(selection);
            positionStart = { line: selection.start.line, character: selection.start.character };
            positionEnd = { line: selection.end.line, character: selection.end.character };
        }
    }

    return {
        fileName,
        fileLine: selection ? selection.start.line : 0,
        positionStart,
        positionEnd,
        text: annotationText,
        codeSnippet,
        status: 'pending',
        id: nextId,
        createdAt: new Date(),
        resolvedAt: undefined
    };
};

const createNoteFromSelection = (annotationText: string): Note => {
    return createNote(annotationText, true);
};

const createPlainNote = (annotationText: string): Note => {
    return createNote(annotationText, false);
};

const addNoteToDb = (note: Note): void => {
    const db = getNotesDb();

    db.notes.push(note);
    db.nextId++;

    saveDb(db);
    void vscode.window.showInformationMessage('Annotation saved!');
};

const getTODOFromSelectedText = (): string | undefined => {
    const editor = vscode.window.activeTextEditor;
    const selectedText = editor?.selection ? editor.document.getText(editor.selection) : '';
    const todoSelector = /\/\/\s*(TODO|FIX):\s*(.*)/;
    let matchArray = selectedText.match(todoSelector);
    if (matchArray && matchArray.length) {
        return matchArray[2];
    }
    for (const custom of getConfiguration().customTODO) {
        try {
            const customMatch = selectedText.match(custom);
            if (customMatch && customMatch.length) {
                // Use the second group to be consistent with the standard regex above
                if (!customMatch[2]) {
                    vscode.window.showWarningMessage(`Custom TODO RegEx (${custom}) doesn't have atleast two capture groups`);
                } else {
                    return customMatch[2];
                }
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`Error checking custom regex '${custom}': ${message}`);
            continue;
        }
    }
    return undefined;
};

const getPlaceHolderLineFromText = (): string | undefined => {
    const todoText = getTODOFromSelectedText();
    if (todoText)
    { return todoText; }

    // If there's no todo, use the first line from the text
    const editor = vscode.window.activeTextEditor;
    let selectedText = editor?.selection ? editor.document.getText(editor.selection) : '';
    return selectedText.split(/\r?\n/)[0].trim();
};

export const addNote = async () => {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const todoText = getPlaceHolderLineFromText();
        let annotationText = await vscode.window.showInputBox({ placeHolder: 'Give the annotation some text...', value: todoText });
        if (annotationText) {
            addNoteToDb(createNoteFromSelection(annotationText));
        }
    }
    setDecorations();
};

export const addPlainNote = async () => {
    const annotationText = await vscode.window.showInputBox({ placeHolder: 'Give the annotation some text...' });
    if (annotationText) {
        addNoteToDb(createPlainNote(annotationText));
    }
};