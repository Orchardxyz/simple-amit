<script lang="ts">
	import { Bot, Eye, EyeOff, PlugZap, RefreshCw, Trash2 } from '@lucide/svelte';
	import {
		getCurrentProviderModel,
		saveCurrentProviderModel,
		type CommitSettings,
		type CompatibleProviderId,
		type ProviderType,
	} from '../../shared/commitSettings';
	import { compatibleProviders } from '../lib/compatibleProviders';
	import Button from './ui/Button.svelte';
	import FormField from './ui/FormField.svelte';
	import SegmentedControl from './ui/SegmentedControl.svelte';
	import SettingsSection from './ui/SettingsSection.svelte';
	import Tooltip from './ui/Tooltip.svelte';

	type Props = {
		apiKey?: string;
		apiKeyHasSavedKey: boolean;
		connectionTestLoading?: boolean;
		connectionTestMessage?: string;
		connectionTestOk?: boolean;
		disabled?: boolean;
		// eslint-disable-next-line no-unused-vars
		onApiKeyChange: (apiKey: string) => void;
		onChange: () => void;
		onClearApiKey: () => void;
		onOpenModelPicker: () => void;
		// eslint-disable-next-line no-unused-vars
		onProviderSecretChange: (settings: CommitSettings, previousSettings: CommitSettings) => void;
		onTestConnection: () => void;
		settings: CommitSettings;
	};

	let {
		apiKey = $bindable(''),
		apiKeyHasSavedKey,
		connectionTestLoading = false,
		connectionTestMessage = '',
		connectionTestOk,
		disabled = false,
		onApiKeyChange,
		onChange,
		onClearApiKey,
		onOpenModelPicker,
		onProviderSecretChange,
		onTestConnection,
		settings = $bindable(),
	}: Props = $props();

	let showApiKey = $state(false);
	let sectionOpen = $state(true);
	let currentCompatibleProvider = $derived(
		compatibleProviders.find(provider => provider.id === settings.compatibleProviderId) ??
			compatibleProviders[0],
	);

	function updateSettings(changes: Partial<CommitSettings>) {
		const nextSettings = { ...settings, ...changes };
		settings = nextSettings;
		onChange();
		return nextSettings;
	}

	function updateProviderSelection(changes: Partial<CommitSettings>) {
		const previousSettings = settings;
		const settingsWithCurrentModel = {
			...settings,
			models: saveCurrentProviderModel(settings),
		};
		const nextSettingsWithoutResolvedModel = { ...settingsWithCurrentModel, ...changes };
		const nextSettings = {
			...nextSettingsWithoutResolvedModel,
			model: getCurrentProviderModel(nextSettingsWithoutResolvedModel),
		};

		settings = nextSettings;
		onChange();
		onProviderSecretChange(nextSettings, previousSettings);
	}

	function selectProviderType(value: string) {
		updateProviderSelection({ providerType: value as ProviderType });
	}

	function selectCompatibleProvider(providerId: CompatibleProviderId) {
		const compatibleProvider = compatibleProviders.find(provider => provider.id === providerId) ?? compatibleProviders[0];

		updateProviderSelection({
			compatibleProviderId: compatibleProvider.id,
			baseUrl: compatibleProvider.baseUrl,
		});
	}

	let connectionStatusMessage = $derived(
		connectionTestMessage.length > 0
			? connectionTestMessage
			: settings.providerType === 'compatible'
				? `Ready to fetch from ${currentCompatibleProvider.displayName}.`
				: 'Ready to test provider connection.',
	);

	let connectionStatusColor = $derived(
		connectionTestLoading
			? 'var(--vscode-progressBar-background)'
			: connectionTestOk === false
				? 'var(--vscode-errorForeground)'
				: 'var(--vscode-testing-iconPassed)',
	);
</script>

