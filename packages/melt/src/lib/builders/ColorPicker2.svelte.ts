import { Slider } from "./Slider.svelte";
import { Synced } from "../Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import { Popover, type PopoverProps } from "./Popover.svelte";
import Color, { type ColorInstance } from "color";
import { RadioGroup } from "./RadioGroup.svelte";

type ColorFormat = "hsv" | "hsl" | "rgb" | "hex";

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
	#props: ColorPickerProps;
	#color: Synced<ColorInstance>;
	#format: Synced<ColorFormat>;
	#channelsData = $derived.by(() => this.#getChannelsData());

	#firstChannelSlider: Slider;
	#secondChannelSlider: Slider;
	#thirdChannelSlider: Slider;

	#formatRadio: RadioGroup;

	constructor(props: ColorPickerProps = {}) {
		super({
			...props,
			onOpenChange: (openState) => {
				props.onOpenChange?.(openState);
			},
		});
		this.#props = props;
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

		// Initialize sliders after all other properties are set up
		this.#firstChannelSlider = new Slider({ min: 0, step: 0.1, ...this.#channelsData?.first });
		this.#secondChannelSlider = new Slider({ min: 0, step: 0.1, ...this.#channelsData?.second });
		this.#thirdChannelSlider = new Slider({ min: 0, step: 0.1, ...this.#channelsData?.third });

		this.#formatRadio = new RadioGroup({
			value: () => this.#format.current,
			onValueChange: (format: string) => {
				console.log(format);
				this.#format.current = format as ColorFormat;
			},
		});
	}

	get hue() {
		return {};
	}

	get colorPlane() {
		return {};
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
		return {};
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
		switch (this.format) {
			case "hex":
				return {
					first: {
						max: 255,
						value: this.#color.current.red(),
						onValueChange: (value: number) =>
							(this.#color.current = this.#color.current = this.#color.current.red(value)),
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
