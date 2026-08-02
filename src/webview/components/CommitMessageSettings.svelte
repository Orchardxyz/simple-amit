<script lang="ts">
	import { MessageSquareText, RotateCcw } from '@lucide/svelte';
	import { defaultInstructions, type CommitSettings } from '../../shared/commitSettings';
	import Button from './ui/Button.svelte';
	import FormField from './ui/FormField.svelte';
	import SegmentedControl from './ui/SegmentedControl.svelte';
	import SettingsSection from './ui/SettingsSection.svelte';
	import Tooltip from './ui/Tooltip.svelte';
	import type { Translator } from '../lib/i18n';

	type Props = {
		onChange: () => void;
		settings: CommitSettings;
		t: Translator;
	};

	let { onChange, settings = $bindable(), t }: Props = $props();
	let sectionOpen = $state(true);

	function updateSettings(changes: Partial<CommitSettings>) {
		settings = { ...settings, ...changes };
		onChange();
	}
</script>

<SettingsSection bind:open={sectionOpen} bordered icon={MessageSquareText} title={t('commit.section.title')}>
	<div class="px-5 pb-6 sm:px-7">
	<div class="grid gap-6">
		<div class="max-w-sm">
			<p class="mb-2 text-xs font-semibold">{t('commit.language.heading')}</p>
			<SegmentedControl
				label={t('commit.language.label')}
				bind:value={settings.language}
				options={[
					{ value: 'zh-CN', label: '简体中文' },
					{ value: 'en', label: 'English' },
				]}
				onChange={onChange}
			/>
			<p class="mt-1.5 text-[11px] leading-4 text-[var(--vscode-descriptionForeground)]">
				{t('commit.language.usedBySourceControl')}
			</p>
		</div>

		<FormField
			id="instructions"
			label={t('commit.instructions.label')}
		>
			{#snippet action()}
				<Tooltip text={t('commit.instructions.applyDefaultTooltip')}>
					{#snippet children(tooltipProps)}
						<Button
							{...tooltipProps}
							type="button"
							variant="ghost"
							size="icon"
							onClick={() => updateSettings({ instructions: defaultInstructions })}
							aria-label={t('commit.instructions.applyDefault')}
						>
							<RotateCcw size={14} strokeWidth={1.8} aria-hidden="true" />
						</Button>
					{/snippet}
				</Tooltip>
			{/snippet}
			<textarea
				id="instructions"
				class="input-control min-h-36 resize-y leading-5"
				value={settings.instructions}
				oninput={event => updateSettings({ instructions: event.currentTarget.value })}
			></textarea>
			<span class="mt-2 text-[11px] text-[var(--vscode-descriptionForeground)]">
				{t('commit.instructions.appliedBySourceControl')}
			</span>
		</FormField>
	</div>
	</div>
</SettingsSection>