<SettingsSection bind:open={sectionOpen} icon={Bot} title="AI provider">
	<div class="px-5 pb-6 sm:px-7">

	<SegmentedControl
		label="AI provider type"
		value={settings.providerType}
		options={[
			{ value: 'anthropic', label: 'Anthropic' },
			{ value: 'gemini', label: 'Gemini' },
			{ value: 'compatible', label: 'OpenAI-Compatible' },
		]}
		onChange={selectProviderType}
	/>

	<div class="mt-6 grid gap-x-5 gap-y-5 md:grid-cols-2">
		{#if settings.providerType === 'compatible'}
			<FormField
				id="compatible-provider"
				label="Compatible provider"
			>
				<select
					id="compatible-provider"
					class="input-control"
					value={settings.compatibleProviderId}
					onchange={event => selectCompatibleProvider(event.currentTarget.value as CompatibleProviderId)}
				>
					{#each compatibleProviders as provider (provider.id)}
						<option value={provider.id}>{provider.displayName}</option>
					{/each}
				</select>
			</FormField>

			<FormField
				id="base-url"
				label="Base URL"
			>
				<input
					id="base-url"
					class="input-control"
					value={settings.baseUrl}
					oninput={event => updateSettings({ baseUrl: event.currentTarget.value })}
					spellcheck="false"
				/>
			</FormField>
		{/if}

		<FormField
			id="api-key"
			label="API key"
		>
			{#snippet action()}
				{#if apiKeyHasSavedKey}
					<Tooltip text="Clear API key">
						{#snippet children(tooltipProps)}
							<Button
								{...tooltipProps}
								type="button"
								variant="ghost"
								size="icon"
								disabled={disabled}
								onClick={onClearApiKey}
								aria-label="Clear API key"
							>
								<Trash2 size={14} strokeWidth={1.8} aria-hidden="true" />
							</Button>
						{/snippet}
					</Tooltip>
				{/if}
			{/snippet}
			<div class="relative">
				<input
					id="api-key"
					class="input-control pr-10"
					type={showApiKey ? 'text' : 'password'}
					value={apiKey}
					oninput={event => {
						apiKey = event.currentTarget.value;
						onApiKeyChange(apiKey);
					}}
					autocomplete="off"
					placeholder={apiKeyHasSavedKey ? 'API key saved' : 'Enter API key'}
				/>
				<Tooltip text={showApiKey ? 'Hide API key' : 'Show API key'}>
					{#snippet children(tooltipProps)}
						<Button
							{...tooltipProps}
							class="absolute inset-y-0 right-0 size-auto w-9 border-0 bg-transparent p-0 hover:bg-transparent"
							variant="ghost"
							size="icon"
							type="button"
							onClick={() => (showApiKey = !showApiKey)}
							aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
						>
							{#if showApiKey}
								<EyeOff size={14} strokeWidth={1.8} aria-hidden="true" />
							{:else}
								<Eye size={14} strokeWidth={1.8} aria-hidden="true" />
							{/if}
						</Button>
					{/snippet}
				</Tooltip>
			</div>
			<span class="mt-2 text-[11px] text-[var(--vscode-descriptionForeground)]">
				{apiKeyHasSavedKey ? 'Saved for current provider' : 'No key saved for current provider'}
			</span>
		</FormField>

		<FormField id="model" label="Model">
			<div class="flex gap-2">
				<input
					id="model"
					class="input-control min-w-0 flex-1"
					value={settings.model}
					oninput={event => updateSettings({ model: event.currentTarget.value })}
					placeholder={settings.providerType === 'compatible' ? 'Select a model' : 'Enter a model ID'}
					spellcheck="false"
				/>
				<Tooltip text="Test connection">
					{#snippet children(tooltipProps)}
						<Button
							{...tooltipProps}
							type="button"
							variant="secondary"
							size="icon"
							disabled={disabled || connectionTestLoading}
							onClick={onTestConnection}
							aria-label="Test connection"
						>
							<PlugZap size={14} strokeWidth={1.8} aria-hidden="true" />
						</Button>
					{/snippet}
				</Tooltip>
				{#if settings.providerType === 'compatible'}
					<Tooltip text="Fetch models">
						{#snippet children(tooltipProps)}
							<Button
								{...tooltipProps}
								type="button"
								variant="secondary"
								size="icon"
								disabled={disabled}
								onClick={onOpenModelPicker}
								aria-label="Fetch models"
							>
								<RefreshCw size={14} strokeWidth={1.8} aria-hidden="true" />
							</Button>
						{/snippet}
					</Tooltip>
				{/if}
			</div>
			<span class="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--vscode-descriptionForeground)]">
				<span class="size-1.5 rounded-full" style:background-color={connectionStatusColor} aria-hidden="true"></span>
				{connectionStatusMessage}
			</span>
		</FormField>
	</div>
	</div>
</SettingsSection>
