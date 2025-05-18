<script lang="ts">
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import Preview from "@components/preview.svelte";
	import { getters } from "melt";
	import { DataTable } from "../../../packages/melt/src/lib/builders/DataTable.svelte";
	import ArrowDown from "~icons/lucide/arrow-down";
	import ArrowUp from "~icons/lucide/arrow-up";
	import ArrowUpDown from "~icons/lucide/arrow-up-down";
	import ChevronLeft from "~icons/lucide/chevron-left";
	import ChevronRight from "~icons/lucide/chevron-right";
	import GripVertical from "~icons/lucide/grip-vertical";

	const controls = usePreviewControls({
		pagination: {
			type: "boolean",
			defaultValue: true,
			label: "Pagination",
		},
		pageSize: {
			type: "number",
			defaultValue: 5,
			label: "Rows per page",
			min: 1,
			max: 10,
		},
		keyboardNavigation: {
			type: "boolean",
			defaultValue: true,
			label: "Keyboard Navigation",
		},
		resizableColumns: {
			type: "boolean",
			defaultValue: true,
			label: "Resizable Columns",
		},
	});

	type Person = {
		id: number;
		firstName: string;
		lastName: string;
		age: number;
		email: string;
		status: "active" | "inactive";
	};

	const data: Person[] = [
		{ id: 1, firstName: "John", lastName: "Doe", age: 32, email: "john.doe@example.com", status: "active" },
		{ id: 2, firstName: "Jane", lastName: "Smith", age: 28, email: "jane.smith@example.com", status: "active" },
		{ id: 3, firstName: "Bob", lastName: "Johnson", age: 45, email: "bob.johnson@example.com", status: "inactive" },
		{ id: 4, firstName: "Alice", lastName: "Williams", age: 36, email: "alice.williams@example.com", status: "active" },
		{ id: 5, firstName: "Charlie", lastName: "Brown", age: 41, email: "charlie.brown@example.com", status: "inactive" },
		{ id: 6, firstName: "Eva", lastName: "Davis", age: 23, email: "eva.davis@example.com", status: "active" },
		{ id: 7, firstName: "Frank", lastName: "Miller", age: 52, email: "frank.miller@example.com", status: "inactive" },
		{ id: 8, firstName: "Grace", lastName: "Wilson", age: 29, email: "grace.wilson@example.com", status: "active" },
		{ id: 9, firstName: "Henry", lastName: "Moore", age: 33, email: "henry.moore@example.com", status: "active" },
		{ id: 10, firstName: "Ivy", lastName: "Taylor", age: 38, email: "ivy.taylor@example.com", status: "inactive" },
	];

	const columns = [
		{
			id: "name",
			label: "Name",
			accessor: "firstName" as const,
			sortable: true,
			cell: (value: string, row: Person) => `${value} ${row.lastName}`,
			width: "25%",
			minWidth: 120,
		},
		{
			id: "age",
			label: "Age",
			accessor: "age" as const,
			sortable: true,
			width: "10%",
			minWidth: 80,
		},
		{
			id: "email",
			label: "Email",
			accessor: "email" as const,
			sortable: true,
			width: "45%",
			minWidth: 180,
		},
		{
			id: "status",
			label: "Status",
			accessor: "status" as const,
			sortable: true,
			width: "20%",
			minWidth: 100,
		},
	];

	const dataTable = new DataTable<Person>({
		data,
		columns,
		sortBy: "name",
		sortDirection: "asc",
		...getters(controls),
	});
</script>

