import * as vscode from 'vscode';
import { SimpleAmitWebviewPanel } from './webviewPanel';

export function activate(context: vscode.ExtensionContext) {
	const webviewPanel = new SimpleAmitWebviewPanel(context);

	context.subscriptions.push(
		vscode.commands.registerCommand('simple-amit.openSettings', () =>
			webviewPanel.show(),
		),
		vscode.commands.registerCommand('simple-amit.generateCommitMessage', () => {
			vscode.window.showInformationMessage(
				'Commit-message generation is coming soon.',
			);
		}),
	);
}

export function deactivate() {}
