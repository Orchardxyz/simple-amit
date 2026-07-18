<script lang="ts">
	import { Toaster } from 'svelte-sonner';
</script>

<Toaster
	position="top-right"
	closeButton
	visibleToasts={3}
	duration={3200}
	offset={16}
	mobileOffset={{ top: 12, right: 12, left: 12 }}
	containerAriaLabel="Notifications"
	closeButtonAriaLabel="Close notification"
	toastOptions={{
		class:
			'border border-[var(--vscode-panel-border)] bg-[var(--vscode-editorWidget-background)] text-[var(--vscode-editor-foreground)] shadow-lg',
		descriptionClass: 'text-[var(--vscode-descriptionForeground)]',
		classes: {
			title: 'text-xs font-medium',
			description: 'text-[11px]',
			closeButton:
				'border border-[var(--vscode-button-border)] bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-button-secondaryForeground)] hover:bg-[var(--vscode-button-secondaryHoverBackground)]',
			error: 'border-[var(--vscode-errorForeground)]',
			success: 'border-[var(--vscode-testing-iconPassed)]',
			warning: 'border-[var(--vscode-editorWarning-foreground)]',
			info: 'border-[var(--vscode-textLink-foreground)]',
		},
	}}
/>
