<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		description?: string;
		id: string;
		label: string;
		meta?: string;
	};

	let { children, description, id, label, meta }: Props = $props();
</script>

<div class="flex min-w-0 flex-col">
	<label class="mb-2 flex items-center justify-between gap-3 text-xs font-semibold" for={id}>
		{label}
		{#if meta}
			<span class="font-normal text-[var(--vscode-descriptionForeground)]">{meta}</span>
		{/if}
	</label>
	{@render children()}
	{#if description}
		<p class="mt-1.5 text-[11px] leading-4 text-[var(--vscode-descriptionForeground)]">
			{description}
		</p>
	{/if}
</div>
