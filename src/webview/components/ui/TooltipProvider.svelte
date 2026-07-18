<script lang="ts">
	import { Tooltip as TooltipPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Props = {
		children: Snippet;
	};

	let { children }: Props = $props();
</script>

<TooltipPrimitive.Provider delayDuration={250} disableHoverableContent>
	{@render children()}
</TooltipPrimitive.Provider>
