import type { MaybeGetter } from "$lib/types";
import { dataAttr } from "../utils/attribute";
import { extract } from "../utils/extract";
import { createBuilderMetadata } from "../utils/identifiers";
import { isHtmlElement } from "../utils/is";
import { kbd } from "../utils/keyboard";
import { pick } from "../utils/object";
import { tick } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { Synced } from "../Synced.svelte";

const { dataAttrs, dataSelectors, createIds } = createBuilderMetadata("datatable", [
	"root",
	"header",
	"headerRow",
	"headerCell",
	"body",
	"row",
	"cell",
	"footer",
	"pagination",
	"emptyState",
]);

/**
 * Sort direction for column sorting
 */
export type SortDirection = "asc" | "desc" | null;

/**
 * Column configuration for the DataTable
 */
export type DataTableColumn<T extends Record<string, any>> = {
	/**
	 * Unique identifier for the column
	 */
	id: string;

	/**
	 * Display label for the column
	 */
	label: string;

	/**
	 * Key in the data object this column represents
	 */
	accessor: keyof T;

	/**
	 * Whether this column is sortable
	 * @default false
	 */
	sortable?: boolean;

	/**
	 * Custom sort function for this column
	 */
	sortFn?: (a: T, b: T, direction: SortDirection) => number;

	/**
	 * Render function for cell content
	 */
	cell?: (value: T[keyof T], row: T) => string;

	/**
	 * Width of the column (in px or %)
	 * @default "auto"
	 */
	width?: string;

	/**
	 * Whether this column is resizable
	 * @default true
	 */
	resizable?: boolean;

	/**
	 * Minimum width for this column when resizing (in px)
	 * @default 50
	 */
	minWidth?: number;

	/**
	 * Maximum width for this column when resizing (in px)
	 * @default Infinity
	 */
	maxWidth?: number;
};

export type DataTableProps<T extends Record<string, any>> = {
	/**
	 * Array of data to display in the table
	 */
	data: MaybeGetter<T[]>;

	/**
	 * Array of column configurations
	 */
	columns: MaybeGetter<DataTableColumn<T>[]>;

	/**
	 * Column ID to sort by
	 */
	sortBy?: MaybeGetter<string | null>;

	/**
	 * Sort direction
	 */
	sortDirection?: MaybeGetter<SortDirection>;

	/**
	 * Called when sort parameters change
	 */
	onSortChange?: (id: string | null, direction: SortDirection) => void;

	/**
	 * Whether to enable pagination
	 * @default false
	 */
	pagination?: MaybeGetter<boolean>;

	/**
	 * Number of rows per page
	 * @default 10
	 */
	pageSize?: MaybeGetter<number>;

	/**
	 * Current page (1-based)
	 * @default 1
	 */
	page?: MaybeGetter<number>;

	/**
	 * Called when page changes
	 */
	onPageChange?: (page: number) => void;

	/**
	 * Called when page size changes
	 */
	onPageSizeChange?: (pageSize: number) => void;

	/**
	 * Whether to make the table keyboard navigable
	 * @default true
	 */
	keyboardNavigation?: MaybeGetter<boolean>;

	/**
	 * Whether columns can be resized
	 * @default true
	 */
	resizableColumns?: MaybeGetter<boolean>;

	/**
	 * Called when column width changes
	 */
	onColumnResize?: (columnId: string, width: number) => void;
};

export class DataTable<T extends Record<string, any>> {
	#props: DataTableProps<T>;
	readonly ids = createIds();

	#sortBy: Synced<string | null>;
	#sortDirection: Synced<"asc" | "desc" | null>;
	#page: Synced<number>;
	#pageSize: Synced<number>;
	#focusedCell: { rowIndex: number; colIndex: number } | null = null;
	#columnWidths: Map<string, number> = new Map();
	#isResizing: boolean = false;
	#resizingColumnId: string | null = null;
	#resizeStartX: number = 0;
	#resizeStartWidth: number = 0;

