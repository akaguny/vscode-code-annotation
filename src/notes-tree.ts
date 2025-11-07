import * as vscode from 'vscode';
import * as path from 'path';

import { getNotes, saveNotes, Note } from './note-db';
import { getConfiguration } from './configuration';
import {
    getRelativePathForFileName,
    getTimeStampsString
} from './utils';
import { setDecorations } from './decoration/decoration';

const getIconPathFromType = (type: string, theme: string): string => {
    return path.join(__filename, '..', '..', 'resources', theme, type.toLowerCase() + '.svg');
};

const getIconPath = (status: string): { light: string; dark: string } => {
    const noteType = (status === 'pending') ? 'note' : 'notedone';
    return {
        light: getIconPathFromType(noteType, 'light'),
        dark: getIconPathFromType(noteType, 'dark')
    };
};

const getContextValue = (status: string): string => {
    return (status === 'pending') ? '$PendingNote' : '$CompleteNote';
};

const createNoteItem = (note: Note): NoteItem => {
    const fullPathFileName = note.fileName;
    const details: NoteItem[] = [];

    if (getConfiguration().showFileName && fullPathFileName.length > 0) {
        // Creates an item under the main note with the File name (if existing)
        const relativePath = getRelativePathForFileName(note.fileName);
        details.push(new NoteItem(`File: ${relativePath}`));
    }
    if (getConfiguration().showCreatedAtTimestamp && note.createdAt) {
        details.push(new NoteItem(`Created at: ${getTimeStampsString(note.createdAt)}`));
    }
    if (getConfiguration().showResolvedAtTimestamp && note.resolvedAt) {
        details.push(new NoteItem(`Resolved at: ${getTimeStampsString(note.resolvedAt)}`));
    }

    const noteItem = new NoteItem(note.text, {
        children: details,
        noteId: note.id.toString(),
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed
    });
    if (noteItem.id) {
        noteItem.command = new OpenNoteCommand(noteItem.id);
    }
    if (details.length > 0) {
        // If details isn't undefined, set the command to the same as the parent
        details[0].command = noteItem.command;
    }
    noteItem.tooltip = note.text;
    noteItem.contextValue = getContextValue(note.status);
    noteItem.iconPath = getIconPath(note.status);

    return noteItem;
};

export class TreeActions {
    constructor(private provider: NotesTree) { }

    removeNote(item: NoteItem) {
        return this.provider.removeItem(item.id);
    }
    checkNote(item: NoteItem) {
        return this.provider.checkItem(item.id, 'done');
    }
    uncheckNote(item: NoteItem) {
        return this.provider.checkItem(item.id, 'pending');
    }
    checkAllNotes(data: NoteItem): void {
        const children = data.children;
        if (!children || children.length === 0) {
            return;
        }

        children.forEach(child => this.checkNote(child));
    }
    uncheckAllNotes(data: NoteItem): void {
        const children = data.children;

        if (!children || children.length === 0) {
            return;
        }

        children.forEach(child => this.uncheckNote(child));
    }
    removeAllNotes(data: NoteItem): void {
        const children = data.children;

        if (!children || children.length === 0) {
            return;
        }

        children.forEach(child => this.removeNote(child));
    }
    openNote(item: NoteItem) {
        return this.provider.openItem(item.id);
    }
    openNoteFromId(id: string) {
        return this.provider.openItem(id);
    }
    editNote(item: NoteItem) {
        return this.provider.editItem(item.id);
    }
    copyNote(item: NoteItem) {
        return this.provider.copyItem(item.id);
    }
}

