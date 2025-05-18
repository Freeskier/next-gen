import type { MaybeGetter } from "../types";
import { Synced } from "../Synced.svelte";
import { dataAttr, styleAttr } from "../utils/attribute";
import { extract } from "../utils/extract";
import { createBuilderMetadata } from "../utils/identifiers";
import type { HTMLAttributes } from "svelte/elements";
import { tick } from "svelte";
import { Popover, type PopoverProps } from "./Popover.svelte";
import { Slider } from "./Slider.svelte";

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

export type ColorFormat = "hex" | "rgb" | "hsl";

export interface HSV {
	h: number; // Hue: 0-360
	s: number; // Saturation: 0-100
	v: number; // Value: 0-100
	a: number; // Alpha: 0-1
}

export interface RGB {
	r: number; // Red: 0-255
	g: number; // Green: 0-255
	b: number; // Blue: 0-255
	a: number; // Alpha: 0-1
}

export interface HSL {
	h: number; // Hue: 0-360
	s: number; // Saturation: 0-100
	l: number; // Lightness: 0-100
	a: number; // Alpha: 0-1
}

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
	onColorChange?: (color: string) => void;

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

	/**
	 * Whether to show the alpha slider.
	 *
	 * @default true
	 */
	showAlpha?: MaybeGetter<boolean>;

	/**
	 * Whether to show the input field.
	 *
	 * @default true
	 */
	showInput?: MaybeGetter<boolean>;

	/**
	 * Whether to show the format switcher.
	 *
	 * @default true
	 */
	showFormatToggle?: MaybeGetter<boolean>;
};

export class ColorPicker extends Popover {
	#props!: ColorPickerProps;
	#color: Synced<string>;
	#format: Synced<ColorFormat>;
	#hsv: HSV = { h: 0, s: 0, v: 0, a: 1 };

