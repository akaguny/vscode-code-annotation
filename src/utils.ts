import * as path from 'path';
import * as vscode from 'vscode';

export const getRelativePathForFileName = (fullPathFileName: string): string => {
    const fileUri = vscode.Uri.file(fullPathFileName);
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(fileUri);

    if (workspaceFolder) {
        const relativePath = path.relative(workspaceFolder.uri.fsPath, fullPathFileName);
        return relativePath || path.basename(fullPathFileName);
    }

    return fullPathFileName;
};

export const getTimeStampsString = (date: Date): string => {
    return date.toLocaleString().substr(0, 16).replace('T', ' ');
};