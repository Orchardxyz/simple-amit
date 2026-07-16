<svelte:options runes={true} />

<script lang="ts">
	import brandMarkUrl from '../../resources/brand/simple-amit-mark.svg?url';
	import { BridgeMethod } from '../shared/webviewProtocol';
	import CommitMessageSettings from './components/CommitMessageSettings.svelte';
	import ModelPickerDialog from './components/ModelPickerDialog.svelte';
	import ProviderSettings from './components/ProviderSettings.svelte';
	import Button from './components/ui/Button.svelte';
	import { compatibleProviders, defaultCommitSettings } from './lib/compatibleProviders';
	import { getStaticModelOptions } from './lib/modelOptions';
	import type { WebviewBridge } from './bridge';

	type Props = {
		bridge: WebviewBridge;
	};

	let { bridge }: Props = $props();

	let settings = $state({ ...defaultCommitSettings });
	let apiKey = $state('');
	let modelPickerOpen = $state(false);
	let saveStatus = $state('Loading settings…');

	let currentCompatibleProvider = $derived(
		compatibleProviders.find(provider => provider.id === settings.compatibleProviderId) ??
			compatibleProviders[0],
	);
	let availableModels = $derived(
		getStaticModelOptions(settings.providerType, settings.compatibleProviderId),
	);

	function markUnsaved() {
		saveStatus = 'Unsaved changes';
	}

	function resetSettings() {
		settings = { ...defaultCommitSettings };
		apiKey = '';
		saveStatus = 'Defaults restored';
	}

	function saveSettings() {
		saveStatus = 'Settings saved';
	}

	async function loadInitialState() {
		try {
			const initialState = await bridge.request(BridgeMethod.GetInitialState);
			settings = { ...initialState.settings };
			saveStatus = 'Settings loaded';
		} catch {
			saveStatus = 'Unable to load settings';
		}
	}

	$effect(() => {
		void loadInitialState();
	});
</script>

<main class="mx-auto w-full max-w-4xl px-5 py-7 sm:px-8 sm:py-10">
	<header class="mb-6 flex items-center gap-3">
		<img class="size-8 rounded-md" src={brandMarkUrl} alt="" />
		<h1 class="m-0 text-base font-semibold tracking-tight">Simple Amit</h1>
	</header>

	<form
		class="overflow-hidden rounded-lg border border-[var(--vscode-panel-border)] bg-[var(--vscode-editorWidget-background)]"
		onsubmit={event => {
			event.preventDefault();
			saveSettings();
		}}
	>
		<ProviderSettings
			bind:settings
			bind:apiKey
			onchange={markUnsaved}
			onopenmodelpicker={() => (modelPickerOpen = true)}
		/>

		<CommitMessageSettings bind:settings onchange={markUnsaved} />

		<footer
			class="flex flex-col-reverse items-start justify-between gap-3 border-t border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBar-background)] px-5 py-4 sm:flex-row sm:items-center sm:px-7"
		>
			<span class="text-xs text-[var(--vscode-descriptionForeground)]" aria-live="polite">{saveStatus}</span>
			<div class="flex items-center gap-2">
				<Button type="button" onclick={resetSettings}>Reset</Button>
				<Button variant="primary" type="submit">Save settings</Button>
			</div>
		</footer>
	</form>
</main>

<ModelPickerDialog
	bind:open={modelPickerOpen}
	description={settings.providerType === 'compatible'
		? `${currentCompatibleProvider.displayName.toUpperCase()} · ${settings.baseUrl.replace(/\/$/, '')}/models`
		: `${settings.providerType.toUpperCase()} · provider model list`}
	models={availableModels}
	bind:selectedModel={settings.model}
	onselect={markUnsaved}
/>