export class NotesTree implements vscode.TreeDataProvider<NoteItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<NoteItem | undefined | null | void> = new vscode.EventEmitter<NoteItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<NoteItem | undefined | null | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this.sourceData();
        this._onDidChangeTreeData.fire(null);
    }

    sourceData(): void {
        const annotations = getNotes();
        const pendingRoot = new NoteItem('Pending', { context: '$menu-pending' });
        const doneRoot = new NoteItem('Done', { context: '$menu-done' });

        annotations.forEach(note => {
            const noteItem = createNoteItem(note);
            if (note.status === 'pending') {
                pendingRoot.addChild(noteItem);
            } else {
                doneRoot.addChild(noteItem);
            }
        });

        pendingRoot.label = `Pending (${pendingRoot.children.length})`;
        doneRoot.label = `Done (${doneRoot.children.length})`;

        this.data = [pendingRoot, doneRoot];
    }

    removeItem(id: string | undefined): void {
        const notes = getNotes();
        const indexToRemove = notes.findIndex(item => item.id.toString() === id);

        if (indexToRemove < 0) {
            return;
        }

        notes.splice(indexToRemove, 1);

        saveNotes(notes);
        setDecorations();
    }

    checkItem(id: string | undefined, status: 'pending' | 'done'): void {
        const notes = getNotes();
        const note = notes.find(item => item.id.toString() === id);

        if (!note) {
            return;
        }

        note.status = status;
        note.resolvedAt = status === 'done' ? new Date() : undefined;

        saveNotes(notes);
    }

    editItem(id: string | undefined): void {
        const notes = getNotes();
        const note = notes.find(item => item.id.toString() === id);

        if (!note) {
            return;
        }

        vscode.window.showInputBox({ placeHolder: 'New text for annotation...', value: note.text }).then(annotationText => {
            if (annotationText) {
                note.text = annotationText;
                saveNotes(notes);
                vscode.window.showInformationMessage('Annotation edited!');
            }
        });
    }

    openItem(id: string | undefined): void {
        const notes = getNotes();
        const note = notes.find(item => item.id.toString() === id);

        if (!note) {
            return;
        }

        const { fileName, fileLine } = note;

        if (fileName.length <= 0) {
            return;
        }

        const openPath = vscode.Uri.file(fileName);
        vscode.workspace.openTextDocument(openPath).then(doc => {
            vscode.window.showTextDocument(doc).then(editor => {
                const range = new vscode.Range(fileLine, 0, fileLine, 0);
                editor.revealRange(range);

                const start = new vscode.Position(note.positionStart.line, note.positionStart.character);
                const end = new vscode.Position(note.positionEnd.line, note.positionEnd.character);
                editor.selection = new vscode.Selection(start, end);

                const revealRange = new vscode.Range(start, start);
                editor.revealRange(revealRange, vscode.TextEditorRevealType.InCenter);
            });
        });
    }

    copyItem(id: string | undefined): void {
        const notes = getNotes();
        const note = notes.find(item => item.id.toString() === id);

        if (!note) {
            return;
        }

        const content = note.text;
        vscode.env.clipboard.writeText(content).then(() => {
            vscode.window.showInformationMessage('Note copied successfully');
        });
    }

    data: NoteItem[];

    constructor() {
        vscode.commands.registerCommand('code-annotation.refreshEntry', () =>
            this.refresh()
        );

        this.data = [];
        this.sourceData();
    }

    getTreeItem(element: NoteItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }

    getChildren(element?: NoteItem | undefined): vscode.ProviderResult<NoteItem[]> {
        if (element === undefined) {
            return this.data;
        }
        return element.children;
    }
}

class OpenNoteCommand implements vscode.Command {
    readonly command = 'code-annotation.openNoteFromId';
    readonly title = 'Open File';
    readonly arguments: [string];

    constructor(id: string) {
        this.arguments = [id];
    }
}

class NoteItem extends vscode.TreeItem {
    children: NoteItem[];

    constructor(label: string, options?: {
        children?: NoteItem[];
        noteId?: string;
        context?: string;
        collapsibleState?: vscode.TreeItemCollapsibleState;
    }) {
        super(label);
        this.children = options?.children ?? [];
        this.id = options?.noteId;
        this.contextValue = options?.context;
        this.collapsibleState = options?.collapsibleState ?? (
            this.children.length === 0 ?
                vscode.TreeItemCollapsibleState.None :
                vscode.TreeItemCollapsibleState.Expanded);
    }

    addChild(element: NoteItem) {
        this.children.push(element);
        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
    }
}
