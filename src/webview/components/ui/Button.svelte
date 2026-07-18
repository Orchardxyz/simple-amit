<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type ButtonVariant = 'primary' | 'secondary' | 'ghost';
	type ButtonSize = 'default' | 'icon';
	type ButtonClickEvent = Parameters<NonNullable<HTMLButtonAttributes['onclick']>>[0];

	type Props = Omit<HTMLButtonAttributes, 'class' | 'disabled' | 'type'> & {
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
		onclick,
		type = 'button',
		...restProps
	}: Props = $props();

	let variantClass = $derived(
		variant === 'primary'
			? 'border border-transparent bg-[var(--vscode-button-background)] font-semibold text-[var(--vscode-button-foreground)] hover:bg-[var(--vscode-button-hoverBackground)]'
			: variant === 'ghost'
				? 'border border-transparent text-[var(--vscode-descriptionForeground)] hover:bg-[var(--vscode-toolbar-hoverBackground)] hover:text-[var(--vscode-editor-foreground)]'
				: 'border border-[var(--vscode-button-border)] bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-button-secondaryForeground)] hover:bg-[var(--vscode-button-secondaryHoverBackground)]',
	);

	let sizeClass = $derived(size === 'icon' ? 'size-7 p-0' : 'px-3 py-2');

	function handleClick(event: ButtonClickEvent) {
		onclick?.(event);

		if (!event.defaultPrevented) {
			onClick?.();
		}
	}
</script>

<button
	{...restProps}
	class={`inline-flex shrink-0 items-center justify-center gap-1 rounded text-xs outline-none transition-colors focus-visible:ring-1 focus-visible:ring-[var(--vscode-focusBorder)] ${variantClass} ${sizeClass} ${className}`}
	{disabled}
	onclick={handleClick}
	{type}
	aria-label={ariaLabel}
>
	{@render children?.()}
</button>

<style>
	button:disabled {
		background: var(--vscode-input-background) !important;
		border-color: var(--vscode-disabledForeground) !important;
		color: var(--vscode-disabledForeground) !important;
		cursor: not-allowed;
		filter: grayscale(1);
		opacity: 0.42;
	}

	button:not(:disabled) {
		opacity: 1;
	}
</style>
