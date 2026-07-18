<script lang="ts">
	import { Tooltip as TooltipPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
	type TooltipAlign = 'start' | 'center' | 'end';
	type TriggerProps = Record<string, unknown>;

	type Props = {
		align?: TooltipAlign;
		children: Snippet<[TriggerProps]>;
		disabled?: boolean;
		side?: TooltipSide;
		text: string;
	};

	let {
		align = 'center',
		children,
		disabled = false,
		side = 'top',
		text,
	}: Props = $props();
</script>

<TooltipPrimitive.Root {disabled}>
	<TooltipPrimitive.Trigger {disabled}>
		{#snippet child({ props })}
			{@render children(props)}
		{/snippet}
	</TooltipPrimitive.Trigger>
	<TooltipPrimitive.Portal>
		<TooltipPrimitive.Content
			{align}
			{side}
			sideOffset={7}
			class="z-50 rounded border border-[var(--vscode-panel-border)] bg-[var(--vscode-editorWidget-background)] px-2 py-1 text-[11px] leading-4 text-[var(--vscode-editor-foreground)] shadow-lg"
		>
			{text}
			<TooltipPrimitive.Arrow class="fill-[var(--vscode-editorWidget-background)]" />
		</TooltipPrimitive.Content>
	</TooltipPrimitive.Portal>
</TooltipPrimitive.Root>
