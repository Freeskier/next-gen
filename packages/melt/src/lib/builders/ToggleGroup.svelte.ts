import type { IterableProp, MaybeGetter } from "$lib/types";
import { SelectionState } from "$lib/utils/selection-state.svelte";
import { dataAttr, disabledAttr } from "$lib/utils/attribute";
import { extract } from "$lib/utils/extract";
import { createBuilderMetadata } from "$lib/utils/identifiers";
import { isHtmlElement } from "$lib/utils/is";
import { getDirectionalKeys, kbd } from "$lib/utils/keyboard";
import type { HTMLAttributes } from "svelte/elements";
import { SvelteSet } from "svelte/reactivity";

const metadata = createBuilderMetadata("togglegroup", ["root", "item"]);

export type ToggleGroupProps = {
	/**
	 * The value for the Toggle Group.
	 * Consists of a `Set` of strings representing the values of the selected items.
	 */
	value?: IterableProp<string>;

	/**
	 * Called when the value is supposed to change.
	 */
	onValueChange?: (value: Set<string>) => void;

	/**
	 * If `true`, prevents the user from interacting with the group.
	 *
	 * @default false
	 */
	disabled?: MaybeGetter<boolean | undefined>;

	/**
	 * If the the item selection should loop when navigating with the arrow keys.
	 *
	 * @default true
	 */
	loop?: MaybeGetter<boolean | undefined>;

	/**
	 * The orientation of the toggle group.
	 *
	 * @default "horizontal"
	 */
	orientation?: MaybeGetter<"horizontal" | "vertical" | undefined>;
};

export class ToggleGroup {
	#ids = metadata.createIds();

	/* Props */
	#props!: ToggleGroupProps;
	readonly disabled = $derived(extract(this.#props.disabled, false));
	readonly loop = $derived(extract(this.#props.loop, true));
	readonly orientation = $derived(extract(this.#props.orientation, "horizontal"));

	/* State */
	#value: SelectionState<string, true>;

	constructor(props: ToggleGroupProps = {}) {
		this.#props = props;
		this.#value = new SelectionState<string, true>({
			value: props.value,
			onChange: props.onValueChange,
			multiple: true, // Always multiple for ToggleGroup
		});
	}

	get value() {
		return this.#value.current;
	}

	set value(value: SvelteSet<string>) {
		this.#value.current = value;
	}

	/** Checks if an item is currently selected/pressed. */
	isSelected = (itemValue: string) => {
		return this.#value.has(itemValue);
	};

	/** Toggles the selection state of an item. */
	toggle = (itemValue: string) => {
		this.#value.toggle(itemValue);
	};

	get #sharedAttrs() {
		return {
			"data-orientation": this.orientation,
			"data-disabled": disabledAttr(this.disabled),
		};
	}

	/** Attributes for the root element of the toggle group. */
	get root() {
		return {
			...this.#sharedAttrs,
			[metadata.dataAttrs.root]: "",
			id: this.#ids.root,
			role: "group",
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	/** Returns an instance of `ToggleGroupItem` for a given item value. */
	getItem(itemValue: string) {
		return new ToggleGroupItem({ group: this, itemValue });
	}
}

type ToggleGroupItemProps = {
	group: ToggleGroup;
	itemValue: string;
};

class ToggleGroupItem {
	#props!: ToggleGroupItemProps;

	#group = $derived(this.#props.group);
	readonly value = $derived(this.#props.itemValue);
	readonly isSelected = $derived(this.#group.isSelected(this.value));
	readonly isDisabled = $derived(this.#group.disabled);

	constructor(props: ToggleGroupItemProps) {
		this.#props = props;
	}

	#select() {
		if (this.isDisabled) return;
		this.#group.toggle(this.value);
	}

	/** Attributes for the toggle group item (button) element. */
	get attrs() {
		return {
			[metadata.dataAttrs.item]: "",
			"data-value": this.value,
			"data-state": this.isSelected ? "on" : "off",
			"data-disabled": disabledAttr(this.isDisabled),
			"aria-pressed": this.isSelected,
			role: "button", // Using 'button' role as 'toggle' is deprecated in ARIA 1.2 for group context
			tabindex: 0, // Make all items focusable
			onclick: () => {
				this.#select();
			},
			onkeydown: (e: KeyboardEvent) => {
				if (e.key === kbd.SPACE || e.key === kbd.ENTER) {
					e.preventDefault();
					this.#select();
					return;
				}

				const el = e.currentTarget;
				if (!isHtmlElement(el)) return;
				const root = el.closest<HTMLElement>(metadata.dataSelectors.root);
				if (!root) return;

				const items = Array.from(
					root.querySelectorAll<HTMLElement>(metadata.dataSelectors.item),
				).filter((itemEl) => !itemEl.hasAttribute("data-disabled"));

				if (items.length <= 1) return;

				const currentIdx = items.indexOf(el);
				const loop = this.#group.loop;
				const orientation = this.#group.orientation;

				const dir = document.dir === "rtl" ? "rtl" : "ltr";
				const { nextKey, prevKey } = getDirectionalKeys(dir, orientation);

				let itemToFocus: HTMLElement | undefined;

				switch (e.key) {
					case nextKey:
						e.preventDefault();
						const nextIdx = currentIdx + 1;
						if (nextIdx >= items.length && loop) {
							itemToFocus = items[0];
						} else {
							itemToFocus = items[nextIdx];
						}
						break;
					case prevKey:
						e.preventDefault();
						const prevIdx = currentIdx - 1;
						if (prevIdx < 0 && loop) {
							itemToFocus = items[items.length - 1];
						} else {
							itemToFocus = items[prevIdx];
						}
						break;
					case kbd.HOME:
						e.preventDefault();
						itemToFocus = items[0];
						break;
					case kbd.END:
						e.preventDefault();
						itemToFocus = items[items.length - 1];
						break;
					default:
						return;
				}

				itemToFocus?.focus();
			},
			//...this.#group.#sharedAttrs, TODO // Include orientation and disabled attributes
		} as const satisfies HTMLAttributes<HTMLButtonElement>;
	}
}
