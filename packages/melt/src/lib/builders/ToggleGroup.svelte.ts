import { Toggle } from "$lib/builders/Toggle.svelte";
import type { MaybeGetter } from "$lib/types";
import { createBuilderMetadata } from "$lib/utils/identifiers";

const metadata = createBuilderMetadata("radio-group", ["root", "item", "label", "hidden-input"]);

export type ToggleGroupProps = {
	/**
	 * If `true`, prevents the user from interacting with the group.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;
	/**
	 * If the the button selection should loop when navigating with the arrow keys.
	 *
	 * @default true
	 */
	loop?: MaybeGetter<boolean | undefined>;
	/**
	 * If `true`, the value will be changed whenever a button is focused.
	 *
	 * @default true
	 */
	selectWhenFocused?: MaybeGetter<boolean | undefined>;
	/**
	 * The orientation of the slider.
	 *
	 * @default "vertical"
	 */
	orientation?: MaybeGetter<"horizontal" | "vertical" | undefined>;
	/**
	 * Input name for radio group.
	 */
	name?: MaybeGetter<string | undefined>;
	/**
	 * Default value for toggle group.
	 *
	 * @default ""
	 */
	value?: MaybeGetter<string | undefined>;
	/**
	 * Called when the radio button is clicked.
	 */
	onValueChange?: (active: string) => void;
};

export class ToggleGroup {
	#ids = metadata.createIds();

	#props!: ToggleGroupProps;

	constructor(props: ToggleGroupProps) {
		this.#props = props;
	}
}

class ToggleGroupItem extends Toggle {
	#group: ToggleGroup;

	constructor(group: ToggleGroup) {
		super();
		
		this.#group = group;
	}

	override get value(): boolean {
		return true;
	}
	override set value(value: boolean) {}
}
