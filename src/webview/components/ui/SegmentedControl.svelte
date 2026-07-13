<script lang="ts">
	type Option = {
		label: string;
		value: string;
	};

	type Props = {
		label: string;
		onchange?: () => void;
		options: Option[];
		value?: string;
	};

	let { label, onchange, options, value = $bindable('') }: Props = $props();

	function select(valueToSelect: string) {
		value = valueToSelect;
		onchange?.();
	}
</script>

<div
	class="inline-flex rounded-md border border-[var(--vscode-panel-border)] bg-[var(--vscode-editor-background)] p-0.5"
	role="group"
	aria-label={label}
>
	{#each options as option (option.value)}
		<button
			type="button"
			class={`rounded px-3 py-1.5 text-xs outline-none transition-colors focus-visible:ring-1 focus-visible:ring-[var(--vscode-focusBorder)] ${
				value === option.value
					? 'bg-[var(--vscode-button-background)] font-semibold text-[var(--vscode-button-foreground)] shadow-sm hover:bg-[var(--vscode-button-hoverBackground)]'
					: 'text-[var(--vscode-descriptionForeground)] hover:bg-[var(--vscode-list-hoverBackground)] hover:text-[var(--vscode-editor-foreground)]'
			}`}
			aria-pressed={value === option.value}
			onclick={() => select(option.value)}
		>
			{option.label}
		</button>
	{/each}
</div>
