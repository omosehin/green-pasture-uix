"use client";

import * as React from "react";
import {
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Rows2,
  Rows3,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { StateFeedback } from "@/components/shared/state-feedback";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { displayTotal, firstSerialNumber } from "@/_utils/dataTablePagination";

// Ported from ogaryde-admin-ui/src/components/shared/data-table.tsx (toolbar,
// sortable headers, column-visibility dropdown, density toggle, refresh
// button, StateFeedback error/empty states, pagination footer), plus two
// things green-pasture's admin pages depend on that ogaryde's table doesn't
// have: the `showSN` serial-number column and declarative `filters: FilterDef[]`
// with clearable chips (src/_UI/DataTable.tsx's old API).

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    /** Header + cell text alignment. Defaults to left. */
    align?: "left" | "center" | "right";
    /** Fixed column width (CSS value), applied to both header and cell. */
    width?: string;
    /** Max width; pairs with truncate for single-line ellipsis. */
    maxWidth?: string;
    /** Force single-line ellipsis truncation even without maxWidth. */
    truncate?: boolean;
  }
}

/** Declarative filter: rendered as a <Select> in the filter popover, plus a clearable chip when active. */
export interface FilterDef {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface DataTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  /** Server pagination props (used when manualPagination, the default). */
  pageCount?: number;
  pageIndex?: number;
  pageSize?: number;
  onPageChange?: (pageIndex: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  manualPagination?: boolean;
  /** Total row count for the footer's "N of Total" text. Defensively clamped to at least data.length. */
  totalItems?: number;
  /** Server sorting: when true, header clicks emit onSortingChange; the page owns sorting. */
  manualSorting?: boolean;
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  /** Server search: when true, the toolbar search is controlled by the page. */
  manualFiltering?: boolean;
  globalFilter?: string;
  onGlobalFilterChange?: (value: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  /** Re-fetch handler; renders a refresh icon in the toolbar when provided. */
  onRefresh?: () => void;
  /** When true, disables the refresh button and spins its icon. */
  refreshing?: boolean;
  /** Inline toolbar controls/actions (rendered next to search). */
  toolbar?: React.ReactNode;
  /** Declarative filters, rendered behind a funnel icon with clearable chips. */
  filters?: FilterDef[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  /** Optional secondary line under the empty-state title. */
  emptyDescription?: string;
  /** Optional call-to-action shown in the empty state (e.g. "Add your first product"). */
  emptyAction?: { label: string; onClick?: () => void; href?: string };
  getRowId?: (row: T) => string;
  onRowClick?: (row: T) => void;
  testId?: string;
  /** Serial-number column, prepended to `columns`. Defaults to true. */
  showSN?: boolean;
  /** Created/Modified By & At columns, inserted before a trailing "actions" column (or appended if there is none). Defaults to true — every admin table gets audit columns for free. */
  showAuditColumns?: boolean;
}

function formatAuditDate(value: unknown): string {
  if (!value) return "—";
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const DEFAULT_PAGE_SIZES = [10, 15, 20, 50];

function FilterChip({ label, value, onClear }: { label: string; value: string; onClear: () => void }) {
  return (
    <span className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium">
      {label}: {value}
      <button type="button" onClick={onClear} className="hover:opacity-70" aria-label={`Clear ${label} filter`}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

export function DataTable<T>({
  columns,
  data,
  pageCount,
  pageIndex,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  manualPagination = true,
  totalItems,
  manualSorting = false,
  sorting: sortingProp,
  onSortingChange,
  manualFiltering = false,
  globalFilter: globalFilterProp,
  onGlobalFilterChange,
  isLoading = false,
  isError = false,
  onRetry,
  onRefresh,
  refreshing = false,
  toolbar,
  filters,
  filterValues = {},
  onFilterChange,
  searchPlaceholder = "Search…",
  emptyMessage = "No results.",
  emptyDescription,
  emptyAction,
  getRowId,
  onRowClick,
  testId = "data-table",
  showSN = true,
  showAuditColumns = true,
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>(sortingProp ?? []);
  const [globalFilter, setGlobalFilter] = React.useState(globalFilterProp ?? "");
  // Decoupled from `globalFilter` so keystrokes render instantly while the
  // (often server-bound) onGlobalFilterChange only fires after a pause —
  // same debounce the old _UI/DataTable.tsx search box had.
  const [searchInput, setSearchInput] = React.useState(globalFilterProp ?? "");
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [compact, setCompact] = React.useState(false);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: pageSize ?? pageSizeOptions[0],
  });

  React.useEffect(() => {
    if (sortingProp) setSorting(sortingProp);
  }, [sortingProp]);
  React.useEffect(() => {
    if (globalFilterProp !== undefined) setGlobalFilter(globalFilterProp);
  }, [globalFilterProp]);

  const onGlobalFilterChangeRef = React.useRef(onGlobalFilterChange);
  React.useEffect(() => {
    onGlobalFilterChangeRef.current = onGlobalFilterChange;
  });

  // Debounced search — only resets the timer when the user types, not on
  // parent re-renders.
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setGlobalFilter(searchInput);
      onGlobalFilterChangeRef.current?.(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function handleSortingChange(
    updater: SortingState | ((old: SortingState) => SortingState),
  ) {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    setSorting(next);
    onSortingChange?.(next);
  }

  // S/N is derived purely from the page offset — never from totalItems — so a
  // stale/zero totalItems from the API can never surface as a row numbered 0.
  // See src/_utils/dataTablePagination.ts for the root-cause writeup.
  const snPageIndex = manualPagination ? pageIndex ?? 0 : pagination.pageIndex;
  const snPageSize = manualPagination ? pageSize ?? pageSizeOptions[0] : pagination.pageSize;
  const snStart = firstSerialNumber(snPageIndex, snPageSize);

  const tableColumns = React.useMemo<ColumnDef<T, any>[]>(() => {
    let cols = columns;

    if (showAuditColumns) {
      const auditColumns: ColumnDef<T, any>[] = [
        {
          id: "__createdBy",
          header: "Created By",
          enableSorting: false,
          meta: { width: "140px" },
          cell: ({ row }) => (row.original as any)?.createdBy || "—",
        },
        {
          id: "__createdAt",
          header: "Created At",
          enableSorting: false,
          meta: { width: "120px" },
          cell: ({ row }) => formatAuditDate((row.original as any)?.createdAt),
        },
        {
          id: "__updatedBy",
          header: "Modified By",
          enableSorting: false,
          meta: { width: "140px" },
          cell: ({ row }) => (row.original as any)?.updatedBy || "—",
        },
        {
          id: "__updatedAt",
          header: "Modified At",
          enableSorting: false,
          meta: { width: "120px" },
          cell: ({ row }) => formatAuditDate((row.original as any)?.updatedAt),
        },
      ];
      // Audit columns read as history, so they belong just before the row's
      // actions, not after — appending unconditionally would push every
      // page's action menu off to the right of columns nobody clicks.
      const actionsIndex = cols.findIndex((c) => c.id === "actions");
      cols = actionsIndex === -1
        ? [...cols, ...auditColumns]
        : [...cols.slice(0, actionsIndex), ...auditColumns, ...cols.slice(actionsIndex)];
    }

    if (!showSN) return cols;
    const snColumn: ColumnDef<T, any> = {
      id: "__sn",
      header: "S/N",
      enableSorting: false,
      enableHiding: false,
      meta: { align: "left", width: "56px" },
      // Manual (server) pagination: `data` is only the current page, so row.index
      // is already page-relative. Client pagination: row.index is the row's index
      // in the full pre-pagination dataset, i.e. already absolute — don't add snStart.
      cell: ({ row }) => (manualPagination ? snStart + row.index : row.index + 1),
    };
    return [snColumn, ...cols];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, showSN, showAuditColumns, snStart, manualPagination]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      ...(manualPagination ? {} : { pagination }),
    },
    onSortingChange: handleSortingChange,
    onGlobalFilterChange: (updater: string | ((old: string) => string)) =>
      setGlobalFilter(typeof updater === "function" ? updater(globalFilter) : updater),
    onColumnVisibilityChange: setColumnVisibility,
    ...(manualPagination
      ? {}
      : { onPaginationChange: setPagination, getPaginationRowModel: getPaginationRowModel() }),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination,
    manualSorting,
    manualFiltering,
    pageCount: manualPagination ? pageCount ?? 0 : undefined,
    enableSortingRemoval: false,
    sortDescFirst: false,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
  });

  const rows = table.getRowModel().rows;

  const effPageIndex = manualPagination ? pageIndex ?? 0 : table.getState().pagination.pageIndex;
  const effPageSize = manualPagination
    ? pageSize ?? pageSizeOptions[0]
    : table.getState().pagination.pageSize;
  const rawPageCount = manualPagination ? pageCount ?? 0 : table.getPageCount();
  // Defensive: a stale/zero pageCount from the API must not read as "page 1 of 0"
  // while rows are rendered on screen.
  const effPageCount = rows.length > 0 ? Math.max(rawPageCount, effPageIndex + 1) : rawPageCount;
  // Defensive: the footer's row count must never claim fewer rows than are visible.
  const effTotalItems = manualPagination
    ? displayTotal(totalItems, rows.length)
    : table.getFilteredRowModel().rows.length;

  const handlePrev = () =>
    manualPagination ? onPageChange?.(effPageIndex - 1) : table.previousPage();
  const handleNext = () =>
    manualPagination ? onPageChange?.(effPageIndex + 1) : table.nextPage();
  const handleSize = (n: number) =>
    manualPagination ? onPageSizeChange?.(n) : table.setPageSize(n);
  const prevDisabled = manualPagination ? effPageIndex <= 0 : !table.getCanPreviousPage();
  const nextDisabled = manualPagination
    ? effPageIndex >= effPageCount - 1
    : !table.getCanNextPage();

  const visibleColCount = table.getVisibleLeafColumns().length;
  const cellPad = compact ? "py-1.5" : "py-3";

  const activeFilterCount = Object.values(filterValues).filter((v) => v && v !== "").length;

  const alignClass = (align?: "left" | "center" | "right") =>
    align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";

  return (
    <div className="space-y-3" data-testid={testId}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-9 w-56 pl-8"
            data-testid={`${testId}-search`}
          />
        </div>
        {toolbar}
        <div className="ml-auto flex items-center gap-2">
          {onRefresh && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Refresh"
              data-testid={`${testId}-refresh`}
            >
              <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
            </Button>
          )}
          {filters && filters.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label="Filters"
                  data-testid={`${testId}-filter`}
                >
                  <Filter className="size-4" />
                  {activeFilterCount > 0 && (
                    <span className="bg-primary text-primary-foreground ml-1 flex size-4 items-center justify-center rounded-full text-[10px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 space-y-3">
                {filters.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <label className="text-muted-foreground text-xs font-medium">{f.label}</label>
                    <Select
                      value={filterValues[f.key] || "__all__"}
                      onValueChange={(v) => onFilterChange?.(f.key, v === "__all__" ? "" : v)}
                    >
                      <SelectTrigger className="h-9 w-full" data-testid={`${testId}-filter-${f.key}`}>
                        <SelectValue placeholder={f.label} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All</SelectItem>
                        {f.options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </PopoverContent>
            </Popover>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCompact((v) => !v)}
            aria-label="Toggle density"
            data-testid={`${testId}-density`}
          >
            {compact ? <Rows3 className="size-4" /> : <Rows2 className="size-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" data-testid={`${testId}-columns`}>
                <SlidersHorizontal className="size-4" /> Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllLeafColumns()
                .filter((c) => c.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    data-testid={`${testId}-column-${column.id}`}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {filters && activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(filterValues)
            .filter(([, v]) => v && v !== "")
            .map(([key, value]) => {
              const def = filters.find((f) => f.key === key);
              const optLabel = def?.options.find((o) => o.value === value)?.label ?? value;
              return (
                <FilterChip
                  key={key}
                  label={def?.label ?? key}
                  value={optLabel}
                  onClear={() => onFilterChange?.(key, "")}
                />
              );
            })}
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const meta = header.column.columnDef.meta;
                  return (
                    <TableHead
                      key={header.id}
                      className={alignClass(meta?.align)}
                      style={{ width: meta?.width, maxWidth: meta?.maxWidth }}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className="hover:text-foreground inline-flex items-center gap-1"
                          onClick={header.column.getToggleSortingHandler()}
                          data-testid={`${testId}-sort-${header.column.id}`}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {sorted === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="size-3.5" />
                          ) : (
                            <ArrowUpDown className="size-3.5 opacity-50" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isError ? (
              <TableRow>
                <TableCell colSpan={visibleColCount} className="h-32 text-center">
                  <StateFeedback
                    variant="error"
                    size="sm"
                    title="Couldn't load data."
                    action={onRetry ? { label: "Retry", onClick: onRetry } : undefined}
                    data-testid={`${testId}-error`}
                  />
                </TableCell>
              </TableRow>
            ) : isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: visibleColCount }).map((_, j) => (
                    <TableCell key={j} className={cellPad}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColCount} className="h-32 text-center">
                  <StateFeedback
                    variant="empty"
                    size="sm"
                    title={emptyMessage}
                    message={emptyDescription}
                    action={emptyAction}
                    data-testid={`${testId}-empty`}
                  />
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-testid={`${testId}-row-${getRowId ? getRowId(row.original) : row.id}`}
                  className={cn(onRowClick && "cursor-pointer")}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta;
                    const truncate = meta?.truncate || !!meta?.maxWidth;
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          cellPad,
                          alignClass(meta?.align),
                          truncate && "overflow-hidden text-ellipsis whitespace-nowrap",
                        )}
                        style={{ width: meta?.width, maxWidth: meta?.maxWidth }}
                        title={truncate ? String(cell.getValue() ?? "") : undefined}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isError && rows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm" data-testid={`${testId}-count`}>
              {rows.length} of {effTotalItems} row{effTotalItems === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Rows per page</span>
              <Select value={String(effPageSize)} onValueChange={(v) => handleSize(Number(v))}>
                <SelectTrigger className="h-8 w-[72px]" data-testid={`${testId}-page-size`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm" data-testid={`${testId}-page-indicator`}>
              Page {effPageCount === 0 ? 0 : effPageIndex + 1} of {effPageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={prevDisabled}
              data-testid={`${testId}-prev`}
            >
              <ChevronLeft className="size-4" /> Prev
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={nextDisabled}
              data-testid={`${testId}-next`}
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
