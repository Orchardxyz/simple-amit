<script lang="ts">
	import { tick } from 'svelte';
	import Button from './ui/Button.svelte';
	import Dialog from './ui/Dialog.svelte';

	type Props = {
		description: string;
		models: readonly string[];
		onselect: () => void;
		open?: boolean;
		selectedModel?: string;
	};

	let {
		description,
		models,
		onselect,
		open = $bindable(false),
		selectedModel = $bindable(''),
	}: Props = $props();

	let modelSearch = $state('');
	let pendingModel = $state('');
	let filteredModels = $derived(
		models.filter(model => model.toLowerCase().includes(modelSearch.trim().toLowerCase())),
	);

	$effect(() => {
		if (!open) return;
		pendingModel = selectedModel;
		modelSearch = '';
	});

	async function chooseModel() {
		selectedModel = pendingModel;
		onselect();
		open = false;
		await tick();
	}
</script>

{#snippet footer()}
	<div class="flex items-center justify-between gap-4">
		<span class="text-[11px] text-[var(--vscode-descriptionForeground)]">
			{models.length} models in the static list
		</span>
		<div class="flex gap-2">
			<Button type="button" onclick={() => (open = false)}>Cancel</Button>
			<Button variant="primary" type="button" onclick={chooseModel}>Use model</Button>
		</div>
	</div>
{/snippet}

<Dialog bind:open title="Select a model" {description} {footer}>
	<input
		id="model-search"
		class="input-control"
		bind:value={modelSearch}
		placeholder="Search fetched models…"
		autocomplete="off"
	/>
	<div class="mt-3 max-h-60 overflow-auto rounded border border-[var(--vscode-panel-border)]">
		{#if filteredModels.length > 0}
			{#each filteredModels as modelName (modelName)}
				<button
					class:selected-model={pendingModel === modelName}
					class="flex w-full items-center gap-2.5 border-b border-[var(--vscode-panel-border)] px-3 py-2.5 text-left font-mono text-xs last:border-b-0 hover:bg-[var(--vscode-list-hoverBackground)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--vscode-focusBorder)]"
					type="button"
					onclick={() => (pendingModel = modelName)}
				>
					<span
						class:selected-model-dot={pendingModel === modelName}
						class="size-3 rounded-full border border-[var(--vscode-radio-inactiveBorder)]"
						aria-hidden="true"
					></span>
					{modelName}
				</button>
			{/each}
		{:else}
			<p class="m-0 px-3 py-4 text-xs text-[var(--vscode-descriptionForeground)]">No matching models.</p>
		{/if}
	</div>
</Dialog>

<style>
	.selected-model {
		background: var(--vscode-list-activeSelectionBackground);
		color: var(--vscode-list-activeSelectionForeground);
	}

	.selected-model-dot {
		border: 4px solid var(--vscode-radio-activeForeground);
	}
</style>
