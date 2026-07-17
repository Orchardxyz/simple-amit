<script lang="ts">
	import { Bot, RefreshCw } from '@lucide/svelte';
	import {
		type CommitSettings,
		type ProviderType,
	} from '../../shared/commitSettings';
	import { compatibleProviders } from '../lib/compatibleProviders';
	import Button from './ui/Button.svelte';
	import FormField from './ui/FormField.svelte';
	import SegmentedControl from './ui/SegmentedControl.svelte';
	import SettingsSection from './ui/SettingsSection.svelte';

	type Props = {
		apiKey?: string;
		apiKeyHasSavedKey: boolean;
		disabled?: boolean;
		onChange: () => void;
		onClearApiKey: () => void;
		onOpenModelPicker: () => void;
		// eslint-disable-next-line no-unused-vars
		onProviderSecretChange: (settings: CommitSettings) => void;
		settings: CommitSettings;
	};

	let {
		apiKey = $bindable(''),
		apiKeyHasSavedKey,
		disabled = false,
		onChange,
		onClearApiKey,
		onOpenModelPicker,
		onProviderSecretChange,
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

	function selectProviderType(value: string) {
		const providerType = value as ProviderType;
		const nextSettings = updateSettings({ providerType, model: '' });
		onProviderSecretChange(nextSettings);
	}

	function selectCompatibleProvider() {
		const nextSettings = updateSettings({
			baseUrl: currentCompatibleProvider.baseUrl,
			model: '',
		});
		onProviderSecretChange(nextSettings);
	}
</script>

<SettingsSection bind:open={sectionOpen} icon={Bot} title="AI provider">
	<div class="px-5 pb-6 sm:px-7">

	<SegmentedControl
		label="AI provider type"
		bind:value={settings.providerType}
		options={[
			{ value: 'anthropic', label: 'Anthropic' },
			{ value: 'gemini', label: 'Gemini' },
			{ value: 'compatible', label: 'OpenAI-Compatible' },
		]}
		onChange={() => selectProviderType(settings.providerType)}
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
					bind:value={settings.compatibleProviderId}
					onchange={selectCompatibleProvider}
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
			<div class="relative">
				<input
					id="api-key"
					class="input-control pr-10"
					type={showApiKey ? 'text' : 'password'}
					bind:value={apiKey}
					oninput={onChange}
					autocomplete="off"
					placeholder={apiKeyHasSavedKey ? 'API key saved' : 'Enter API key'}
				/>
				<Button
					class="absolute inset-y-0 right-0 size-auto w-9 border-0 bg-transparent p-0 text-sm hover:bg-transparent"
					variant="ghost"
					size="icon"
					type="button"
					onClick={() => (showApiKey = !showApiKey)}
					aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
				>
					{#if showApiKey}◉{:else}○{/if}
				</Button>
			</div>
			<span class="mt-2 flex items-center justify-between gap-3 text-[11px] text-[var(--vscode-descriptionForeground)]">
				<span>
					{apiKeyHasSavedKey ? 'Saved for current provider' : 'No key saved for current provider'}
				</span>
				{#if apiKeyHasSavedKey}
					<Button type="button" disabled={disabled} onClick={onClearApiKey}>Clear key</Button>
				{/if}
			</span>
		</FormField>

		<FormField id="model" label="Model">
			{#if settings.providerType === 'compatible'}
				<div class="flex gap-2">
					<input
						id="model"
						class="input-control min-w-0 flex-1"
						value={settings.model}
						oninput={event => updateSettings({ model: event.currentTarget.value })}
						placeholder="Select a model"
						spellcheck="false"
					/>
					<Button type="button" onClick={onOpenModelPicker}>
						<RefreshCw size={14} strokeWidth={1.8} aria-hidden="true" />
						Fetch models
					</Button>
				</div>
				<span class="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--vscode-descriptionForeground)]">
					<span class="size-1.5 rounded-full bg-[var(--vscode-testing-iconPassed)]" aria-hidden="true"></span>
					Ready to fetch from {currentCompatibleProvider.displayName}.
				</span>
			{:else}
				<input
					id="model"
					class="input-control"
					value={settings.model}
					oninput={event => updateSettings({ model: event.currentTarget.value })}
					placeholder="Enter a model ID"
					spellcheck="false"
				/>
			{/if}
		</FormField>
	</div>
	</div>
</SettingsSection>