	constructor(props: DataTableProps<T>) {
		this.#props = props;

		this.#sortBy = new Synced<string | null>({
			value: props.sortBy !== undefined ? props.sortBy : null,
			onChange: (value) => this.#handleSortChange(value, this.sortDirection),
			defaultValue: null,
		});

		this.#sortDirection = new Synced<"asc" | "desc" | null>({
			value: props.sortDirection !== undefined ? props.sortDirection : null,
			onChange: (direction) => this.#handleSortChange(this.sortBy, direction),
			defaultValue: null,
		});

		this.#page = new Synced({
			value: props.page,
			onChange: props.onPageChange,
			defaultValue: 1,
		});

		this.#pageSize = new Synced({
			value: props.pageSize,
			onChange: props.onPageSizeChange,
			defaultValue: 10,
		});
	}

	get columns(): DataTableColumn<T>[] {
		return extract(this.#props.columns, []);
	}

	get data(): T[] {
		const rawData = extract(this.#props.data, []);
		const sortedData = this.#getSortedData(rawData);

		if (!this.enablePagination) {
			return sortedData;
		}

		const start = (this.page - 1) * this.pageSize;
		const end = start + this.pageSize;
		return sortedData.slice(start, end);
	}

	get sortBy(): string | null {
		return this.#sortBy.current;
	}

	set sortBy(value: string | null) {
		this.#sortBy.current = value;
	}

	get sortDirection(): SortDirection {
		return this.#sortDirection.current;
	}

	set sortDirection(value: SortDirection) {
		this.#sortDirection.current = value;
	}

	get enablePagination(): boolean {
		return extract(this.#props.pagination, false);
	}

	get pageSize(): number {
		return this.#pageSize.current;
	}

	set pageSize(value: number) {
		this.#pageSize.current = value;
	}

	get page(): number {
		return this.#page.current;
	}

	set page(value: number) {
		this.#page.current = value;
	}

	get totalPages(): number {
		if (!this.enablePagination) return 1;
		const rawData = extract(this.#props.data, []);
		return Math.ceil(rawData.length / this.pageSize) || 1;
	}

	get keyboardNavigation(): boolean {
		return extract(this.#props.keyboardNavigation, true);
	}

	get resizableColumns(): boolean {
		return extract(this.#props.resizableColumns, true);
	}

	toggleSort(columnId: string) {
		const column = this.columns.find((col) => col.id === columnId);
		if (!column || !column.sortable) return;

		if (this.sortBy !== columnId) {
			this.sortBy = columnId;
			this.sortDirection = "asc";
		} else {
			this.sortDirection = this.#getNextSortDirection(this.sortDirection);
		}
	}

	nextPage() {
		if (this.page < this.totalPages) {
			this.page++;
		}
	}

	prevPage() {
		if (this.page > 1) {
			this.page--;
		}
	}

	goToPage(page: number) {
		if (page >= 1 && page <= this.totalPages) {
			this.page = page;
		}
	}

	getCellContent(column: DataTableColumn<T>, row: T): string {
		const value = row[column.accessor];
		if (column.cell) {
			return column.cell(value, row);
		}
		return String(value ?? "");
	}

	#handleSortChange(id: string | null, direction: SortDirection) {
		this.#props.onSortChange?.(id, direction);
	}

	#getNextSortDirection(current: SortDirection): SortDirection {
		switch (current) {
			case "asc":
				return "desc";
			case "desc":
				return null;
			case null:
				return "asc";
		}
	}

	#getSortedData(data: T[]): T[] {
		if (!this.sortBy || !this.sortDirection) {
			return [...data];
		}

		const column = this.columns.find((col) => col.id === this.sortBy);
		if (!column) return [...data];

		return [...data].sort((a, b) => {
			if (column.sortFn) {
				return column.sortFn(a, b, this.sortDirection);
			}

			const aValue = a[column.accessor];
			const bValue = b[column.accessor];

			if (aValue == null) return this.sortDirection === "asc" ? -1 : 1;
			if (bValue == null) return this.sortDirection === "asc" ? 1 : -1;

			if (typeof aValue === "string" && typeof bValue === "string") {
				return this.sortDirection === "asc"
					? aValue.localeCompare(bValue)
					: bValue.localeCompare(aValue);
			}

			// Default comparison for numbers and other types
			return this.sortDirection === "asc"
				? aValue < bValue
					? -1
					: aValue > bValue
						? 1
						: 0
				: aValue < bValue
					? 1
					: aValue > bValue
						? -1
						: 0;
		});
	}

	// Element props

	get root() {
		return {
			[dataAttrs.root]: "",
			role: "table",
			id: this.ids.root,
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get header() {
		return {
			[dataAttrs.header]: "",
			role: "rowgroup",
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get headerRow() {
		return {
			[dataAttrs.headerRow]: "",
			role: "row",
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	getHeaderCell(column: DataTableColumn<T>, _index: number) {
		const isResizable = this.resizableColumns && column.resizable !== false;

		return {
			[dataAttrs.headerCell]: "",
			role: "columnheader",
			"aria-sort":
				column.id === this.sortBy
					? this.sortDirection === "asc"
						? "ascending"
						: "descending"
					: undefined,
			"data-sortable": dataAttr(column.sortable),
			"data-sorted": dataAttr(column.id === this.sortBy),
			"data-sort-direction": this.sortBy === column.id ? this.sortDirection : undefined,
			"data-resizable": dataAttr(isResizable),
			"data-value": column.id,
			style: `width: ${this.getColumnWidth(column.id)};`,
			onclick: (e: MouseEvent) => {
				// Only toggle sort if not clicking on resize handle
				if (column.sortable && !(e.target as HTMLElement).closest(".column-resize-handle")) {
					this.toggleSort(column.id);
				}
			},
			onkeydown: (e: KeyboardEvent) => {
				if (!this.keyboardNavigation) return;

				const kbdSubset = pick(kbd, "SPACE", "ENTER");
				if (column.sortable && (e.key === kbdSubset.SPACE || e.key === kbdSubset.ENTER)) {
					e.preventDefault();
					this.toggleSort(column.id);
				}
			},
			tabindex: column.sortable ? 0 : -1,
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get body() {
		return {
			[dataAttrs.body]: "",
			role: "rowgroup",
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	getRow(rowIndex: number) {
		return {
			[dataAttrs.row]: "",
			role: "row",
			"data-row-index": rowIndex,
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	getCell(rowIndex: number, colIndex: number) {
		return {
			[dataAttrs.cell]: "",
			role: "cell",
			"data-row-index": rowIndex,
			"data-col-index": colIndex,
			tabindex: this.keyboardNavigation
				? this.#focusedCell?.rowIndex === rowIndex && this.#focusedCell?.colIndex === colIndex
					? 0
					: -1
				: undefined,
			onkeydown: (e: KeyboardEvent) => {
				if (!this.keyboardNavigation) return;

				const kbdSubset = pick(kbd, "ARROW_UP", "ARROW_DOWN", "ARROW_LEFT", "ARROW_RIGHT");

				switch (e.key) {
					case kbdSubset.ARROW_UP:
						e.preventDefault();
						this.#moveFocus(rowIndex - 1, colIndex);
						break;
					case kbdSubset.ARROW_DOWN:
						e.preventDefault();
						this.#moveFocus(rowIndex + 1, colIndex);
						break;
					case kbdSubset.ARROW_LEFT:
						e.preventDefault();
						this.#moveFocus(rowIndex, colIndex - 1);
						break;
					case kbdSubset.ARROW_RIGHT:
						e.preventDefault();
						this.#moveFocus(rowIndex, colIndex + 1);
						break;
				}
			},
			onfocus: () => {
				this.#focusedCell = { rowIndex, colIndex };
			},
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get footer() {
		return {
			[dataAttrs.footer]: "",
			role: "rowgroup",
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get paginationAttrs() {
		return {
			[dataAttrs.pagination]: "",
			role: "navigation",
			"aria-label": "Pagination",
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	get emptyState() {
		return {
			[dataAttrs.emptyState]: "",
			role: "row",
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	#moveFocus(rowIndex: number, colIndex: number) {
		const maxRowIndex = this.data.length - 1;
		const maxColIndex = this.columns.length - 1;

		// Ensure indices are within bounds
		if (rowIndex < 0) rowIndex = 0;
		if (rowIndex > maxRowIndex) rowIndex = maxRowIndex;
		if (colIndex < 0) colIndex = 0;
		if (colIndex > maxColIndex) colIndex = maxColIndex;

		this.#focusedCell = { rowIndex, colIndex };

		// Focus the cell element
		tick().then(() => {
			const cellSelector = `${dataSelectors.cell}[data-row-index="${rowIndex}"][data-col-index="${colIndex}"]`;
			const cellEl = document.querySelector(cellSelector);
			if (isHtmlElement(cellEl)) {
				cellEl.tabIndex = 0;
				cellEl.focus();
			}
		});
	}

	// Column resizing methods

	/**
	 * Gets the current width of a column
	 */
	getColumnWidth(columnId: string): string {
		const column = this.columns.find((col) => col.id === columnId);
		if (!column) return "auto";

		// If we have a stored width from resizing, use that
		if (this.#columnWidths.has(columnId)) {
			return `${this.#columnWidths.get(columnId)}px`;
		}

		// Otherwise use the column's default width
		return column.width || "auto";
	}

	/**
	 * Resizes a column to the specified width
	 */
	resizeColumn(columnId: string, width: number): void {
		const column = this.columns.find((col) => col.id === columnId);
		if (!column || column.resizable === false || !this.resizableColumns) return;

		// Apply min/max constraints
		const minWidth = column.minWidth ?? 50;
		const maxWidth = column.maxWidth ?? Infinity;
		const constrainedWidth = Math.max(minWidth, Math.min(maxWidth, width));

		// Store the new width
		this.#columnWidths.set(columnId, constrainedWidth);

		// Notify caller if callback provided
		this.#props.onColumnResize?.(columnId, constrainedWidth);
	}

	/**
	 * Handle for column resize
	 */
	getResizeHandle(columnId: string) {
		return {
			class: "column-resize-handle",
			"data-resize-handle": columnId,
			"aria-hidden": true,
			style:
				"position: absolute; right: 0; top: 0; height: 100%; width: 8px; cursor: col-resize; z-index: 10;",
			onmousedown: (e: MouseEvent) => {
				e.preventDefault();
				e.stopPropagation(); // Prevent triggering sort
				this.#handleResizeStart(e, columnId);
			},
			ontouchstart: (e: TouchEvent) => {
				e.preventDefault();
				const touch = e.touches[0];
				if (!touch) return;

				const mouseEvent = new MouseEvent("mousedown", {
					clientX: touch.clientX,
					clientY: touch.clientY,
				});
				this.#handleResizeStart(mouseEvent, columnId);
			},
		} as const satisfies HTMLAttributes<HTMLElement>;
	}

	/**
	 * Start column resize operation
	 */
	#handleResizeStart(e: MouseEvent, columnId: string): void {
		const column = this.columns.find((col) => col.id === columnId);
		if (!column || column.resizable === false || !this.resizableColumns) return;

		this.#isResizing = true;
		this.#resizingColumnId = columnId;
		this.#resizeStartX = e.clientX;

		// Find the header cell element
		const headerCell = document.querySelector(
			`[${dataAttrs.headerCell}][data-value="${columnId}"]`,
		) as HTMLElement;
		if (!headerCell) return;

		this.#resizeStartWidth = headerCell.getBoundingClientRect().width;

		// Add resizing class to body for cursor styling
		document.body.classList.add("resizing");

		// Setup move and up handlers
		const handleMouseMove = (moveEvent: MouseEvent) => {
			if (!this.#isResizing || !this.#resizingColumnId) return;

			moveEvent.preventDefault();
			const deltaX = moveEvent.clientX - this.#resizeStartX;
			moveEvent.stopPropagation();
			const newWidth = this.#resizeStartWidth + deltaX;
			this.resizeColumn(this.#resizingColumnId, newWidth);

			// Force browser to repaint
			requestAnimationFrame(() => {
				document.body.style.cursor = "col-resize";
			});
		};

		const handleTouchMove = (moveEvent: TouchEvent) => {
			if (!this.#isResizing || !this.#resizingColumnId) return;

			moveEvent.preventDefault();
			const touch = moveEvent.touches[0];
			if (!touch) return;

			const deltaX = touch.clientX - this.#resizeStartX;
			moveEvent.stopPropagation();
			const newWidth = this.#resizeStartWidth + deltaX;
			this.resizeColumn(this.#resizingColumnId, newWidth);
		};

		const handleMouseUp = () => {
			this.#finishResize();

			// Remove event listeners
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("touchmove", handleTouchMove);
			document.removeEventListener("mouseup", handleMouseUp);
			document.removeEventListener("touchend", handleMouseUp);
		};

		// Add event listeners
		document.addEventListener("mousemove", handleMouseMove);
		document.addEventListener("touchmove", handleTouchMove, { passive: false });
		document.addEventListener("mouseup", handleMouseUp);
		document.addEventListener("touchend", handleMouseUp);
	}

	/**
	 * Finish resize operation and clean up
	 */
	#finishResize(): void {
		this.#isResizing = false;
		this.#resizingColumnId = null;
		this.#resizeStartX = 0;
		this.#resizeStartWidth = 0;

		// Remove resizing class from body
		document.body.classList.remove("resizing");
		document.body.style.removeProperty("cursor");

		// Force browser to update after a resize operation
		setTimeout(() => {
			window.dispatchEvent(new Event("resize"));
		}, 0);
	}
}
