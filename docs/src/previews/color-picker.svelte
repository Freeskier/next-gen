<script lang="ts">
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import Preview from "@components/preview.svelte";
	import { getters } from "melt";
	import { ColorPicker } from "../../../packages/melt/src/lib/builders/ColorPicker.svelte";
	import { onMount } from "svelte";

	const controls = usePreviewControls({
		showAlpha: {
			type: "boolean",
			defaultValue: true,
			label: "Show Alpha Slider",
		},
		showInput: {
			type: "boolean",
			defaultValue: true,
			label: "Show Input Field",
		},
		showFormatToggle: {
			type: "boolean",
			defaultValue: true,
			label: "Show Format Toggle",
		},
		initialFormat: {
			type: "select",
			options: ["hex", "rgb", "hsl"],
			defaultValue: "hex",
			label: "Initial Format",
		},
	});

	const colorPicker = new ColorPicker({
		color: "#4285F4",
		format: controls.initialFormat,
		...getters(controls),
	});

	let currentColor = colorPicker.color;
	let mounted = false;

	onMount(() => {
		mounted = true;
		// Force initial update
		colorPicker.updateColor?.();
		colorPicker.updateSaturationPosition?.();
	});

	function updateColor() {
		if (mounted) {
			currentColor = colorPicker.color;
			// Force component to update its internal state
			colorPicker.updateColor?.();
		}
	}

	$: if (mounted) setTimeout(updateColor, 0);
</script>

<Preview>
	<div class="flex flex-col items-center gap-4 p-4">
		<div class="flex items-center gap-4">
			<button
				{...colorPicker.trigger}
				class="h-12 w-12 cursor-pointer rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
				aria-label="Open color picker"
			></button>
			<div class="text-sm">
				Current color: <span style="color: {currentColor}; font-weight: bold;">{currentColor}</span>
			</div>
		</div>

		<div
			{...colorPicker.content}
			class="flex w-64 flex-col rounded-lg border border-gray-300 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800"
		>
			<!-- Saturation and Brightness Area -->
			<div
				{...colorPicker.saturation}
				class="relative mb-3 h-40 cursor-crosshair touch-none rounded"
			>
				<div
					{...colorPicker.saturationOverlay}
					class="absolute inset-0 rounded pointer-events-none"
				></div>
				<div
					{...colorPicker.saturationCursor}
					class="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
				></div>
			</div>

			<!-- Hue Slider -->
			<div class="mb-3">
				<div
					{...colorPicker.hue.root}
					class="relative h-6 cursor-pointer rounded"
					style="background: linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00);"
				>
					<div
						class="absolute top-0 h-full w-1.5 -translate-x-1/2 rounded border border-gray-300 bg-white shadow-sm"
						style="left: var(--percentage); pointer-events: none;"
						{...colorPicker.hue.thumb}
					></div>
				</div>
			</div>

			<!-- Alpha Slider -->
			{#if colorPicker.showAlpha && colorPicker.alpha}
				<div class="mb-3">
					<div
						{...colorPicker.alpha.root}
						class="bg-checkerboard relative h-6 cursor-pointer rounded"
						style="background-image: linear-gradient(to right, var(--color-b), var(--color-a));"
					>
						<div
							class="absolute top-0 h-full w-1.5 -translate-x-1/2 rounded border border-gray-300 bg-white shadow-sm"
							style="left: var(--percentage); pointer-events: none;"
							{...colorPicker.alpha.thumb}
						></div>
					</div>
				</div>
			{/if}

			<!-- Color Preview -->
			<div class="mb-3 mt-1 flex items-center gap-3">
				<div
					class="bg-checkerboard h-10 w-10 rounded-md border border-gray-300"
					style={`background-color: ${colorPicker.color}`}
					id={colorPicker.preview.id}
					data-melt-colorpicker-preview=""
				></div>

				<!-- Input and Format Toggle -->
				<div class="flex-1">
					{#if colorPicker.showInput}
						<input
							id={colorPicker.input?.id}
							type="text"
							value={colorPicker.color}
							class="w-full rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
							data-melt-colorpicker-input=""
							on:input={(e) => {
								const value = e.currentTarget.value;
								// Simply update the color if it looks like a valid color value
								if (value.startsWith('#')) {
									colorPicker.color = value;
								}
							}}
						/>
					{/if}
				</div>
			</div>

			<!-- Format Toggle -->
			{#if colorPicker.showFormatToggle}
				<div class="mt-2 flex gap-1">
					<button
						class="flex-1 rounded-sm border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
						class:bg-blue-100={colorPicker.format === "hex"}
						class:dark:bg-blue-900={colorPicker.format === "hex"}
						role="radio"
						aria-checked={colorPicker.format === "hex"}
						data-melt-colorpicker-format="hex"
						data-active={colorPicker.format === "hex" ? "" : undefined}
						on:click={() => {
							colorPicker.format = "hex";
							colorPicker.updateColor?.();
						}}
					>
						HEX
					</button>
					<button
						class="flex-1 rounded-sm border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
						class:bg-blue-100={colorPicker.format === "rgb"}
						class:dark:bg-blue-900={colorPicker.format === "rgb"}
						role="radio"
						aria-checked={colorPicker.format === "rgb"}
						data-melt-colorpicker-format="rgb"
						data-active={colorPicker.format === "rgb" ? "" : undefined}
						on:click={() => {
							colorPicker.format = "rgb";
							colorPicker.updateColor?.();
						}}
					>
						RGB
					</button>
					<button
						class="flex-1 rounded-sm border border-gray-300 px-2 py-1 text-xs hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
						class:bg-blue-100={colorPicker.format === "hsl"}
						class:dark:bg-blue-900={colorPicker.format === "hsl"}
						role="radio"
						aria-checked={colorPicker.format === "hsl"}
						data-melt-colorpicker-format="hsl"
						data-active={colorPicker.format === "hsl" ? "" : undefined}
						on:click={() => {
							colorPicker.format = "hsl";
							colorPicker.updateColor?.();
						}}
					>
						HSL
					</button>
				</div>
			{/if}
		</div>
	</div>
</Preview>

<style>
	/* Checkerboard pattern for transparent backgrounds */
	.bg-checkerboard {
		background-image: linear-gradient(45deg, #ddd 25%, transparent 25%),
			linear-gradient(-45deg, #ddd 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, #ddd 75%),
			linear-gradient(-45deg, transparent 75%, #ddd 75%);
		background-size: 10px 10px;
		background-position:
			0 0,
			0 5px,
			5px -5px,
			-5px 0;
	}

	:global(.dark) .bg-checkerboard {
		background-image: linear-gradient(45deg, #444 25%, transparent 25%),
			linear-gradient(-45deg, #444 25%, transparent 25%),
			linear-gradient(45deg, transparent 75%, #444 75%),
			linear-gradient(-45deg, transparent 75%, #444 75%);
	}

	[data-melt-colorpicker-content] {
		position: absolute;
		pointer-events: none;
		opacity: 0;
		transform: scale(0.95);
		transition: 0.2s;
		transition-property: opacity, transform;
		transform-origin: var(--melt-popover-content-transform-origin, top);
	}

	[data-melt-colorpicker-content][data-open] {
		pointer-events: auto;
		opacity: 1;
		transform: scale(1);
	}
</style>
