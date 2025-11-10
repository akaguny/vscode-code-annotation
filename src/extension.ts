import * as vscode from 'vscode';
import * as fs from 'fs';

import { addNote, addPlainNote } from './note-db';
import { generateMarkdownReport, copySummaryToClipboard, copyLLMReportToClipboard } from './reporting';
import { NotesTree, TreeActions } from './notes-tree';
import { initializeStorageLocation, getAnnotationFilePath } from './configuration';
import { updateDecorations } from './decoration/decoration';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "code-annotation" is now active!');

    initializeStorageLocation(context.globalStorageUri.fsPath);

    const tree = new NotesTree();
    const treeActions = new TreeActions(tree);

    const registerCommand = (command: string, callback: (...args: unknown[]) => unknown) => {
        context.subscriptions.push(vscode.commands.registerCommand(command, callback));
    };

    context.subscriptions.push(
        vscode.window.registerTreeDataProvider('codeAnnotationView', tree)
    );

    registerCommand('code-annotation.removeNote', treeActions.removeNote.bind(treeActions));
    registerCommand('code-annotation.checkAllNotes', treeActions.checkAllNotes.bind(treeActions));
    registerCommand('code-annotation.uncheckAllNotes', treeActions.uncheckAllNotes.bind(treeActions));
    registerCommand('code-annotation.removeAllNotes', treeActions.removeAllNotes.bind(treeActions));
    registerCommand('code-annotation.checkNote', treeActions.checkNote.bind(treeActions));
    registerCommand('code-annotation.uncheckNote', treeActions.uncheckNote.bind(treeActions));
    registerCommand('code-annotation.openNote', treeActions.openNote.bind(treeActions));
    registerCommand('code-annotation.editNote', treeActions.editNote.bind(treeActions));
    registerCommand('code-annotation.copyNote', treeActions.copyNote.bind(treeActions));
    registerCommand('code-annotation.openNoteFromId', treeActions.openNoteFromId.bind(treeActions));

    registerCommand('code-annotation.summary', () => generateMarkdownReport());
    registerCommand('code-annotation.copySummaryToClipboard', () => copySummaryToClipboard());
    registerCommand('code-annotation.copyLLMReportToClipboard', () => copyLLMReportToClipboard());

    registerCommand('code-annotation.clearAllNotes', async () => {
        const message = 'Are you sure you want to clear all notes? This cannot be reverted.';
        const enableAction = 'I\'m sure';
        const cancelAction = 'Cancel';
        const userResponse = await vscode.window.showInformationMessage(message, enableAction, cancelAction);
        const clearAllNotes = userResponse === enableAction;

        if (clearAllNotes) {
            const annotationFile = getAnnotationFilePath();
            if (fs.existsSync(annotationFile)) {
                fs.unlinkSync(annotationFile);
            }
            await vscode.commands.executeCommand('code-annotation.refreshEntry');
            vscode.window.showInformationMessage('All notes cleared!');
        }
    });

    registerCommand('code-annotation.addPlainNote', () => addPlainNote());
    registerCommand('code-annotation.addNote', () => addNote());

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(() => updateDecorations(context))
    );

    updateDecorations(context);
}

// this method is called when your extension is deactivated
export function deactivate() { }
