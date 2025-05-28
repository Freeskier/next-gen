import { Slider } from "./Slider.svelte";
import { Synced } from "../Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { Popover, type PopoverProps } from "./Popover.svelte";
import Color, { type ColorInstance } from "color";
import { RadioGroup } from "./RadioGroup.svelte";
import { styleAttr } from "../utils/attribute";
import { createBuilderMetadata } from "../utils/identifiers";
import type { HTMLAttributes } from "svelte/elements";

type ColorFormat = "hsv" | "hsl" | "rgb" | "hex";

export interface HSV {
	h: number; // Hue: 0-360
	s: number; // Saturation: 0-100
	v: number; // Value: 0-100
	a: number; // Alpha: 0-1
}

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

	#firstChannelSlider: Slider;
	#secondChannelSlider: Slider;
	#thirdChannelSlider: Slider;
	#hueSlider: Slider;
	#alphaSlider: Slider;

	#formatRadio: RadioGroup;

	// Saturation-related fields
	#hsv: HSV = { h: 0, s: 0, v: 0, a: 1 };
	#draggingSaturation = false;
	#saturationPosition = { x: 0, y: 0 };

	declare ids: ReturnType<typeof createIds> & Popover["ids"];

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

		// Initialize HSV from initial color
		this.#updateHsvFromColor();

		// Initialize sliders after all other properties are set up
		this.#firstChannelSlider = new Slider({ min: 0, step: 0.1, ...this.#channelsData?.first });
		this.#secondChannelSlider = new Slider({ min: 0, step: 0.1, ...this.#channelsData?.second });
		this.#thirdChannelSlider = new Slider({ min: 0, step: 0.1, ...this.#channelsData?.third });

		// Initialize hue slider (0-360 degrees)
		this.#hueSlider = new Slider({
			min: 0,
			max: 360,
			step: 1,
			value: () => this.#hsv.h,
			onValueChange: (value: number) => {
				this.#hsv.h = value;
				this.#updateColorFromHsv();
			},
		});

		// Initialize alpha slider (0-100%)
		this.#alphaSlider = new Slider({
			min: 0,
			max: 100,
			step: 1,
			value: () => this.#hsv.a * 100,
			onValueChange: (value: number) => {
				this.#hsv.a = value / 100;
				this.#updateColorFromHsv();
			},
		});

		this.#formatRadio = new RadioGroup({
			value: () => this.#format.current,
			onValueChange: (format: string) => {
				console.log(format);
				this.#format.current = format as ColorFormat;
			},
		});

		// Set initial saturation position
		this.#updateSaturationPosition();

		// Update slider values with initial HSV values
		this.#hueSlider.value = this.#hsv.h;
		this.#alphaSlider.value = this.#hsv.a * 100;
	}

	get hue() {
		return this.#hueSlider;
	}

	get colorPlane() {
		return this.saturation;
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

	get colorWithoutAlpha() {
		return this.#color.current.alpha(1)[this.format]().toString();
	}

	get rgbValues() {
		const rgb = this.#color.current.rgb().object();
		return {
			r: Math.round(rgb.r || 0),
			g: Math.round(rgb.g || 0),
			b: Math.round(rgb.b || 0)
		};
	}

	get hsv(): HSV {
		return { ...this.#hsv };
	}

	set hsv(value: HSV) {
		this.#hsv = { ...value };
		this.#updateSaturationPosition();
		this.#updateColorFromHsv();
	}

	get saturationPosition() {
		return { ...this.#saturationPosition };
	}

	get saturation() {
		return {
			[dataAttrs.saturation]: "",
			id: this.ids.saturation,
			role: "application",
			"aria-label": "Color saturation and brightness selection area",
			style: styleAttr({
				background: `linear-gradient(to right, white, hsl(${this.#hsv.h}, 100%, 50%))`,
			}),
			onmousedown: (mouseEvent: MouseEvent) => {
				mouseEvent.preventDefault();
				this.#draggingSaturation = true;

				const rect = (mouseEvent.currentTarget as HTMLElement).getBoundingClientRect();
				let x = ((mouseEvent.clientX - rect.left) / rect.width) * 100;
				let y = ((mouseEvent.clientY - rect.top) / rect.height) * 100;

				x = Math.max(0, Math.min(100, x));
				y = Math.max(0, Math.min(100, y));

				this.#saturationPosition = { x, y };
				this.#hsv.s = x;
				this.#hsv.v = 100 - y;
				this.#updateColorFromHsv();

				const handleMouseMove = (moveEvent: MouseEvent) => {
					if (this.#draggingSaturation) {
						const rect = (mouseEvent.currentTarget as HTMLElement).getBoundingClientRect();
						let x = ((moveEvent.clientX - rect.left) / rect.width) * 100;
						let y = ((moveEvent.clientY - rect.top) / rect.height) * 100;

						x = Math.max(0, Math.min(100, x));
						y = Math.max(0, Math.min(100, y));

						this.#saturationPosition = { x, y };
						this.#hsv.s = x;
						this.#hsv.v = 100 - y;
						this.#updateColorFromHsv();
					}
				};

				const handleMouseUp = () => {
					this.#draggingSaturation = false;
					document.removeEventListener("mousemove", handleMouseMove);
					document.removeEventListener("mouseup", handleMouseUp);
				};

				document.addEventListener("mousemove", handleMouseMove);
				document.addEventListener("mouseup", handleMouseUp);
			},
		} as const satisfies HTMLAttributes<HTMLDivElement>;
	}

	get saturationCursor() {
		return {
			role: "presentation",
			"aria-hidden": true,
			style: styleAttr({
				left: `${this.#saturationPosition.x}%`,
				top: `${this.#saturationPosition.y}%`,
				"background-color": `hsla(${this.#hsv.h}, ${this.#hsv.s}%, ${this.#hsv.v}%, ${this.#hsv.a})`,
			}),
		} as const satisfies HTMLAttributes<HTMLDivElement>;
	}

	get saturationOverlay() {
		return {
			role: "presentation",
			"aria-hidden": true,
			style: styleAttr({
				background: "linear-gradient(to top, black, transparent)",
			}),
		} as const satisfies HTMLAttributes<HTMLDivElement>;
	}

	#updateHsvFromColor() {
		const color = this.#color.current;
		const hsv = color.hsv().object();
		this.#hsv = {
			h: hsv.h || 0,
			s: hsv.s || 0,
			v: hsv.v || 0,
			a: color.alpha(),
		};
	}

	#updateColorFromHsv() {
		const color = Color.hsv(this.#hsv.h, this.#hsv.s, this.#hsv.v).alpha(this.#hsv.a);
		this.#color.current = color;
		
		// Update channel sliders to reflect new color
		if (this.#channelsData) {
			this.#firstChannelSlider.value = this.#channelsData.first?.value || 0;
			this.#secondChannelSlider.value = this.#channelsData.second?.value || 0;
			this.#thirdChannelSlider.value = this.#channelsData.third?.value || 0;
		}
	}

	#updateSaturationPosition() {
		this.#saturationPosition = {
			x: this.#hsv.s,
			y: 100 - this.#hsv.v,
		};
	}

	#getChannelsData = () => {
		switch (this.format) {
			case "hex":
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