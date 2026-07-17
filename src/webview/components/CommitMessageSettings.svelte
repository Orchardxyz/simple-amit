<script lang="ts">
	import { MessageSquareText } from '@lucide/svelte';
	import { defaultInstructions, type CommitSettings } from '../../shared/commitSettings';
	import FormField from './ui/FormField.svelte';
	import SegmentedControl from './ui/SegmentedControl.svelte';
	import SettingsSection from './ui/SettingsSection.svelte';

	type Props = {
		onChange: () => void;
		settings: CommitSettings;
	};

	let { onChange, settings = $bindable() }: Props = $props();
	let sectionOpen = $state(true);

	function updateSettings(changes: Partial<CommitSettings>) {
		settings = { ...settings, ...changes };
		onChange();
	}
</script>

<SettingsSection bind:open={sectionOpen} bordered icon={MessageSquareText} title="Commit message">
	<div class="px-5 pb-6 sm:px-7">

	<div class="grid gap-6 md:grid-cols-[11rem_minmax(0,1fr)]">
		<div>
			<p class="mb-2 text-xs font-semibold">Language</p>
			<SegmentedControl
				label="Commit message language"
				bind:value={settings.language}
				options={[
					{ value: 'zh-CN', label: '简体中文' },
					{ value: 'en', label: 'English' },
				]}
				onChange={onChange}
			/>
			<p class="mt-1.5 text-[11px] leading-4 text-[var(--vscode-descriptionForeground)]">
				Used by the Source Control command.
			</p>
		</div>

		<FormField
			id="instructions"
			label="Generation instructions"
			meta="Editable"
		>
			<textarea
				id="instructions"
				class="input-control min-h-36 resize-y leading-5"
				value={settings.instructions}
				oninput={event => updateSettings({ instructions: event.currentTarget.value })}
			></textarea>
			<span class="mt-2 flex items-center justify-between gap-4">
				<button
					class="text-left text-[11px] text-[var(--vscode-textLink-foreground)] underline underline-offset-2 outline-none hover:text-[var(--vscode-textLink-activeForeground)] focus-visible:ring-1 focus-visible:ring-[var(--vscode-focusBorder)]"
					type="button"
					onclick={() => updateSettings({ instructions: defaultInstructions })}
				>
					Restore default instructions
				</button>
				<span class="text-right text-[11px] text-[var(--vscode-descriptionForeground)]">
					Applied when you generate from Source Control
				</span>
			</span>
		</FormField>
	</div>
	</div>
</SettingsSection>
