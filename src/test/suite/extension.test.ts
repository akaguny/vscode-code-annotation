import * as assert from 'assert';
import * as path from 'path';
import * as vscode from 'vscode';

import { getRelativePathForFileName, getTimeStampsString } from '../../utils';

suite('Utility helpers', () => {
    test('resolves workspace relative paths', () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        assert.ok(workspaceFolder, 'workspace folder should be available for tests');

        const filePath = path.join(workspaceFolder.uri.fsPath, 'src', 'extension.ts');
        const relativePath = getRelativePathForFileName(filePath);

        assert.strictEqual(relativePath, path.join('src', 'extension.ts'));
    });

    test('formats timestamps consistently', () => {
        const formatted = getTimeStampsString(new Date('2023-01-01T12:34:56.000Z'));

        assert.ok(/2023/.test(formatted));
        assert.ok(/12/.test(formatted));
    });
});
