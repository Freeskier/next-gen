import { Slider, type SliderProps } from "./Slider.svelte";
import { Synced } from "../Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { Popover, type PopoverProps } from "./Popover.svelte";
import Color, { type ColorInstance } from "color";
import { RadioGroup } from "./RadioGroup.svelte";
import { createBuilderMetadata } from "../utils/identifiers";
import type { HTMLAttributes } from "svelte/elements";
import { createAttachmentKey } from "svelte/attachments";
import { extract } from "../utils/extract";
import { useEventListener } from "runed";
type ColorFormat = "hsv" | "hsl" | "rgb" | "hex";

const { dataAttrs, createIds } = createBuilderMetadata("colorpicker", [
	"trigger",
	"content",
	"saturation",
	"hue",
	"alpha",
	"preview",
	"input",
	"format",
]);

export type ColorPickerProps = Omit<PopoverProps, "open"> & {
	/**
	 * The color value.
	 * When passing a getter, it will be used as source of truth.
	 * Otherwise, if passing a static value, it'll serve as the default value.
	 *
	 * @default "#000000"
	 */
	color?: MaybeGetter<string>;

	/**
	 * Called when the color value changes.
	 */
	onColorChange?: (color: ColorInstance) => void;

	/**
	 * The format used for the color input.
	 *
	 * @default "hex"
	 */
	format?: MaybeGetter<ColorFormat>;

	/**
	 * Called when the format changes.
	 */
	onFormatChange?: (format: ColorFormat) => void;
};

export class ColorPicker extends Popover {
	#color: Synced<ColorInstance>;
	#format: Synced<ColorFormat>;
	#channelsData = $derived.by(() => this.#getChannelsData());

	#firstChannelSlider: ColorSlider;
	#secondChannelSlider: ColorSlider;
	#thirdChannelSlider: ColorSlider;
	#hueSlider: ColorSlider;
	#alphaSlider: ColorSlider;

	#saturationBox: ColorBox;
	#formatRadio: RadioGroup;

