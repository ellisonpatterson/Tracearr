import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type PaginationState,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageSize?: number;
  onRowClick?: (row: TData) => void;
  emptyMessage?: string;
  className?: string;
  // Server-side pagination props
  pageCount?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 10,
  onRowClick,
  emptyMessage = 'No results found.',
  className,
  pageCount,
  page,
  onPageChange,
  isLoading,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: page ? page - 1 : 0,
    pageSize,
  });

  const isServerPaginated = pageCount !== undefined && onPageChange !== undefined;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: isServerPaginated ? undefined : getPaginationRowModel(),
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    manualPagination: isServerPaginated,
    pageCount: isServerPaginated ? pageCount : undefined,
    state: {
      sorting,
      pagination: isServerPaginated ? { pageIndex: (page ?? 1) - 1, pageSize } : pagination,
    },
  });

  const handlePageChange = (newPage: number) => {
    if (isServerPaginated && onPageChange) {
      onPageChange(newPage);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="rounded-md border">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn(
                          'flex items-center gap-2',
                          header.column.getCanSort() &&
                            'cursor-pointer select-none hover:text-foreground'
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {header.column.getCanSort() && (
                          <span className="ml-1">
                            {header.column.getIsSorted() === 'asc' ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronsUpDown className="h-4 w-4 opacity-50" />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 text-center text-muted-foreground"
                >
                  Loading...
                </td>
              </tr>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b transition-colors hover:bg-muted/50',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {(isServerPaginated ? page : pagination.pageIndex + 1) ?? 1} of{' '}
          {isServerPaginated ? pageCount : table.getPageCount()}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (isServerPaginated) {
                handlePageChange((page ?? 1) - 1);
              } else {
                table.previousPage();
              }
            }}
            disabled={
              isServerPaginated
                ? (page ?? 1) <= 1
                : !table.getCanPreviousPage()
            }
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (isServerPaginated) {
                handlePageChange((page ?? 1) + 1);
              } else {
                table.nextPage();
              }
            }}
            disabled={
              isServerPaginated
                ? (page ?? 1) >= (pageCount ?? 1)
                : !table.getCanNextPage()
            }
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
