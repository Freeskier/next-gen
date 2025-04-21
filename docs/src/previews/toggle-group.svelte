<script lang="ts">
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import Preview from "@components/preview.svelte";
	import { getters } from "melt";
	import { ToggleGroup } from "melt/builders";
	import { SvelteSet } from "svelte/reactivity";
	import IconBold from "~icons/lucide/bold";
	import IconItalic from "~icons/lucide/italic";
	import IconUnderline from "~icons/lucide/underline";

	const controls = usePreviewControls({
		disabled: {
			type: "boolean",
			label: "Disabled",
			defaultValue: false,
		},
		loop: {
			type: "boolean",
			label: "Loop",
			defaultValue: true,
		},
		orientation: {
			type: "select",
			label: "Orientation",
			options: ["horizontal", "vertical"],
			defaultValue: "horizontal",
		},
	});

	let value = $state(new SvelteSet<string>(["bold"]));

	const group = new ToggleGroup({
		...getters(controls),
		value: () => value,
		onValueChange: (v) => {
			value = v;
		},
	});

	const items = [
		{ value: "bold", label: "Bold", icon: IconBold },
		{ value: "italic", label: "Italic", icon: IconItalic },
		{ value: "underline", label: "Underline", icon: IconUnderline },
	];

	const isHorizontal = $derived(group.orientation === "horizontal");
</script>

<Preview>
	<div
		{...group.root}
		class="flex w-fit rounded-xl border border-gray-300 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-900"
		class:flex-col={!isHorizontal}
	>
		{#each items as item}
			{@const itemProps = group.getItem(item.value)}
			<button
				{...itemProps.attrs}
				aria-label={item.label}
				class="focus-visible:ring-accent-300 grid size-9 place-items-center rounded-lg bg-transparent
					text-gray-600 outline-none transition-colors hover:bg-gray-100 hover:text-gray-800
					focus-visible:ring dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100
					data-[state=on]:bg-accent-500 data-[state=on]:text-white
					data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
			>
				<svelte:component this={item.icon} class="size-4" />
			</button>
		{/each}
	</div>
</Preview>