	get hsv(): HSV {
		return { ...this.#hsv };
	}

	set hsv(value: HSV) {
		this.#hsv = { ...value };
		this.updateSaturationPosition();
		this.updateColor();
	}
	#draggingSaturation = false;
	#saturationPosition = { x: 0, y: 0 };

	declare ids: ReturnType<typeof createIds> & Popover["ids"];

	showAlpha = $derived(extract(this.#props.showAlpha, true));
	showInput = $derived(extract(this.#props.showInput, true));
	showFormatToggle = $derived(extract(this.#props.showFormatToggle, true));

	// This method would be used in a full implementation
	// to determine if alpha channel should be shown in color strings
	hasAlpha(): boolean {
		return this.showAlpha && this.#hsv.a < 1;
	}

	updateSaturationPosition() {
		this.#saturationPosition = {
			x: this.#hsv.s,
			y: 100 - this.#hsv.v,
		};
	}

	get saturationPosition() {
		return { ...this.#saturationPosition };
	}

	get hue() {
		return {
			[dataAttrs.hue]: "",
			id: this.ids.hue,
			slider: this.#hueSlider,
			root: this.#hueSlider.root,
			thumb: this.#hueSlider.thumb,
		};
	}

	// Default HSV value

	get alpha() {
		if (!this.showAlpha) return null;

		return {
			[dataAttrs.alpha]: "",
			id: this.ids.alpha,
			slider: this.#alphaSlider,
			root: this.#alphaSlider.root,
			thumb: this.#alphaSlider.thumb,
			style: styleAttr({
				"--color-a": `hsla(${this.#hsv.h}, ${this.#hsv.s}%, ${this.#hsv.v}%, 1)`,
				"--color-b": `hsla(${this.#hsv.h}, ${this.#hsv.s}%, ${this.#hsv.v}%, 0)`,
			}),
		};
	}

	get color(): string {
		return this.#color.current;
	}

	set color(value: string) {
		this.#color.current = value;
		// Simple conversion from hex to HSV for demonstration
		if (value.startsWith("#") && value.length >= 7) {
			try {
				const r = parseInt(value.slice(1, 3), 16) / 255;
				const g = parseInt(value.slice(3, 5), 16) / 255;
				const b = parseInt(value.slice(5, 7), 16) / 255;

				const max = Math.max(r, g, b);
				const min = Math.min(r, g, b);
				const d = max - min;

				let h = 0;
				if (d !== 0) {
					if (max === r) {
						h = ((g - b) / d) % 6;
					} else if (max === g) {
						h = (b - r) / d + 2;
					} else {
						h = (r - g) / d + 4;
					}
					h = Math.round(h * 60);
					if (h < 0) h += 360;
				}

				const s = max === 0 ? 0 : (d / max) * 100;
				const v = max * 100;

				this.#hsv = { h, s, v, a: this.#hsv.a };
				this.updateSaturationPosition();
			} catch (_e) {
				// Ignore invalid values
			}
		}
	}

	get format(): ColorFormat {
		return this.#format.current;
	}

	set format(value: ColorFormat) {
		this.#format.current = value;
		// In a full implementation, we would reformat the color string
		// based on the new format
	}

	// Method to update the color HSV based on format and input
	updateColor(): void {
		// Simple implementation of HSV to hex conversion
		const h = this.#hsv.h;
		const s = this.#hsv.s / 100;
		const v = this.#hsv.v / 100;

		const c = v * s;
		const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
		const m = v - c;

		let r = 0,
			g = 0,
			b = 0;

		if (h >= 0 && h < 60) {
			r = c;
			g = x;
			b = 0;
		} else if (h >= 60 && h < 120) {
			r = x;
			g = c;
			b = 0;
		} else if (h >= 120 && h < 180) {
			r = 0;
			g = c;
			b = x;
		} else if (h >= 180 && h < 240) {
			r = 0;
			g = x;
			b = c;
		} else if (h >= 240 && h < 300) {
			r = x;
			g = 0;
			b = c;
		} else {
			r = c;
			g = 0;
			b = x;
		}

		const rHex = Math.round((r + m) * 255)
			.toString(16)
			.padStart(2, "0");
		const gHex = Math.round((g + m) * 255)
			.toString(16)
			.padStart(2, "0");
		const bHex = Math.round((b + m) * 255)
			.toString(16)
			.padStart(2, "0");

		const hex = `#${rHex}${gHex}${bHex}`;
		this.#color.current = hex;
	}

	get trigger() {
		return Object.assign(super.trigger, {
			[dataAttrs.trigger]: "",
			style: styleAttr({
				"--color": this.color,
				"background-color": this.color,
			}),
		});
	}

	get content() {
		return Object.assign(super.content, {
			[dataAttrs.content]: "",
		});
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
				this.updateColor();

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
						this.updateColor();
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

	#hueSlider: Slider;
	#alphaSlider: Slider;

	constructor(props: ColorPickerProps = {}) {
		super({
			...props,
			onOpenChange: (openState) => {
				props.onOpenChange?.(openState);
				if (openState) {
					// Set initial position in saturation area when opening
					tick().then(() => {
						this.updateSaturationPosition();
					});
				}
			},
		});

		this.#props = props;
		this.#color = new Synced({
			value: props.color,
			onChange: props.onColorChange,
			defaultValue: "#000000",
		});

		this.#format = new Synced({
			value: props.format,
			onChange: props.onFormatChange,
			defaultValue: "hex",
		});

		const oldIds = this.ids;
		const newIds = createIds();
		this.ids = {
			...oldIds,
			trigger: oldIds.trigger,
			content: oldIds.content,
			saturation: newIds.saturation,
			hue: newIds.hue,
			alpha: newIds.alpha,
			preview: newIds.preview,
			input: newIds.input,
			format: newIds.format,
		};

		// Initialize sliders
		this.#hueSlider = new Slider({
			min: 0,
			max: 360,
			step: 1,
			value: 0,
			onValueChange: (value) => {
				this.#hsv.h = value;
				this.updateColor();
			},
		});

		// Initialize from color if provided
		if (props.color) {
			try {
				// Parse the initial color to HSV
				const initialColor = typeof props.color === "function" ? props.color() : props.color;
				if (initialColor && initialColor.startsWith("#") && initialColor.length >= 7) {
					const r = parseInt(initialColor.slice(1, 3), 16) / 255;
					const g = parseInt(initialColor.slice(3, 5), 16) / 255;
					const b = parseInt(initialColor.slice(5, 7), 16) / 255;

					const max = Math.max(r, g, b);
					const min = Math.min(r, g, b);
					const d = max - min;

					let h = 0;
					if (d !== 0) {
						if (max === r) {
							h = ((g - b) / d) % 6;
						} else if (max === g) {
							h = (b - r) / d + 2;
						} else {
							h = (r - g) / d + 4;
						}
						h = Math.round(h * 60);
						if (h < 0) h += 360;
					}

					const s = max === 0 ? 0 : (d / max) * 100;
					const v = max * 100;

					this.#hsv = { h, s, v, a: 1 };
				} else {
					this.#hsv = { h: 210, s: 100, v: 100, a: 1 };
				}
			} catch (_err) {
				// Fallback to default HSV
				this.#hsv = { h: 210, s: 100, v: 100, a: 1 };
			}
		} else {
			// Default HSV if no color provided
			this.#hsv = { h: 210, s: 100, v: 100, a: 1 };
		}

		// Initialize alpha slider
		this.#alphaSlider = new Slider({
			min: 0,
			max: 100,
			step: 1,
			value: this.#hsv.a * 100,
			onValueChange: (value) => {
				this.#hsv.a = value / 100;
				this.updateColor();
			},
		});

		// Update slider values with initial hsv values
		this.#hueSlider.value = this.#hsv.h;

		// Set initial saturation position
		this.#saturationPosition = {
			x: this.#hsv.s,
			y: 100 - this.#hsv.v,
		};
	}

	get preview() {
		return {
			[dataAttrs.preview]: "",
			id: this.ids.preview,
			style: styleAttr({
				"background-color": this.color,
			}),
		} as const satisfies HTMLAttributes<HTMLDivElement>;
	}

	get input() {
		if (!this.showInput) return null;

		return {
			[dataAttrs.input]: "",
			id: this.ids.input,
			oninput: (inputEvent: Event) => {
				const input = inputEvent.currentTarget as HTMLInputElement;
				const value = input.value;

				// Accept color if it looks like a valid hex code
				if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
					this.color = value;
				}
			},
		} as const;
	}

	getFormatButton(format: ColorFormat) {
		return {
			[dataAttrs.format]: format,
			"data-active": dataAttr(this.format === format),
			role: "radio",
			"aria-checked": this.format === format,
			onclick: () => {
				this.format = format;
				// Force a color update to match the new format
				this.updateColor();
			},
		} as const satisfies HTMLAttributes<HTMLButtonElement>;
	}
}
