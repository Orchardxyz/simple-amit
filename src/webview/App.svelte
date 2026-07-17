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
	let apiKeyStatus = $state({ hasSavedKey: false });
	let modelPickerOpen = $state(false);
	let saveStatus = $state('Loading settings…');
	let requestInFlight = $state(false);
	let apiKeyRequestNumber = 0;

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

	async function resetSettings() {
		requestInFlight = true;
		saveStatus = 'Resetting settings…';

		try {
			const resetState = await bridge.request(BridgeMethod.ResetSettings);
			settings = { ...resetState.settings };
			apiKey = '';
			apiKeyStatus = { ...resetState.apiKey };
			saveStatus = 'Defaults restored';
		} catch {
			saveStatus = 'Unable to reset settings';
		} finally {
			requestInFlight = false;
		}
	}

	async function saveSettings() {
		requestInFlight = true;
		saveStatus = 'Saving settings…';

		try {
			const savedState = await bridge.request(BridgeMethod.SaveSettings, settings);
			settings = { ...savedState.settings };
			apiKeyStatus = { ...savedState.apiKey };

			if (apiKey.trim().length > 0) {
				const savedApiKeyState = await bridge.request(BridgeMethod.SaveApiKey, {
					apiKey,
					settings: savedState.settings,
				});
				apiKey = '';
				apiKeyStatus = { ...savedApiKeyState.apiKey };
				saveStatus = 'Settings and API key saved';
			} else {
				saveStatus = 'Settings saved';
			}
		} catch {
			saveStatus = 'Unable to save settings';
		} finally {
			requestInFlight = false;
		}
	}

	async function loadInitialState() {
		requestInFlight = true;

		try {
			const initialState = await bridge.request(BridgeMethod.GetInitialState);
			settings = { ...initialState.settings };
			apiKey = '';
			apiKeyStatus = { ...initialState.apiKey };
			saveStatus = 'Settings loaded';
		} catch {
			saveStatus = 'Unable to load settings';
		} finally {
			requestInFlight = false;
		}
	}

	async function clearApiKey() {
		requestInFlight = true;
		saveStatus = 'Clearing API key…';

		try {
			const clearedState = await bridge.request(BridgeMethod.ClearApiKey, settings);
			apiKey = '';
			apiKeyStatus = { ...clearedState.apiKey };
			saveStatus = 'API key cleared';
		} catch {
			saveStatus = 'Unable to clear API key';
		} finally {
			requestInFlight = false;
		}
	}

	async function refreshApiKeyStatus(providerSettings = settings) {
		const requestNumber = apiKeyRequestNumber + 1;
		apiKeyRequestNumber = requestNumber;

		try {
			const status = await bridge.request(BridgeMethod.GetApiKeyStatus, providerSettings);

			if (requestNumber === apiKeyRequestNumber) {
				apiKey = '';
				apiKeyStatus = { ...status.apiKey };
			}
		} catch {
			if (requestNumber === apiKeyRequestNumber) {
				apiKeyStatus = { hasSavedKey: false };
			}
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
			void saveSettings();
		}}
	>
		<ProviderSettings
			bind:settings
			bind:apiKey
			apiKeyHasSavedKey={apiKeyStatus.hasSavedKey}
			disabled={requestInFlight}
			onClearApiKey={() => void clearApiKey()}
			onProviderSecretChange={nextSettings => void refreshApiKeyStatus(nextSettings)}
			onChange={markUnsaved}
			onOpenModelPicker={() => (modelPickerOpen = true)}
		/>

		<CommitMessageSettings bind:settings onChange={markUnsaved} />

		<footer
			class="flex flex-col-reverse items-start justify-between gap-3 border-t border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBar-background)] px-5 py-4 sm:flex-row sm:items-center sm:px-7"
		>
			<span class="text-xs text-[var(--vscode-descriptionForeground)]" aria-live="polite">{saveStatus}</span>
			<div class="flex items-center gap-2">
				<Button type="button" disabled={requestInFlight} onClick={() => void resetSettings()}>Reset</Button>
				<Button variant="primary" disabled={requestInFlight} type="submit">Save settings</Button>
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
	onSelect={markUnsaved}
/>
