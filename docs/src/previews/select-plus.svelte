<script lang="ts">
	import { usePreviewControls } from "@components/preview-ctx.svelte";
	import Preview from "@components/preview.svelte";
	import { getters } from "melt";
	import { SelectPlus } from "melt/builders";
	import BookOpen from "~icons/lucide/book-open";
	import Check from "~icons/lucide/check";
	import ChevronDown from "~icons/lucide/chevron-down";
	import Keyboard from "~icons/lucide/keyboard";
	import { onMount } from "svelte";

	const controls = usePreviewControls({
		multiple: {
			type: "boolean",
			defaultValue: false,
			label: "Multiple Selection",
		},
		disabled: {
			type: "boolean",
			defaultValue: false,
			label: "Disabled",
		},
	});

	interface Book {
		id: number;
		title: string;
		author: string;
		year: number;
	}

	const books: Book[] = [
		{ id: 1, title: "To Kill a Mockingbird", author: "Harper Lee", year: 1960 },
		{ id: 2, title: "1984", author: "George Orwell", year: 1949 },
		{ id: 3, title: "The Great Gatsby", author: "F. Scott Fitzgerald", year: 1925 },
		{ id: 4, title: "Pride and Prejudice", author: "Jane Austen", year: 1813 },
		{ id: 5, title: "The Catcher in the Rye", author: "J.D. Salinger", year: 1951 },
		{ id: 6, title: "Brave New World", author: "Aldous Huxley", year: 1932 },
		{ id: 7, title: "Lord of the Flies", author: "William Golding", year: 1954 },
		{ id: 8, title: "Animal Farm", author: "George Orwell", year: 1945 },
		{ id: 9, title: "The Hobbit", author: "J.R.R. Tolkien", year: 1937 },
		{ id: 10, title: "Fahrenheit 451", author: "Ray Bradbury", year: 1953 },
	];

	let selectedBook: Book | null = null;
	let selectedBookString = "";

	const selectPlus = new SelectPlus<Book, boolean>({
		forceVisible: true,
		getOptionLabel: (book) => book.title,
		onValueChange: (value) => {
			selectedBook = value as Book;
			selectedBookString = selectedBook ? `${selectedBook.title} (${selectedBook.year})` : "";
		},
		...getters(controls),
	});

	// For demonstration purposes
	let demoTypeahead = "";
	onMount(() => {
		const contentEl = document.getElementById(selectPlus.ids.content);
		if (contentEl) {
			contentEl.addEventListener("keydown", (e) => {
				if (e.key && e.key.length === 1 && e.key.match(/[a-z]/i)) {
					demoTypeahead += e.key;
					setTimeout(() => {
						demoTypeahead = "";
					}, 1500);
				}
			});
		}
	});
</script>

<Preview>
	<div class="mx-auto flex w-[400px] flex-col gap-4">
		<div class="flex w-full items-center justify-center gap-2 rounded-md bg-blue-100 p-2 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
			<Keyboard class="h-4 w-4"/>
			<span>Try typing while the dropdown is open to use typeahead search!</span>
			{#if demoTypeahead}
				<div class="ml-1 rounded bg-blue-200 px-1.5 font-mono dark:bg-blue-800">
					Typing: {demoTypeahead}
				</div>
			{/if}
		</div>
		
		<div class="flex w-full flex-col gap-1">
			<label for={selectPlus.ids.trigger}>Select a Book</label>
			<button
				{...selectPlus.trigger}
				class="flex items-center justify-between overflow-hidden rounded-xl border border-gray-500 bg-gray-100 py-2 pl-3 pr-4 text-left text-gray-800
					transition hover:cursor-pointer hover:bg-gray-200
					active:bg-gray-300 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50
					dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-500/50 dark:active:bg-gray-600/50"
				disabled={controls.disabled}
			>
				<div class="inline-flex items-center gap-2 overflow-hidden">
					<BookOpen class="shrink-0" />
					<span class="truncate">{selectPlus.valueAsString || "Choose a book..."}</span>
				</div>
				<ChevronDown class="shrink-0" />
			</button>

			<div
				{...selectPlus.content}
				class="max-h-64 flex flex-col overflow-y-auto rounded-xl border border-gray-500 bg-gray-100 p-2 shadow dark:bg-gray-800"
			>
				{#each books as book}
					<div
						{...selectPlus.getOption(book, { 
							label: book.title,
							typeahead: `${book.title} ${book.author}`
						})}
						class={[
							"relative flex items-center justify-between rounded-xl py-2 pl-4 pr-2",
							"hover:bg-gray-200 dark:hover:bg-gray-600",
							selectPlus.highlighted === book && "bg-gray-700 text-white hover:bg-gray-700 dark:hover:bg-gray-700",
							selectPlus.value === book && "font-semibold",
						]}
					>
						<div class="flex flex-col">
							<span class="font-medium">{book.title}</span>
							<span class="text-xs text-gray-500 dark:text-gray-400">{book.author} ({book.year})</span>
						</div>
						{#if selectPlus.isSelected(book)}
							<Check class="text-accent-300 font-bold" />
						{/if}
					</div>
				{/each}
			</div>
			
			{#if selectedBookString}
				<div class="mt-2 rounded-md bg-green-100 p-2 text-sm dark:bg-green-900">
					<strong>Selected:</strong> {selectedBookString}
				</div>
			{/if}
		</div>
	</div>
</Preview>

<style>
	[data-melt-select-content] {
		position: absolute;
		pointer-events: none;
		opacity: 0;

		transform: scale(0.975);

		transition: 0.2s;
		transition-property: opacity, transform;
		transform-origin: var(--melt-popover-content-transform-origin, center);
	}

	[data-melt-select-content][data-open] {
		pointer-events: auto;
		opacity: 1;

		transform: scale(1);
	}
	
	/* Styles for typeahead demo */
	@keyframes pulse {
		0%, 100% { opacity: 0.8; }
		50% { opacity: 1; }
	}
	
	[data-melt-select-option][data-highlighted="true"] {
		background-color: rgb(55, 65, 81); /* gray-700 */
		color: white;
	}
	
	.dark [data-melt-select-option][data-highlighted="true"] {
		background-color: rgb(75, 85, 99); /* gray-600 in dark mode */
	}
</style>