<Preview>
	<div class="w-full max-w-4xl mx-auto">
		<div
			{...dataTable.root}
			class="relative w-full border border-gray-300 rounded-lg overflow-hidden bg-white dark:bg-gray-800 dark:border-gray-600"
		>
			<div {...dataTable.header} class="sticky top-0 bg-gray-100 dark:bg-gray-700">
				<div {...dataTable.headerRow} class="grid" style="grid-template-columns: repeat({dataTable.columns.length}, auto);">
					{#each dataTable.columns as column, colIndex}
						<div
							{...dataTable.getHeaderCell(column, colIndex)}
							class="px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600 flex items-center justify-between select-none relative"
							class:cursor-pointer={column.sortable}
							class:bg-gray-200={column.id === dataTable.sortBy}
							class:dark:bg-gray-600={column.id === dataTable.sortBy}
						>
							<span>{column.label}</span>
							<div class="flex items-center">
								{#if column.sortable}
									<span class="ml-1 flex items-center">
										{#if column.id === dataTable.sortBy}
											{#if dataTable.sortDirection === "asc"}
												<ArrowUp class="w-4 h-4" />
											{:else if dataTable.sortDirection === "desc"}
												<ArrowDown class="w-4 h-4" />
											{/if}
										{:else}
											<ArrowUpDown class="w-4 h-4 text-gray-400" />
										{/if}
									</span>
								{/if}
							</div>
							
							<!-- Add resize handle -->
							{#if dataTable.resizableColumns && column.resizable !== false && colIndex < dataTable.columns.length - 1}
								<div 
									{...dataTable.getResizeHandle(column.id)}
									class="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 z-10"
								>
									<div class="w-1 h-4/5 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
									<GripVertical class="w-4 h-4 text-gray-400" />
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>

			<div {...dataTable.body} class="w-full">
				{#if dataTable.data.length === 0}
					<div {...dataTable.emptyState} class="py-8 text-center text-gray-500 dark:text-gray-400">
						No data available
					</div>
				{:else}
					{#each dataTable.data as row, rowIndex}
						<div
							{...dataTable.getRow(rowIndex)}
							class="grid border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750"
							style="grid-template-columns: repeat({dataTable.columns.length}, auto);"
						>
							{#each dataTable.columns as column, colIndex}
								<div
									{...dataTable.getCell(rowIndex, colIndex)}
									class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300"
								>
									{dataTable.getCellContent(column, row)}
								</div>
							{/each}
						</div>
					{/each}
				{/if}
			</div>

			{#if dataTable.enablePagination}
				<div {...dataTable.footer} class="bg-gray-50 dark:bg-gray-750 px-4 py-3 flex items-center justify-between">
					<div class="text-sm text-gray-500 dark:text-gray-400">
						Showing {(dataTable.page - 1) * dataTable.pageSize + 1} to {Math.min(
							dataTable.page * dataTable.pageSize,
							data.length,
						)} of {data.length} entries
					</div>
					<div {...dataTable.paginationAttrs} class="flex items-center gap-2">
						<button
							type="button"
							class="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
							on:click={() => dataTable.prevPage()}
							disabled={dataTable.page === 1}
						>
							<ChevronLeft class="w-4 h-4" />
						</button>
						{#each Array(Math.min(5, dataTable.totalPages)) as _, i}
							{@const pageNumber = dataTable.page <= 3 ? i + 1 : dataTable.page + i - 2}
							{#if pageNumber > 0 && pageNumber <= dataTable.totalPages}
								<button
									type="button"
									class="w-8 h-8 flex items-center justify-center rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
									class:bg-blue-500={pageNumber === dataTable.page}
									class:text-white={pageNumber === dataTable.page}
									class:dark:bg-blue-600={pageNumber === dataTable.page}
									on:click={() => dataTable.goToPage(pageNumber)}
								>
									{pageNumber}
								</button>
							{/if}
						{/each}
						<button
							type="button"
							class="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
							on:click={() => dataTable.nextPage()}
							disabled={dataTable.page === dataTable.totalPages}
						>
							<ChevronRight class="w-4 h-4" />
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</Preview>

<style>
	[data-melt-datatable-header-cell][data-sortable="true"] {
		cursor: pointer;
	}

	[data-melt-datatable-header-cell][data-sortable="true"]:hover {
		background-color: rgba(0, 0, 0, 0.05);
	}

	.dark [data-melt-datatable-header-cell][data-sortable="true"]:hover {
		background-color: rgba(255, 255, 255, 0.05);
	}

	[data-melt-datatable-cell]:focus {
		outline: 2px solid rgb(59, 130, 246);
		outline-offset: -2px;
	}
	
	/* Column resize styles */
	.column-resize-handle {
		opacity: 0.5;
		transition: opacity 0.2s;
		z-index: 20;
	}
	
	[data-melt-datatable-header-cell]:hover .column-resize-handle {
		opacity: 1;
	}
	
	:global(body.resizing) {
		cursor: col-resize !important;
		user-select: none !important;
		-webkit-user-select: none !important;
		-moz-user-select: none !important;
		-ms-user-select: none !important;
	}
	
	:global(body.resizing *) {
		cursor: col-resize !important;
	}
	
	/* Make sure grid cells respect their widths */
	[data-melt-datatable-row],
	[data-melt-datatable-header-row] {
		display: grid;
		width: 100%;
		grid-auto-columns: minmax(0, 1fr);
	}
	
	[data-melt-datatable-header-cell],
	[data-melt-datatable-cell] {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>