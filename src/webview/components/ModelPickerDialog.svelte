<script lang="ts">
	import { tick } from 'svelte';
	import Button from './ui/Button.svelte';
	import Dialog from './ui/Dialog.svelte';
	import type { Translator } from '../lib/i18n';

	type Props = {
		description: string;
		errorMessage?: string;
		loading?: boolean;
		models: readonly string[];
		onSelect: () => void;
		open?: boolean;
		selectedModel?: string;
		sourceLabel: string;
		t: Translator;
	};

	let {
		description,
		errorMessage = '',
		loading = false,
		models,
		onSelect,
		open = $bindable(false),
		selectedModel = $bindable(''),
		sourceLabel,
		t,
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
		onSelect();
		open = false;
		await tick();
	}
</script>

{#snippet footer()}
	<div class="flex items-center justify-between gap-4">
		<span class="text-[11px] text-[var(--vscode-descriptionForeground)]">
			{#if loading}
				{t('modelDialog.fetchingModels')}
			{:else}
				{t('modelDialog.footer.count', { count: models.length, source: sourceLabel })}
			{/if}
		</span>
		<div class="flex gap-2">
			<Button type="button" onClick={() => (open = false)}>{t('modelDialog.action.cancel')}</Button>
			<Button variant="primary" type="button" disabled={pendingModel.length === 0} onClick={chooseModel}>{t('modelDialog.action.useModel')}</Button>
		</div>
	</div>
{/snippet}

<Dialog bind:open title={t('modelDialog.title')} {description} {footer} {t}>
	<input
		id="model-search"
		class="input-control"
		bind:value={modelSearch}
		placeholder={loading ? t('modelDialog.fetchingModels') : t('modelDialog.searchPlaceholder')}
		autocomplete="off"
		disabled={loading}
	/>
	{#if errorMessage.length > 0}
		<p class="m-0 mt-2 text-xs text-[var(--vscode-errorForeground)]">{errorMessage}</p>
	{/if}
	<div class="mt-3 max-h-60 overflow-auto rounded border border-[var(--vscode-panel-border)]">
		{#if loading}
			<p class="m-0 px-3 py-4 text-xs text-[var(--vscode-descriptionForeground)]">{t('modelDialog.loadingList')}</p>
		{:else if filteredModels.length > 0}
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
			<p class="m-0 px-3 py-4 text-xs text-[var(--vscode-descriptionForeground)]">{t('modelDialog.noMatchingModels')}</p>
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
