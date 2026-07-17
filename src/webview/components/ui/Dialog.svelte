<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
		description?: string;
		footer?: Snippet;
		open?: boolean;
		title: string;
	};

	let {
		children,
		description,
		footer,
		open = $bindable(false),
		title,
	}: Props = $props();
</script>

{#if open}
	<DialogPrimitive.Root bind:open>
		<DialogPrimitive.Portal>
			<DialogPrimitive.Overlay class="fixed inset-0 z-10 bg-black/40" />
			<DialogPrimitive.Content
				class="fixed left-1/2 top-1/2 z-20 w-[min(32rem,calc(100vw-2.5rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg border border-[var(--vscode-panel-border)] bg-[var(--vscode-editorWidget-background)] shadow-2xl outline-none"
			>
				<header class="flex items-start justify-between border-b border-[var(--vscode-panel-border)] px-5 py-4">
					<div>
						<DialogPrimitive.Title class="text-sm font-semibold">{title}</DialogPrimitive.Title>
						{#if description}
							<DialogPrimitive.Description
								class="mt-1 font-mono text-[10px] text-[var(--vscode-descriptionForeground)]"
							>
								{description}
							</DialogPrimitive.Description>
						{/if}
					</div>
					<DialogPrimitive.Close
						class="grid size-7 place-items-center rounded text-lg leading-none text-[var(--vscode-descriptionForeground)] outline-none hover:bg-[var(--vscode-toolbar-hoverBackground)] hover:text-[var(--vscode-editor-foreground)] focus-visible:ring-1 focus-visible:ring-[var(--vscode-focusBorder)]"
						aria-label="Close dialog"
						type="button"
					>
						×
					</DialogPrimitive.Close>
				</header>
				<div class="p-5">
					{@render children()}
				</div>
				{#if footer}
					<footer class="border-t border-[var(--vscode-panel-border)] px-5 py-4">
						{@render footer()}
					</footer>
				{/if}
			</DialogPrimitive.Content>
		</DialogPrimitive.Portal>
	</DialogPrimitive.Root>
{/if}
