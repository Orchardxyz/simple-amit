<svelte:options runes={true} />

<script lang="ts">
	import { Bug, Languages } from '@lucide/svelte';
	import brandMarkUrl from '../../resources/brand/simple-amit-mark.svg?url';
	import { defaultUiLanguage, type UiLanguage } from '../shared/uiLanguage';
	import { BridgeMethod } from '../shared/webviewProtocol';
	import CommitMessageSettings from './components/CommitMessageSettings.svelte';
	import ModelPickerDialog from './components/ModelPickerDialog.svelte';
	import ProviderSettings from './components/ProviderSettings.svelte';
	import Button from './components/ui/Button.svelte';
	import ToastProvider from './components/ui/ToastProvider.svelte';
	import Tooltip from './components/ui/Tooltip.svelte';
	import TooltipProvider from './components/ui/TooltipProvider.svelte';
	import { getApiKeyDraft, saveApiKeyDraft, type ApiKeyDrafts } from './lib/apiKeyDrafts';
	import { compatibleProviders, defaultCommitSettings } from './lib/compatibleProviders';
	import { createTranslator, type I18nKey } from './lib/i18n';
	import { getStaticModelOptions } from './lib/modelOptions';
	import { notify } from './lib/toast';
	import type { WebviewBridge } from './bridge';
	import type { CommitSettings } from '../shared/commitSettings';

	type Props = {
		bridge: WebviewBridge;
	};

	type ModelPickerSourceKind = 'fetchedList' | 'staticFallback' | 'staticList';

	const issueUrl = 'https://github.com/Orchardxyz/simple-amit/issues';

	let { bridge }: Props = $props();

	let settings = $state({ ...defaultCommitSettings });
	let apiKey = $state('');
	let apiKeyDrafts = $state<ApiKeyDrafts>({});
	let apiKeyStatus = $state({ hasSavedKey: false });
	let uiLanguage = $state<UiLanguage>(defaultUiLanguage);
	let modelPickerOpen = $state(false);
	let modelPickerLoading = $state(false);
	let modelPickerModels = $state<readonly string[]>([]);
	let modelPickerErrorKey = $state<I18nKey | ''>('');
	let modelPickerSourceKind = $state<ModelPickerSourceKind>('staticList');
	let saveStatusKey = $state<I18nKey>('app.status.loadingSettings');
	let connectionTestLoading = $state(false);
	let connectionTestMessageKey = $state<I18nKey | undefined>(undefined);
	let connectionTestProviderMessage = $state('');
	let connectionTestOk = $state<boolean | undefined>(undefined);
	let requestInFlight = $state(false);
	let apiKeyRequestNumber = 0;
	let modelListRequestNumber = 0;
	let connectionTestRequestNumber = 0;
	let uiLanguageRequestNumber = 0;

	let t = $derived(createTranslator(uiLanguage));
	let saveStatus = $derived(t(saveStatusKey));
	let connectionTestMessage = $derived(
		connectionTestProviderMessage.length > 0
			? connectionTestProviderMessage
			: connectionTestMessageKey === undefined
				? ''
				: t(connectionTestMessageKey),
	);
	let currentCompatibleProvider = $derived(
		compatibleProviders.find(provider => provider.id === settings.compatibleProviderId) ??
			compatibleProviders[0],
	);
	let availableModels = $derived(
		getStaticModelOptions(settings.providerType, settings.compatibleProviderId),
	);
	let modelPickerSourceLabel = $derived(
		modelPickerSourceKind === 'fetchedList'
			? t('modelPicker.source.fetchedList')
			: modelPickerSourceKind === 'staticFallback'
				? t('modelPicker.source.staticFallback')
				: t('modelPicker.source.staticList'),
	);
	let modelPickerError = $derived(modelPickerErrorKey === '' ? '' : t(modelPickerErrorKey));
	let languageToggleLabel = $derived(t('app.language.change'));

	function markUnsaved() {
		saveStatusKey = 'app.status.unsavedChanges';
		connectionTestMessageKey = undefined;
		connectionTestProviderMessage = '';
		connectionTestOk = undefined;
	}

	function getSettingsSnapshot() {
		return $state.snapshot(settings);
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
		saveStatusKey = 'app.status.resettingSettings';

		try {
			const resetState = await bridge.request(BridgeMethod.ResetSettings);
			settings = { ...resetState.settings };
			apiKey = resetState.apiKey.apiKey ?? '';
			resetApiKeyDrafts(resetState.settings, apiKey);
			apiKeyStatus = { ...resetState.apiKey };
			uiLanguage = resetState.uiLanguage;
			saveStatusKey = 'app.status.defaultsRestored';
			notify.success(t('app.status.defaultsRestored'));
		} catch {
			saveStatusKey = 'app.status.unableResetSettings';
			notify.error(t('app.status.unableResetSettings'));
		} finally {
			requestInFlight = false;
		}
	}

	async function saveSettings() {
		const settingsSnapshot = getSettingsSnapshot();
		requestInFlight = true;
		saveStatusKey = 'app.status.savingSettings';

		try {
			const savedState = await bridge.request(BridgeMethod.SaveSettings, settingsSnapshot);
			settings = { ...savedState.settings };
			apiKeyStatus = { ...savedState.apiKey };
			uiLanguage = savedState.uiLanguage;

			if (apiKey.trim().length > 0) {
				const savedApiKeyState = await bridge.request(BridgeMethod.SaveApiKey, {
					apiKey,
					settings: savedState.settings,
				});
				apiKey = savedApiKeyState.apiKey.apiKey ?? apiKey;
				rememberApiKeyDraft(savedState.settings, apiKey);
				apiKeyStatus = { ...savedApiKeyState.apiKey };
				saveStatusKey = 'app.status.settingsAndApiKeySaved';
				notify.success(t('app.status.settingsAndApiKeySaved'));
			} else if (savedState.apiKey.hasSavedKey) {
				const clearedState = await bridge.request(BridgeMethod.ClearApiKey, savedState.settings);
				apiKey = '';
				rememberApiKeyDraft(savedState.settings, '');
				apiKeyStatus = { ...clearedState.apiKey };
				saveStatusKey = 'app.status.settingsSavedAndApiKeyCleared';
				notify.success(t('app.status.settingsSavedAndApiKeyCleared'));
			} else {
				saveStatusKey = 'app.status.settingsSaved';
				notify.success(t('app.status.settingsSaved'));
			}
		} catch {
			saveStatusKey = 'app.status.unableSaveSettings';
			notify.error(t('app.status.unableSaveSettings'));
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
			uiLanguage = initialState.uiLanguage;
			saveStatusKey = 'app.status.settingsLoaded';
		} catch {
			saveStatusKey = 'app.status.unableLoadSettings';
			notify.error(t('app.status.unableLoadSettings'));
		} finally {
			requestInFlight = false;
		}
	}

	function clearApiKey() {
		apiKeyRequestNumber += 1;
		apiKey = '';
		rememberApiKeyDraft(getSettingsSnapshot(), '');
		markUnsaved();
		notify.info(t('app.status.apiKeyClearedFromDraft'));
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
		modelPickerSourceKind = 'staticList';
		modelPickerErrorKey = '';

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
				modelPickerSourceKind = 'fetchedList';
			}
		} catch {
			if (requestNumber === modelListRequestNumber) {
				modelPickerModels = availableModels;
				modelPickerSourceKind = 'staticFallback';
				modelPickerErrorKey = apiKeyStatus.hasSavedKey || apiKey.trim().length > 0
					? 'modelPicker.error.unableFetch'
					: 'modelPicker.error.needApiKey';
				notify.warning(t(modelPickerErrorKey));
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
		connectionTestMessageKey = 'connection.testingProvider';
		connectionTestProviderMessage = '';
		connectionTestOk = undefined;

		try {
			const result = await bridge.request(BridgeMethod.TestProviderConnection, {
				settings: requestSettings,
				apiKey: apiKey.trim().length > 0 ? apiKey : undefined,
			});

			if (requestNumber === connectionTestRequestNumber) {
				connectionTestMessageKey = undefined;
				connectionTestProviderMessage = result.message;
				connectionTestOk = result.ok;
				if (result.ok) {
					notify.success(result.message);
				} else {
					notify.error(result.message);
				}
			}
		} catch {
			if (requestNumber === connectionTestRequestNumber) {
				connectionTestMessageKey = 'connection.unableTestProvider';
				connectionTestProviderMessage = '';
				connectionTestOk = false;
				notify.error(t('connection.unableTestProvider'));
			}
		} finally {
			if (requestNumber === connectionTestRequestNumber) {
				connectionTestLoading = false;
			}
		}
	}

	async function toggleUiLanguage() {
		const previousUiLanguage = uiLanguage;
		const nextUiLanguage: UiLanguage = uiLanguage === 'en' ? 'zh-CN' : 'en';
		const requestNumber = uiLanguageRequestNumber + 1;
		uiLanguageRequestNumber = requestNumber;
		uiLanguage = nextUiLanguage;

		try {
			const result = await bridge.request(BridgeMethod.SaveUiLanguage, nextUiLanguage);

			if (requestNumber === uiLanguageRequestNumber) {
				uiLanguage = result.uiLanguage;
				saveStatusKey = 'app.status.uiLanguageSaved';
				notify.success(t('app.status.uiLanguageSaved'));
			}
		} catch {
			if (requestNumber === uiLanguageRequestNumber) {
				uiLanguage = previousUiLanguage;
				saveStatusKey = 'app.status.unableSaveUiLanguage';
				notify.error(t('app.status.unableSaveUiLanguage'));
			}
		}
	}

	$effect(() => {
		void loadInitialState();
	});

	$effect(() => {
		// eslint-disable-next-line no-undef
		window.document.documentElement.lang = uiLanguage;
	});
</script>

<TooltipProvider>
<main class="mx-auto w-full max-w-4xl px-5 py-7 sm:px-8 sm:py-10">
	<header class="mb-6 flex items-center gap-3">
		<div class="flex min-w-0 items-center gap-3">
			<img class="size-8 rounded-md" src={brandMarkUrl} alt="" />
			<h1 class="m-0 truncate text-base font-semibold tracking-tight">Simple Amit</h1>
		</div>
		<div class="ml-auto flex items-center gap-1">
			<Tooltip text={languageToggleLabel}>
				{#snippet children(tooltipProps)}
					<Button
						{...tooltipProps}
						type="button"
						variant="ghost"
						size="icon"
						onClick={() => void toggleUiLanguage()}
						aria-label={languageToggleLabel}
					>
						<Languages size={15} strokeWidth={1.8} aria-hidden="true" />
					</Button>
				{/snippet}
			</Tooltip>
			<Tooltip text={t('app.bugReport')}>
				{#snippet children(tooltipProps)}
					<a
						{...tooltipProps}
						class="inline-flex size-7 shrink-0 items-center justify-center rounded border border-transparent text-xs text-[var(--vscode-descriptionForeground)] outline-none transition-colors hover:bg-[var(--vscode-toolbar-hoverBackground)] hover:text-[var(--vscode-editor-foreground)] focus-visible:ring-1 focus-visible:ring-[var(--vscode-focusBorder)]"
						href={issueUrl}
						target="_blank"
						rel="noreferrer"
						aria-label={t('app.bugReport')}
					>
						<Bug size={15} strokeWidth={1.8} aria-hidden="true" />
					</a>
				{/snippet}
			</Tooltip>
		</div>
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
			{t}
		/>

		<CommitMessageSettings bind:settings onChange={markUnsaved} {t} />

		<footer
			class="flex flex-col-reverse items-start justify-between gap-3 border-t border-[var(--vscode-panel-border)] bg-[var(--vscode-sideBar-background)] px-5 py-4 sm:flex-row sm:items-center sm:px-7"
		>
			<span class="text-xs text-[var(--vscode-descriptionForeground)]" aria-live="polite">
				{saveStatus}
			</span>
			<div class="flex items-center gap-2">
				<Button type="button" disabled={requestInFlight} onClick={() => void resetSettings()}>{t('app.action.reset')}</Button>
				<Button
					variant="primary"
					type="button"
					onClick={() => void saveSettings()}
				>{t('app.action.saveSettings')}</Button>
			</div>
		</footer>
	</form>
</main>
</TooltipProvider>
<ToastProvider />

<ModelPickerDialog
	bind:open={modelPickerOpen}
	description={settings.providerType === 'compatible'
		? t('modelPicker.description.compatible', {
			provider: currentCompatibleProvider.displayName.toUpperCase(),
			url: settings.baseUrl.replace(/\/$/, ''),
		})
	: t('modelPicker.description.provider', { provider: settings.providerType.toUpperCase() })}
	errorMessage={modelPickerError}
	loading={modelPickerLoading}
	models={modelPickerModels}
	bind:selectedModel={settings.model}
	sourceLabel={modelPickerSourceLabel}
	onSelect={markUnsaved}
	{t}
/>
