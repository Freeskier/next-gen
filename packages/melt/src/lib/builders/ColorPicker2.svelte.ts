import { Slider } from "./Slider.svelte";
import { Synced } from "$lib/Synced.svelte";
import type { MaybeGetter } from "$lib/types";
import type { ColorFormat, HSV } from "$lib/utils/color";
import { Popover, type PopoverProps } from "./Popover.svelte";
import Color, { type ColorInstance } from "color";

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
	#channelsRange = $derived.by(this.#getChannelsRange);

	#firstChannelSlider = new Slider({ min: 0, max: () => this.#channelsRange[0], value: this. });

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
	}

	get hue() {
		return {};
	}

	get colorPlane() {
		return {};
	}

	get firstChannel() {
		return {};
	}

	get secondChannel() {
		return {};
	}

	get thirdChannel() {
		return {};
	}

	get alphaChannel() {
		return {};
	}

	get color() {
		return this.#color.current.hex()
	}

	get format() {
		return {};
	}

	#getChannelsRange() {
		switch (this.#format.current) {
			case "hsl":
				return [360, 100, 100];
			case "hsv":
				return [360, 100, 100];
			case "hex":
				return [255, 255, 255];
			case "rgb":
				return [255, 255, 255];
		}
	}
}
