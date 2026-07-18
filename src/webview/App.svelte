<svelte:options runes={true} />

<script lang="ts">
	import brandMarkUrl from '../../resources/brand/simple-amit-mark.svg?url';
	import { BridgeMethod } from '../shared/webviewProtocol';
	import CommitMessageSettings from './components/CommitMessageSettings.svelte';
	import ModelPickerDialog from './components/ModelPickerDialog.svelte';
	import ProviderSettings from './components/ProviderSettings.svelte';
	import Button from './components/ui/Button.svelte';
	import ToastProvider from './components/ui/ToastProvider.svelte';
	import TooltipProvider from './components/ui/TooltipProvider.svelte';
	import { getApiKeyDraft, saveApiKeyDraft, type ApiKeyDrafts } from './lib/apiKeyDrafts';
	import { compatibleProviders, defaultCommitSettings } from './lib/compatibleProviders';
	import { getStaticModelOptions } from './lib/modelOptions';
	import { notify } from './lib/toast';
	import type { WebviewBridge } from './bridge';
	import type { CommitSettings } from '../shared/commitSettings';

	type Props = {
		bridge: WebviewBridge;
	};

	let { bridge }: Props = $props();

	let settings = $state({ ...defaultCommitSettings });
	let apiKey = $state('');
	let apiKeyDrafts = $state<ApiKeyDrafts>({});
	let apiKeyStatus = $state({ hasSavedKey: false });
	let modelPickerOpen = $state(false);
	let modelPickerError = $state('');
	let modelPickerLoading = $state(false);
	let modelPickerModels = $state<readonly string[]>([]);
	let modelPickerSourceLabel = $state('static list');
	let saveStatus = $state('Loading settings…');
	let connectionTestLoading = $state(false);
	let connectionTestMessage = $state('');
	let connectionTestOk = $state<boolean | undefined>(undefined);
	let requestInFlight = $state(false);
	let apiKeyRequestNumber = 0;
	let modelListRequestNumber = 0;
	let connectionTestRequestNumber = 0;

	let currentCompatibleProvider = $derived(
		compatibleProviders.find(provider => provider.id === settings.compatibleProviderId) ??
			compatibleProviders[0],
	);
	let availableModels = $derived(
		getStaticModelOptions(settings.providerType, settings.compatibleProviderId),
	);

	function markUnsaved() {
		saveStatus = 'Unsaved changes';
		connectionTestMessage = '';
		connectionTestOk = undefined;
	}

	function getSettingsSnapshot() {
		return { ...settings };
	}

	function rememberApiKeyDraft(providerSettings = getSettingsSnapshot(), draftApiKey = apiKey) {
		apiKeyDrafts = saveApiKeyDraft(apiKeyDrafts, providerSettings, draftApiKey);
	}

	function resetApiKeyDrafts(providerSettings: CommitSettings, draftApiKey: string) {
		apiKeyDrafts = saveApiKeyDraft({}, providerSettings, draftApiKey);
	}

	function handleApiKeyChange(nextApiKey: string) {
		apiKeyRequestNumber += 1;
		rememberApiKeyDraft(getSettingsSnapshot(), nextApiKey);
		markUnsaved();
	}

	function handleProviderSecretChange(nextSettings: CommitSettings, previousSettings: CommitSettings) {
		rememberApiKeyDraft(previousSettings);
		void refreshApiKeyStatus(nextSettings);
	}

	async function resetSettings() {
		requestInFlight = true;
		saveStatus = 'Resetting settings…';

		try {
			const resetState = await bridge.request(BridgeMethod.ResetSettings);
			settings = { ...resetState.settings };
			apiKey = resetState.apiKey.apiKey ?? '';
			resetApiKeyDrafts(resetState.settings, apiKey);
			apiKeyStatus = { ...resetState.apiKey };
			saveStatus = 'Defaults restored';
			notify.success('Defaults restored');
		} catch {
			saveStatus = 'Unable to reset settings';
			notify.error('Unable to reset settings');
		} finally {
			requestInFlight = false;
		}
	}

	async function saveSettings() {
		const settingsSnapshot = getSettingsSnapshot();
		requestInFlight = true;
		saveStatus = 'Saving settings…';

		try {
			const savedState = await bridge.request(BridgeMethod.SaveSettings, settingsSnapshot);
			settings = { ...savedState.settings };
			apiKeyStatus = { ...savedState.apiKey };

			if (apiKey.trim().length > 0) {
				const savedApiKeyState = await bridge.request(BridgeMethod.SaveApiKey, {
					apiKey,
					settings: savedState.settings,
				});
				apiKey = savedApiKeyState.apiKey.apiKey ?? apiKey;
				rememberApiKeyDraft(savedState.settings, apiKey);
				apiKeyStatus = { ...savedApiKeyState.apiKey };
				saveStatus = 'Settings and API key saved';
				notify.success('Settings and API key saved');
			} else if (savedState.apiKey.hasSavedKey) {
				const clearedState = await bridge.request(BridgeMethod.ClearApiKey, savedState.settings);
				apiKey = '';
				rememberApiKeyDraft(savedState.settings, '');
				apiKeyStatus = { ...clearedState.apiKey };
				saveStatus = 'Settings saved and API key cleared';
				notify.success('Settings saved and API key cleared');
			} else {
				saveStatus = 'Settings saved';
				notify.success('Settings saved');
			}
		} catch {
			saveStatus = 'Unable to save settings';
			notify.error('Unable to save settings');
		} finally {
			requestInFlight = false;
		}
	}

	async function loadInitialState() {
		requestInFlight = true;

		try {
			const initialState = await bridge.request(BridgeMethod.GetInitialState);
			settings = { ...initialState.settings };
			apiKey = initialState.apiKey.apiKey ?? '';
			resetApiKeyDrafts(initialState.settings, apiKey);
			apiKeyStatus = { ...initialState.apiKey };
			saveStatus = 'Settings loaded';
		} catch {
			saveStatus = 'Unable to load settings';
			notify.error('Unable to load settings');
		} finally {
			requestInFlight = false;
		}
	}

	function clearApiKey() {
		apiKeyRequestNumber += 1;
		apiKey = '';
		rememberApiKeyDraft(getSettingsSnapshot(), '');
		markUnsaved();
		notify.info('API key cleared from draft');
	}

	async function refreshApiKeyStatus(providerSettings = getSettingsSnapshot()) {
		const requestNumber = apiKeyRequestNumber + 1;
		apiKeyRequestNumber = requestNumber;
		const draftApiKey = getApiKeyDraft(apiKeyDrafts, providerSettings);

		try {
			const status = await bridge.request(BridgeMethod.GetApiKeyStatus, providerSettings);

			if (requestNumber === apiKeyRequestNumber) {
				apiKey = draftApiKey ?? status.apiKey.apiKey ?? '';
				apiKeyStatus = { ...status.apiKey };
			}
		} catch {
			if (requestNumber === apiKeyRequestNumber) {
				if (draftApiKey !== undefined) {
					apiKey = draftApiKey;
				}
				apiKeyStatus = { hasSavedKey: false };
			}
		}
	}

	async function openModelPicker() {
		const requestSettings = getSettingsSnapshot();
		const requestNumber = modelListRequestNumber + 1;
		modelListRequestNumber = requestNumber;
		modelPickerOpen = true;
		modelPickerModels = availableModels;
		modelPickerSourceLabel = 'static list';
		modelPickerError = '';

		if (requestSettings.providerType !== 'compatible') {
			return;
		}

		modelPickerLoading = true;

		try {
			const result = await bridge.request(BridgeMethod.FetchModelList, {
				settings: requestSettings,
				apiKey: apiKey.trim().length > 0 ? apiKey : undefined,
			});

			if (requestNumber === modelListRequestNumber) {
				modelPickerModels = result.models;
				modelPickerSourceLabel = 'fetched list';
			}
		} catch {
			if (requestNumber === modelListRequestNumber) {
				modelPickerModels = availableModels;
				modelPickerSourceLabel = 'static fallback';
				modelPickerError = apiKeyStatus.hasSavedKey || apiKey.trim().length > 0
					? 'Unable to fetch provider models. Showing the static fallback list.'
					: 'Save or enter an API key to fetch provider models. Showing the static fallback list.';
				notify.warning(modelPickerError);
			}
		} finally {
			if (requestNumber === modelListRequestNumber) {
				modelPickerLoading = false;
			}
		}
	}

	async function testConnection() {
		const requestSettings = getSettingsSnapshot();
		const requestNumber = connectionTestRequestNumber + 1;
		connectionTestRequestNumber = requestNumber;
		connectionTestLoading = true;
		connectionTestMessage = 'Testing provider connection…';
		connectionTestOk = undefined;

		try {
			const result = await bridge.request(BridgeMethod.TestProviderConnection, {
				settings: requestSettings,
				apiKey: apiKey.trim().length > 0 ? apiKey : undefined,
			});

			if (requestNumber === connectionTestRequestNumber) {
				connectionTestMessage = result.message;
				connectionTestOk = result.ok;
				if (result.ok) {
					notify.success(result.message);
				} else {
					notify.error(result.message);
				}
			}
		} catch {
			if (requestNumber === connectionTestRequestNumber) {
				connectionTestMessage = 'Unable to test provider connection.';
				connectionTestOk = false;
				notify.error('Unable to test provider connection.');
			}
		} finally {
			if (requestNumber === connectionTestRequestNumber) {
				connectionTestLoading = false;
			}
		}
	}

	$effect(() => {
		void loadInitialState();
	});
