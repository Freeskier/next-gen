<script lang="ts">
	import { getters } from "$lib/utils/getters.svelte.js";
	import { type Snippet } from "svelte";
	import {
		ToggleGroup as Builder,
		type ToggleGroupProps,
	} from "../builders/ToggleGroup.svelte";
	import type { ComponentProps } from "../types";
	import { SvelteSet } from "svelte/reactivity";

	type Props = ComponentProps<ToggleGroupProps> & {
		children: Snippet<[Builder]>;
	};

	let { value = $bindable(new SvelteSet<string>()), children, ...rest }: Props = $props();

	export const group = new Builder({
		value: () => value,
		onValueChange: (v) => {
			value = v;
		},
		...getters(rest),
	});
</script>

{@render children(group)}