	constructor(props: ColorPickerProps = {}) {
		super({
			...props,
			onOpenChange: (openState) => {
				props.onOpenChange?.(openState);
			},
		});
		this.#color = new Synced({
			value: Color(props.color),
			onChange: props.onColorChange,
			defaultValue: Color("#000000"),
		});

		this.#format = new Synced({
			value: props.format,
			onChange: props.onFormatChange,
			defaultValue: "hex",
		});

		this.#firstChannelSlider = new ColorSlider({
			step: 1,
			currentColor: () => this.#color.current,
			min: 0,
			max: () => this.#channelsData?.first?.max ?? 255,
			value: () => this.#channelsData?.first?.value ?? 0,
			onValueChange: (value: number) => this.#channelsData?.first?.onValueChange?.(value),
		});
		this.#secondChannelSlider = new ColorSlider({
			step: 1,
			currentColor: () => this.#color.current,
			min: 0,
			max: () => this.#channelsData?.second?.max ?? 255,
			value: () => this.#channelsData?.second?.value ?? 0,
			onValueChange: (value: number) => this.#channelsData?.second?.onValueChange?.(value),
		});
		this.#thirdChannelSlider = new ColorSlider({
			step: 1,
			currentColor: () => this.#color.current,
			min: 0,
			max: () => this.#channelsData?.third?.max ?? 255,
			value: () => this.#channelsData?.third?.value ?? 0,
			onValueChange: (value: number) => this.#channelsData?.third?.onValueChange?.(value),
		});

		this.#hueSlider = new ColorSlider({
			min: 0,
			max: 360,
			step: 1,
			currentColor: () => this.#color.current,
			value: () => this.#color.current.hue(),
			onValueChange: (value: number) => {
				this.#color.current = this.#color.current.hue(value);
			},
		});

		this.#alphaSlider = new ColorSlider({
			min: 0,
			max: 1,
			step: 0.001,
			currentColor: () => this.#color.current,
			value: () => this.#color.current.alpha(),
			onValueChange: (value: number) => {
				this.#color.current = this.#color.current.alpha(value);
			},
		});

		this.#saturationBox = new ColorBox({
			color: () => this.#color.current,
			onColorChange: (saturation: number, lightness: number) => {
				this.#color.current = this.#color.current.saturationl(saturation).lightness(lightness);
			},
		});

		this.#formatRadio = new RadioGroup({
			value: () => this.#format.current,
			onValueChange: (format: string) => {
				console.log('Format changing to:', format);
				this.#format.current = format as ColorFormat;
				console.log('Format changed, new channels data:', this.#channelsData);
			},
		});
	}

	get hue() {
		return this.#hueSlider;
	}

	get saturationBox() {
		return this.#saturationBox;
	}

	get firstChannel() {
		return this.#firstChannelSlider;
	}

	get secondChannel() {
		return this.#secondChannelSlider;
	}

	get thirdChannel() {
		return this.#thirdChannelSlider;
	}

	get alphaChannel() {
		return this.#alphaSlider;
	}

	get formatRadioGroup() {
		return this.#formatRadio;
	}

	get color() {
		return this.#color.current[this.format]().toString();
	}

	get format() {
		return this.#format.current;
	}

	#getChannelsData = () => {
		console.log('Getting channels data for format:', this.format);
		switch (this.format) {
			case "hex":
			case "rgb":
				return {
					first: {
						max: 255,
						value: this.#color.current.red(),
						onValueChange: (value: number) =>
							(this.#color.current = this.#color.current.red(value)),
					},
					second: {
						max: 255,
						value: this.#color.current.green(),
						onValueChange: (value: number) =>
							(this.#color.current = this.#color.current.green(value)),
					},
					third: {
						max: 255,
						value: this.#color.current.blue(),
						onValueChange: (value: number) =>
							(this.#color.current = this.#color.current.blue(value)),
					},
				};
			case "hsl":
				return {
					first: {
						max: 360,
						value: this.#color.current.hue(),
						onValueChange: (value: number) => {
							this.#color.current = this.#color.current.hue(value);
						},
					},
					second: {
						max: 100,
						value: this.#color.current.saturationl(),
						onValueChange: (value: number) =>
							(this.#color.current = this.#color.current.saturationl(value)),
					},
					third: {
						max: 100,
						value: this.#color.current.lightness(),
						onValueChange: (value: number) =>
							(this.#color.current = this.#color.current.lightness(value)),
					},
				};
			case "hsv":
				return {
					first: {
						max: 360,
						value: this.#color.current.hue(),
						onValueChange: (value: number) =>
							(this.#color.current = this.#color.current.hue(value)),
					},
					second: {
						max: 100,
						value: this.#color.current.saturationv(),
						onValueChange: (value: number) =>
							(this.#color.current = this.#color.current.saturationv(value)),
					},
					third: {
						max: 100,
						value: this.#color.current.value(),
						onValueChange: (value: number) =>
							(this.#color.current = this.#color.current.value(value)),
					},
				};
		}
	};
}

export type ColorSliderProps = SliderProps & {
	currentColor: MaybeGetter<ColorInstance>;
};

export class ColorSlider extends Slider {
	#currentColor: MaybeGetter<ColorInstance>;

	constructor(props: ColorSliderProps) {
		super({
			...props,
			onValueChange: (n: number) => props.onValueChange?.(this.#roundNumber(n)),
		});
		
		this.#currentColor = props.currentColor;


	}

	#roundNumber = (num: number, precision: number = 2) => parseFloat(num.toFixed(precision));

	override get root() {
		return {
			...super.root,
		};
	}

	get track() {
		return {
			style: `background-image: linear-gradient(to right, red, blue)`,
		} as const;
	}
}

export type ColorBoxProps = {
	color?: () => ColorInstance;
	onColorChange?: (saturation: number, lightness: number) => void;
};

export class ColorBox {
	#color: () => ColorInstance;
	#onColorChange?: (saturation: number, lightness: number) => void;
	#isDragging = $state(false);
	#surfaceElement: HTMLElement | null = null;

	constructor(props: ColorBoxProps = {}) {
		this.#color = props.color ?? (() => Color("#000000"));
		this.#onColorChange = props.onColorChange;
	}

	get surface() {
		return {
			[createAttachmentKey()]: (node: HTMLElement) => {
				this.#surfaceElement = node;
				
				$effect(() => {
					const hue = this.#color().hue();
					node.style.setProperty(
						"background-image",
						`
              linear-gradient(to top, black, transparent),
              linear-gradient(to right, white, transparent),
              linear-gradient(to right, hsl(${hue}, 100%, 50%), hsl(${hue}, 100%, 50%))
            `,
					);
				});

				useEventListener(
					() => node,
					"pointerdown",
					(e) => {
						e.preventDefault();
						this.#isDragging = true;
						node.setPointerCapture(e.pointerId);
						this.#updateColorFromPointer(e);
					}
				);

				useEventListener(
					() => node,
					"pointermove",
					(e) => {
						if (!this.#isDragging) return;
						this.#updateColorFromPointer(e);
					}
				);

				useEventListener(
					() => node,
					"pointerup",
					(e) => {
						this.#isDragging = false;
						node.releasePointerCapture(e.pointerId);
					}
				);
			},
		};
	}

	#updateColorFromPointer = (e: PointerEvent) => {
		if (!this.#surfaceElement) return;
		
		const rect = this.#surfaceElement.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		
		// Clamp values to surface bounds
		const saturation = Math.max(0, Math.min(100, (x / rect.width) * 100));
		const lightness = Math.max(0, Math.min(100, 100 - (y / rect.height) * 100));
		
		this.#onColorChange?.(saturation, lightness);
	};
	
	get handle() {
		return {
			[createAttachmentKey()]: (node: HTMLElement) => {
				$effect(() => {
					if (!this.#surfaceElement) return;
					
					const surfaceRect = this.#surfaceElement.getBoundingClientRect();
					const saturation = this.#color().saturationl();
					const lightness = this.#color().lightness();
					
					// Position handle based on current saturation and lightness
					const x = (saturation / 100) * surfaceRect.width;
					const y = ((100 - lightness) / 100) * surfaceRect.height;
					
					node.style.position = "absolute";
					node.style.left = `${x}px`;
					node.style.top = `${y}px`;
					node.style.transform = "translate(-50%, -50%)";
					node.style.pointerEvents = "none";
				});
			},
		};
	}
}
