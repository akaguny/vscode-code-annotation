import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

let storageLocation = '';
const annotationFile = 'annotations.json';

export const getAnnotationFilePath = (): string => {
    return path.join(storageLocation, annotationFile);
};

export const initializeStorageLocation = (location: string): void => {
    if (!location) {
        throw new Error('Error loading Storage for Extension');
    }

    storageLocation = location;
    if (!fs.existsSync(storageLocation)) {
        fs.mkdirSync(storageLocation, { recursive: true });
    }
    const extensionFilePath = getAnnotationFilePath();
    if (!fs.existsSync(extensionFilePath)) {
        fs.writeFileSync(extensionFilePath, '{"notes":[], "nextId":1}');
    }
};

export interface Color {
    dark: string;
    light: string;
}

export interface Configuration {
    showFileName: boolean;
    showCreatedAtTimestamp: boolean;
    showResolvedAtTimestamp: boolean;
    customTODO: string[];
    enableDecoration: boolean;
    decorationColors: Color;
}

export const getConfiguration = (): Configuration => {
    const configuration = vscode.workspace.getConfiguration('code-annotation');
    const showFileName = configuration.get<boolean>('showFileName', true);
    const showCreatedAtTimestamp = configuration.get<boolean>('showTimeStampForNoteCreation', false);
    const showResolvedAtTimestamp = configuration.get<boolean>('showTimeStampForNoteResolution', false);
    const customTODO = configuration.get<string[]>('customTODO', []);
    const enableDecoration = configuration.get<boolean>('annotationBG.enableDecoration', true);
    const decorationDarkColor = configuration.get<string>('annotationBG.color.dark', '#FFFFFF13');
    const decorationLightColor = configuration.get<string>('annotationBG.color.light', '#0000000C');
    return {
        showFileName,
        showCreatedAtTimestamp,
        showResolvedAtTimestamp,
        customTODO,
        enableDecoration,
        decorationColors: {
            dark: decorationDarkColor,
            light: decorationLightColor
        }
    };

};