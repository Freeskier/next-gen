import { expect, test, vi } from "vitest";
import { DataTable } from "./DataTable.svelte";

test("DataTable creates with default props", () => {
	const dataTable = new DataTable({
		data: [],
		columns: []
	});
	
	expect(dataTable.data).toEqual([]);
	expect(dataTable.columns).toEqual([]);
	expect(dataTable.sortBy).toBeNull();
	expect(dataTable.sortDirection).toBeNull();
	expect(dataTable.enablePagination).toBe(false);
	expect(dataTable.page).toBe(1);
	expect(dataTable.pageSize).toBe(10);
	expect(dataTable.keyboardNavigation).toBe(true);
	expect(dataTable.resizableColumns).toBe(true);
});

test("DataTable sorting works correctly", () => {
	type TestData = { id: number; name: string; age: number };
	
	const testData: TestData[] = [
		{ id: 1, name: "John", age: 30 },
		{ id: 2, name: "Alice", age: 25 },
		{ id: 3, name: "Bob", age: 40 }
	];
	
	const columns = [
		{ id: "name", label: "Name", accessor: "name", sortable: true },
		{ id: "age", label: "Age", accessor: "age", sortable: true }
	];
	
	const dataTable = new DataTable<TestData>({
		data: testData,
		columns
	});
	
	// Initial state - no sorting
	expect(dataTable.data[0].id).toBe(1);
	expect(dataTable.data[1].id).toBe(2);
	expect(dataTable.data[2].id).toBe(3);
	
	// Sort by name ascending
	dataTable.toggleSort("name");
	expect(dataTable.sortBy).toBe("name");
	expect(dataTable.sortDirection).toBe("asc");
});

test("DataTable pagination works correctly", () => {
	const testData = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));
	
	const dataTable = new DataTable({
		data: testData,
		columns: [{ id: "id", label: "ID", accessor: "id" }],
		pagination: true,
		pageSize: 5
	});
	
	// Check initial state
	expect(dataTable.enablePagination).toBe(true);
	expect(dataTable.pageSize).toBe(5);
	expect(dataTable.page).toBe(1);
	expect(dataTable.totalPages).toBe(5);
	expect(dataTable.data.length).toBe(5);
});

test("DataTable resizing works correctly", () => {
	const dataTable = new DataTable({
		data: [{ id: 1, name: "Test" }],
		columns: [
			{ id: "id", label: "ID", accessor: "id", width: "100px", minWidth: 50, maxWidth: 200 }
		],
		resizableColumns: true
	});
	
	expect(dataTable.getColumnWidth("id")).toBe("100px");
	dataTable.resizeColumn("id", 120);
	expect(dataTable.getColumnWidth("id")).toBe("120px");
});