</script>

<TooltipProvider>
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
			connectionTestLoading={connectionTestLoading}
			connectionTestMessage={connectionTestMessage}
			connectionTestOk={connectionTestOk}
			onApiKeyChange={handleApiKeyChange}
			onClearApiKey={clearApiKey}
			onProviderSecretChange={handleProviderSecretChange}
			onChange={markUnsaved}
			onOpenModelPicker={() => void openModelPicker()}
			onTestConnection={() => void testConnection()}
		/>

		<CommitMessageSettings bind:settings onChange={markUnsaved} />

		<footer
			class="flex flex-col-reverse items-start justify-between gap-3 border-t border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBar-background)] px-5 py-4 sm:flex-row sm:items-center sm:px-7"
		>
			<span class="text-xs text-[var(--vscode-descriptionForeground)]" aria-live="polite">
				{saveStatus}
			</span>
			<div class="flex items-center gap-2">
				<Button type="button" disabled={requestInFlight} onClick={() => void resetSettings()}>Reset</Button>
				<Button
					variant="primary"
					type="button"
					onClick={() => void saveSettings()}
				>Save settings</Button>
			</div>
		</footer>
	</form>
</main>
</TooltipProvider>
<ToastProvider />

<ModelPickerDialog
	bind:open={modelPickerOpen}
	description={settings.providerType === 'compatible'
		? `${currentCompatibleProvider.displayName.toUpperCase()} · ${settings.baseUrl.replace(/\/$/, '')}/models`
	: `${settings.providerType.toUpperCase()} · provider model list`}
	errorMessage={modelPickerError}
	loading={modelPickerLoading}
	models={modelPickerModels}
	bind:selectedModel={settings.model}
	sourceLabel={modelPickerSourceLabel}
	onSelect={markUnsaved}
/>
