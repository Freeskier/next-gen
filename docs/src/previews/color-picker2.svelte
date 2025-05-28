<script lang="ts">
	import Preview from "@components/preview.svelte";
	import { ColorPicker } from "../../../packages/melt/src/lib/builders/ColorPicker2.svelte";

	const picker = new ColorPicker({ format: "hsl" });
</script>

<Preview>
	<button {...picker.trigger}>click</button>
	{#if picker.arrow}
		<div {...picker.arrow} class="size-2 rounded-tl"></div>
	{/if}
	<div {...picker.content} class="flex flex-col items-center justify-center gap-4">
		<h1 style={`color: ${picker.color}`}>ASD QWE</h1>
		<pre>{picker.color} {picker.format}</pre>
		<div
			class="max-w-[90%]' group relative mx-auto w-[350px] p-3 outline-none"
			{...picker.firstChannel.root}
		>
			<div class="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gray-500">
				<div
					class="bg-accent-300 absolute inset-0 right-[var(--percentage-inv)] rounded-full transition-all group-data-[dragging]:transition-none"
				></div>
			</div>
			<div
				class="focus-visible:ring-accent-300 border-accent-300 absolute left-[var(--percentage)] top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-md
					border-2 bg-white outline-none
					transition-all focus-visible:ring focus-visible:ring-offset-black data-[dragging]:transition-none dark:border-none dark:focus-visible:ring-offset-2"
				{...picker.firstChannel.thumb}
			></div>
		</div>

		<div
			class="max-w-[90%]' group relative mx-auto w-[350px] p-3 outline-none"
			{...picker.secondChannel.root}
		>
			<div class="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gray-500">
				<div
					class="bg-accent-300 absolute inset-0 right-[var(--percentage-inv)] rounded-full transition-all group-data-[dragging]:transition-none"
				></div>
			</div>
			<div
				class="focus-visible:ring-accent-300 border-accent-300 absolute left-[var(--percentage)] top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-md
					border-2 bg-white outline-none
					transition-all focus-visible:ring focus-visible:ring-offset-black data-[dragging]:transition-none dark:border-none dark:focus-visible:ring-offset-2"
				{...picker.secondChannel.thumb}
			></div>
		</div>

		<div
			class="max-w-[90%]' group relative mx-auto w-[350px] p-3 outline-none"
			{...picker.thirdChannel.root}
		>
			<div class="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gray-500">
				<div
					class="bg-accent-300 absolute inset-0 right-[var(--percentage-inv)] rounded-full transition-all group-data-[dragging]:transition-none"
				></div>
			</div>
			<div
				class="focus-visible:ring-accent-300 border-accent-300 absolute left-[var(--percentage)] top-1/2 size-6 -translate-x-1/2 -translate-y-1/2 rounded-md
					border-2 bg-white outline-none
					transition-all focus-visible:ring focus-visible:ring-offset-black data-[dragging]:transition-none dark:border-none dark:focus-visible:ring-offset-2"
				{...picker.thirdChannel.thumb}
			></div>
		</div>

		<div class="mx-auto flex w-fit flex-col gap-2" {...picker.formatRadioGroup.root}>
			<div class="flex flex-row gap-3">
				{#each ["hsv", "hsl", "rgb", "hex"] as i}
					{@const item = picker.formatRadioGroup.getItem(i)}
					<div
						class="ring-accent-500 -ml-1 flex items-center gap-3 rounded p-1 outline-none focus-visible:ring
					data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
						{...item.attrs}
					>
						<div
							class={[
								"grid h-6 w-6 place-items-center rounded-full border shadow-sm",
								"hover:bg-gray-100 data-[disabled=true]:bg-gray-400",
								item.checked
									? "bg-accent-500 border-accent-500 dark:bg-white"
									: "border-neutral-400 bg-neutral-100",
								"dark:border-white",
							]}
						>
							{#if item.checked}
								<div
									class={["h-3 w-3 rounded-full", item.checked && "dark:bg-accent-500 bg-white"]}
									aria-hidden="true"
								></div>
							{/if}
						</div>

						<span class="font-semibold capitalize leading-none text-gray-600 dark:text-gray-100">
							{i}
						</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</Preview>

<style>
</style>
