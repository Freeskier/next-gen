<script lang="ts">
    import { getters, Tooltip as Builder, type TooltipProps } from "$lib/builders";
    import { type Snippet } from "svelte";
	import type { ComponentProps } from "../types";

    type Props = ComponentProps<TooltipProps> & {
		children: Snippet<[Builder]>;
	};

    let { open = $bindable(false), children, ...rest }: Props = $props();

    const tooltip = new Builder({
        open: () => open,
        onOpenChange: (v) => (open = v),
        ...getters(rest)
    });
</script>

{@render children(tooltip)}