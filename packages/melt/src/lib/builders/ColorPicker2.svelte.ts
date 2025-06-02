import { Slider, type SliderProps } from "./Slider.svelte";
import { Synced } from "../Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { Popover, type PopoverProps } from "./Popover.svelte";
import Color, { type ColorInstance } from "color";
import { RadioGroup } from "./RadioGroup.svelte";
import { createBuilderMetadata } from "../utils/identifiers";
import type { HTMLAttributes } from "svelte/elements";
import { createAttachmentKey } from "svelte/attachments";
import { useEventListener } from "runed";
import { extract } from "../utils/extract";
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

type ChannelType =
	| "red"
	| "green"
	| "blue"
	| "hue"
	| "saturation-hsl"
	| "lightness"
	| "saturation-hsv"
	| "value"
	| "alpha";

type ChannelConfig = {
	type: ChannelType;
	min: number;
	max: number;
	value: number;
	onValueChange: (value: number) => void;
	generateGradient: (color: ColorInstance) => string;
};

export class ColorPicker extends Popover {
	#color: Synced<ColorInstance>;
	#format: Synced<ColorFormat>;
	#channelConfigs = $derived.by(() => this.#getChannelConfigs());

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
			min: () => this.#channelConfigs.first?.min ?? 0,
			max: () => this.#channelConfigs.first?.max ?? 255,
			value: () => this.#channelConfigs.first?.value ?? 0,
			onValueChange: (value: number) => this.#channelConfigs.first?.onValueChange?.(value),
			channel: () => this.#channelConfigs.first?.type ?? "red",
		});
		this.#secondChannelSlider = new ColorSlider({
			step: 1,
			currentColor: () => this.#color.current,
			min: () => this.#channelConfigs.second?.min ?? 0,
			max: () => this.#channelConfigs.second?.max ?? 255,
			value: () => this.#channelConfigs.second?.value ?? 0,
			onValueChange: (value: number) => this.#channelConfigs.second?.onValueChange?.(value),
			channel: () => this.#channelConfigs.second?.type ?? "green",
		});
		this.#thirdChannelSlider = new ColorSlider({
			step: 1,
			currentColor: () => this.#color.current,
			min: () => this.#channelConfigs.third?.min ?? 0,
			max: () => this.#channelConfigs.third?.max ?? 255,
			value: () => this.#channelConfigs.third?.value ?? 0,
			onValueChange: (value: number) => this.#channelConfigs.third?.onValueChange?.(value),
			channel: () => this.#channelConfigs.third?.type ?? "blue",
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
			channel: "hue",
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
			channel: "alpha",
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
				this.#format.current = format as ColorFormat;
			},
		});
	}

	#createGradientGenerator =
		(type: ChannelType) =>
		(color: ColorInstance): string => {
			switch (type) {
				case "red":
					return `linear-gradient(to right, ${color.red(0).hex()}, ${color.red(255).hex()})`;
				case "green":
					return `linear-gradient(to right, ${color.green(0).hex()}, ${color.green(255).hex()})`;
				case "blue":
					return `linear-gradient(to right, ${color.blue(0).hex()}, ${color.blue(255).hex()})`;
				case "hue":
					return `linear-gradient(to right, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))`;
				case "saturation-hsl": {
					const hue = color.hue();
					const lightness = color.lightness();
					return `linear-gradient(to right, hsl(${hue}, 0%, ${lightness}%), hsl(${hue}, 100%, ${lightness}%))`;
				}
				case "lightness": {
					const hue = color.hue();
					const saturation = color.saturationl();
					return `linear-gradient(to right, hsl(${hue}, ${saturation}%, 0%), hsl(${hue}, ${saturation}%, 100%))`;
				}
				case "saturation-hsv":
					return `linear-gradient(to right, ${color.saturationv(0).hex()}, ${color.saturationv(100).hex()})`;
				case "value":
					return `linear-gradient(to right, ${color.value(0).hex()}, ${color.value(100).hex()})`;
				case "alpha": {
					const { red: r, green: g, blue: b } = color.rgb().object();
					return `linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0), rgba(${r}, ${g}, ${b}, 1)), repeating-conic-gradient(#333 0% 25%, #666 0% 50%)`;
				}
				default:
					return "linear-gradient(to right, #ccc, #666)";
			}
		};

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

	#getChannelConfigs = (): {
		first: ChannelConfig;
		second: ChannelConfig;
		third: ChannelConfig;
	} => {
		const color = this.#color.current;

		switch (this.format) {
			case "hex":
			case "rgb":
				return {
					first: {
						type: "red",
						min: 0,
						max: 255,
						value: color.red(),
						onValueChange: (value: number) => (this.#color.current = color.red(value)),
						generateGradient: this.#createGradientGenerator("red"),
					},
					second: {
						type: "green",
						min: 0,
						max: 255,
						value: color.green(),
						onValueChange: (value: number) => (this.#color.current = color.green(value)),
						generateGradient: this.#createGradientGenerator("green"),
					},
					third: {
						type: "blue",
						min: 0,
						max: 255,
						value: color.blue(),
						onValueChange: (value: number) => (this.#color.current = color.blue(value)),
						generateGradient: this.#createGradientGenerator("blue"),
					},
				};
			case "hsl":
				return {
					first: {
						type: "hue",
						min: 0,
						max: 360,
						value: color.hue(),
						onValueChange: (value: number) => (this.#color.current = color.hue(value)),
						generateGradient: this.#createGradientGenerator("hue"),
					},
					second: {
						type: "saturation-hsl",
						min: 0,
						max: 100,
						value: color.saturationl(),
						onValueChange: (value: number) => (this.#color.current = color.saturationl(value)),
						generateGradient: this.#createGradientGenerator("saturation-hsl"),
					},
					third: {
						type: "lightness",
						min: 0,
						max: 100,
						value: color.lightness(),
						onValueChange: (value: number) => (this.#color.current = color.lightness(value)),
						generateGradient: this.#createGradientGenerator("lightness"),
					},
				};
			case "hsv":
				return {
					first: {
						type: "hue",
						min: 0,
						max: 360,
						value: color.hue(),
						onValueChange: (value: number) => (this.#color.current = color.hue(value)),
						generateGradient: this.#createGradientGenerator("hue"),
					},
					second: {
						type: "saturation-hsv",
						min: 0,
						max: 100,
						value: color.saturationv(),
						onValueChange: (value: number) => (this.#color.current = color.saturationv(value)),
						generateGradient: this.#createGradientGenerator("saturation-hsv"),
					},
					third: {
						type: "value",
						min: 0,
						max: 100,
						value: color.value(),
						onValueChange: (value: number) => (this.#color.current = color.value(value)),
						generateGradient: this.#createGradientGenerator("value"),
					},
				};
		}
	};
}

export type ColorSliderProps = SliderProps & {
	currentColor: MaybeGetter<ColorInstance>;
	channel?: MaybeGetter<ChannelType>;
};

export class ColorSlider extends Slider {
	#currentColor: MaybeGetter<ColorInstance>;
	#channel?: ColorSliderProps["channel"];

	constructor(props: ColorSliderProps) {
		super({
			...props,
			onValueChange: (n: number) => props.onValueChange?.(this.#roundNumber(n)),
		});

		this.#currentColor = props.currentColor;
		this.#channel = props.channel;
	}

	#roundNumber = (num: number, precision: number = 2) => parseFloat(num.toFixed(precision));

	override get root() {
		return {
			...super.root,
		};
	}

	get track() {
		const color = extract(this.#currentColor);
		const channel = extract(this.#channel);

		if (!color || !channel) {
			return { style: "background-image: linear-gradient(to right, #ccc, #666)" } as const;
		}

		const gradient = this.#generateGradientForChannel(color, channel);
		const backgroundSize = channel === "alpha" ? "100%, 10px 10px" : "100%";

		return {
			style: `background-image: ${gradient}; background-size: ${backgroundSize}`,
		} as const;
	}

	#generateGradientForChannel = (color: ColorInstance, channel: ChannelType): string => {
		switch (channel) {
			case "red":
				return `linear-gradient(to right, ${color.red(0).hex()}, ${color.red(255).hex()})`;
			case "green":
				return `linear-gradient(to right, ${color.green(0).hex()}, ${color.green(255).hex()})`;
			case "blue":
				return `linear-gradient(to right, ${color.blue(0).hex()}, ${color.blue(255).hex()})`;
			case "hue":
				return `linear-gradient(to right, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))`;
			case "saturation-hsl": {
				const hue = color.hue();
				const lightness = color.lightness();
				return `linear-gradient(to right, hsl(${hue}, 0%, ${lightness}%), hsl(${hue}, 100%, ${lightness}%))`;
			}
			case "lightness": {
				const hue = color.hue();
				const saturation = color.saturationl();
				return `linear-gradient(to right, hsl(${hue}, ${saturation}%, 0%), hsl(${hue}, ${saturation}%, 100%))`;
			}
			case "saturation-hsv":
				return `linear-gradient(to right, ${color.saturationv(0).hex()}, ${color.saturationv(100).hex()})`;
			case "value":
				return `linear-gradient(to right, ${color.value(0).hex()}, ${color.value(100).hex()})`;
			case "alpha": {
				const r = Math.round(color.red());
				const g = Math.round(color.green());
				const b = Math.round(color.blue());
				return `linear-gradient(to right, rgba(${r}, ${g}, ${b}, 0), rgba(${r}, ${g}, ${b}, 1)), repeating-conic-gradient(#333 0% 25%, #666 0% 50%)`;
			}
			default:
				return "linear-gradient(to right, #ccc, #666)";
		}
	};
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
	#keyboardStep = 1; // 1% step for keyboard navigation

	constructor(props: ColorBoxProps = {}) {
		this.#color = props.color ?? (() => Color("#000000"));
		this.#onColorChange = props.onColorChange;
	}

	get surface() {
		return {
			tabindex: 0,
			role: "slider",
			"aria-label": "2D color picker for saturation and lightness",
			"aria-valuemin": 0,
			"aria-valuemax": 100,
			"aria-valuenow": () => Math.round(this.#color().saturationl()),
			"aria-valuetext": () => {
				const saturation = Math.round(this.#color().saturationl());
				const lightness = Math.round(this.#color().lightness());
				return `Saturation ${saturation}%, Lightness ${lightness}%`;
			},
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
					},
				);

				useEventListener(
					() => node,
					"pointermove",
					(e) => {
						if (!this.#isDragging) return;
						this.#updateColorFromPointer(e);
					},
				);

				useEventListener(
					() => node,
					"pointerup",
					(e) => {
						this.#isDragging = false;
						node.releasePointerCapture(e.pointerId);
					},
				);

				useEventListener(
					() => node,
					"keydown",
					(e) => {
						const currentSaturation = this.#color().saturationl();
						const currentLightness = this.#color().lightness();
						let newSaturation = currentSaturation;
						let newLightness = currentLightness;

						switch (e.key) {
							case "ArrowRight":
								e.preventDefault();
								newSaturation = Math.min(100, currentSaturation + this.#keyboardStep);
								break;
							case "ArrowLeft":
								e.preventDefault();
								newSaturation = Math.max(0, currentSaturation - this.#keyboardStep);
								break;
							case "ArrowUp":
								e.preventDefault();
								newLightness = Math.min(100, currentLightness + this.#keyboardStep);
								break;
							case "ArrowDown":
								e.preventDefault();
								newLightness = Math.max(0, currentLightness - this.#keyboardStep);
								break;
							case "Home":
								e.preventDefault();
								newSaturation = 0;
								newLightness = 50;
								break;
							case "End":
								e.preventDefault();
								newSaturation = 100;
								newLightness = 50;
								break;
							case "PageUp":
								e.preventDefault();
								newLightness = Math.min(100, currentLightness + 10);
								break;
							case "PageDown":
								e.preventDefault();
								newLightness = Math.max(0, currentLightness - 10);
								break;
						}

						if (newSaturation !== currentSaturation || newLightness !== currentLightness) {
							this.#onColorChange?.(newSaturation, newLightness);
						}
					},
				);
			},
		} as const;
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
			"aria-hidden": "true",
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
		} as const;
	}
}
