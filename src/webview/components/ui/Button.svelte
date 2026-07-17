<script lang="ts">
	import type { Snippet } from 'svelte';

	type ButtonVariant = 'primary' | 'secondary' | 'ghost';
	type ButtonSize = 'default' | 'icon';

	type Props = {
		'aria-label'?: string;
		children?: Snippet;
		class?: string;
		disabled?: boolean;
		onClick?: () => void;
		variant?: ButtonVariant;
		size?: ButtonSize;
		type?: 'button' | 'reset' | 'submit';
	};

	let {
		children,
		variant = 'secondary',
		size = 'default',
		class: className = '',
		'aria-label': ariaLabel,
		disabled,
		onClick,
		type = 'button',
	}: Props = $props();

	let variantClass = $derived(
		variant === 'primary'
			? 'border border-transparent bg-[var(--vscode-button-background)] font-semibold text-[var(--vscode-button-foreground)] hover:bg-[var(--vscode-button-hoverBackground)]'
			: variant === 'ghost'
				? 'border border-transparent text-[var(--vscode-descriptionForeground)] hover:bg-[var(--vscode-toolbar-hoverBackground)] hover:text-[var(--vscode-editor-foreground)]'
				: 'border border-[var(--vscode-button-border)] bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-button-secondaryForeground)] hover:bg-[var(--vscode-button-secondaryHoverBackground)]',
	);

	let sizeClass = $derived(size === 'icon' ? 'size-7 p-0' : 'px-3 py-2');
</script>

<button
	class={`inline-flex shrink-0 items-center justify-center gap-1 rounded text-xs outline-none transition-colors focus-visible:ring-1 focus-visible:ring-[var(--vscode-focusBorder)] disabled:cursor-not-allowed disabled:opacity-50 ${variantClass} ${sizeClass} ${className}`}
	{disabled}
	onclick={onClick}
	{type}
	aria-label={ariaLabel}
>
	{@render children?.()}
</button>
