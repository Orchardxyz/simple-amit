<script lang="ts">
	import { ChevronDown, ChevronUp } from '@lucide/svelte';
	import type { Component, Snippet } from 'svelte';

	type Props = {
		bordered?: boolean;
		children: Snippet;
		icon: Component;
		open?: boolean;
		title: string;
	};

	let {
		bordered = false,
		children,
		icon: Icon,
		open = $bindable(true),
		title,
	}: Props = $props();
</script>

<section class={bordered ? 'border-t border-[var(--vscode-panel-border)]' : ''}>
	<button
		type="button"
		class="group flex w-full items-center gap-2.5 px-5 py-5 text-left outline-none hover:bg-[var(--vscode-list-hoverBackground)] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[var(--vscode-focusBorder)] sm:px-7"
		aria-expanded={open}
		onclick={() => (open = !open)}
	>
		<Icon
			size={16}
			strokeWidth={1.8}
			class="text-[var(--vscode-textLink-foreground)]"
			aria-hidden="true"
		/>
		<span class="font-mono text-[11px] font-semibold uppercase tracking-[0.09em] text-[var(--vscode-descriptionForeground)]">
			{title}
		</span>
		{#if open}
			<ChevronUp
				size={16}
				strokeWidth={1.8}
				class="ml-auto text-[var(--vscode-descriptionForeground)] transition-transform group-hover:text-[var(--vscode-editor-foreground)]"
				aria-hidden="true"
			/>
		{:else}
			<ChevronDown
				size={16}
				strokeWidth={1.8}
				class="ml-auto text-[var(--vscode-descriptionForeground)] transition-transform group-hover:text-[var(--vscode-editor-foreground)]"
				aria-hidden="true"
			/>
		{/if}
	</button>

	{#if open}
		{@render children()}
	{/if}
</section>
