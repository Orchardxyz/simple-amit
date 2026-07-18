<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		action?: Snippet;
		children: Snippet;
		description?: string;
		id: string;
		label: string;
		meta?: string;
	};

	let { action, children, description, id, label, meta }: Props = $props();
</script>

<div class="flex min-w-0 flex-col">
	<div class="mb-2 flex min-h-7 items-center justify-between gap-3">
		<label class="text-xs font-semibold" for={id}>
			{label}
		</label>
		{#if action}
			<span class="font-normal">
				{@render action()}
			</span>
		{:else if meta}
			<span class="font-normal text-[var(--vscode-descriptionForeground)]">{meta}</span>
		{/if}
	</div>
	{@render children()}
	{#if description}
		<p class="mt-1.5 text-[11px] leading-4 text-[var(--vscode-descriptionForeground)]">
			{description}
		</p>
	{/if}
</div>
