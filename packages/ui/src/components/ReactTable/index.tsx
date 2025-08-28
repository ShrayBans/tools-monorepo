import { createRef, forwardRef, useEffect, useRef, useState } from "react"
import type { SortingState } from "@tanstack/react-table"
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  getPaginationRowModel,
} from "@tanstack/react-table"
import { map, size } from "lodash-es"

import { Button, cn, Loader } from "../../.."
import { useReactTableHotkeys } from "./useReactTableHotkeys"

// import { useRowSelect, useSortBy, useTable } from "react-table";

export interface ReactTablePropsColumns {
  /** Column header */
  Header: string
  /** Column key in the data */
  accessor: string

  Cell?: any
}

export interface ReactTableColumnInput {
  Header: string | ((props: any) => any)
  accessor: string
  Cell?: (info) => any
}

export interface ReactTableProps<T> {
  /** ID for the table component */
  id?: string
  /** CSS class names */
  className?: string
  /** CSS styles */
  // @ts-ignore
  css?: CSS
  /** Column definition */
  columns: ReactTableColumnInput[]
  /** Data for the table */
  data: any[]
  /** Enables client-side sorting */
  enableSorting?: boolean
  enableServersideSorting?: boolean
  /** Enables row selection */
  enableRowSelect?: boolean
  /** Enables row numbering */
  enableRowNumbering?: boolean
  /** Enables superhuman highlighting */
  enableHighlighting?: boolean
  /** Enables pagination */
  enablePagination?: boolean
  /** Callback function for row updates */
  updateRowCallback?: ({
    highlightedRowIndex,
    rowSelection,
    sorting,
  }: {
    highlightedRowIndex: number
    rowSelection: any
    sorting?: any
  }) => void
  /** Global table cell actions */
  globalTdActions?: ((key: string) => void)[]
  /** Initial state of the table */
  initialState?: any
  onRowClick?: (row: T, e: any) => void
  onRowDoubleClick?: (row: T, e: any) => void
  loading?: boolean
  emptyState?: React.ReactNode
  headerCellClassName?: string
  cellClassName?: string
}

/**
   * Adds functionality to all td cells
   *
   * const globalTdActions = {
        onDoubleClick: (e) => {
          navigator.clipboard.writeText(e?.target?.innerText)
          showToast(
            `Copied text to clipboard: ${e?.target?.innerText}`,
            'default',
            globalDispatch
          )
        },
      }
   */

/**
 * Example:
 * How to format data for the table
 *
 const formattedWorldAssets = useMemo(
    () =>
      map(worldAssets, (worldAsset) => {
        return {
          id: worldAsset?.id,
          name: worldAsset?.name,
          path: worldAsset?.misc?.path,
          artistName: worldAsset?.artistBrand?.displayName || '-',
          assetType: worldAsset?.assetType,
        }
      }) || [],
    [worldAssets]
  )
 */

/**
 * Example:
 * How to add columns to the table
 *
 *  const columns = useMemo(
    () => [
      {
        Header: 'ID',
        accessor: 'id', // accessor is the "key" in the data
      },
      {
        Header: 'Name',
        accessor: 'name',
      },
      []
      )
 */

/**
 * Example:
 * When you want to add a dynamic type of Cell
 *
 * {
  Header: 'Delete Asset',
  Cell: ({ row: { original } }) => {
    return (
      <Button
        onClick={() => {
          setAssetToDelete(original)
        }}
      >
        Delete
      </Button>
    )
  },
}
 */

/**
 * Example:
 * When you want to add a dynamic type of Cell
 *
 * {
  Header: 'Delete Asset',
  Cell: ({ row: { original } }) => {
    return (
      <Button
        onClick={() => {
          setAssetToDelete(original)
        }}
      >
        Delete
      </Button>
    )
  },
}
 */

const IndeterminateCheckbox = forwardRef<HTMLInputElement, any>(({ indeterminate, ...rest }, ref: any) => {
  const defaultRef = useRef<any>()
  const resolvedRef = ref || defaultRef

  useEffect(() => {
    resolvedRef.current.indeterminate = indeterminate
  }, [resolvedRef, indeterminate])

  return (
    <>
      <input type="checkbox" ref={resolvedRef} {...rest} />
    </>
  )
})

/**
 * The main Table component.
 * @param {ReactTableProps} props - The props for the Table component.
 */
export const ReactTable = <T extends ReactTableProps<T>>({
  // id = "tablev2",
  className = "",
  columns,
  data = [],
  onRowClick = (_row, _e) => {},
  enableSorting = false,
  enableServersideSorting = false,
  enableRowSelect = false,
  enableRowNumbering = false,
  enablePagination = false,
  updateRowCallback = () => {},
  initialState = {
    // sortBy: [{id: 'name', desc: false}]
  },
  loading,
  emptyState,
  headerCellClassName,
  cellClassName,
}: ReactTableProps<T>) => {
  const columnHelper = createColumnHelper<any>()

  const columnsFormatted = map(columns, (column: ReactTableColumnInput) => {
    return columnHelper.accessor(column.accessor, {
      header: typeof column.Header === 'string' ? () => column.Header : column.Header,
      cell: column.Cell ? column.Cell : (info) => info.getValue(),
    })
  })

  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [highlightedRowIndex, setHighlightedRowIndex] = useState<number>(-1)
  const [pagination, setPagination] = useState({
    pageIndex: 0, //initial page index
    pageSize: 100, //default page size
  })

  useReactTableHotkeys({
    highlightedRowIndex,
    setHighlightedRowIndex,
    totalLocalRows: size(data),
    rowSelection,
    setRowSelection,
  })

  const table = useReactTable({
    columns: [
      ...(enableRowSelect
        ? [
            {
              id: "select",
              header: ({ table }) => (
                <IndeterminateCheckbox
                  {...{
                    checked: table.getIsAllRowsSelected(),
                    indeterminate: table.getIsSomeRowsSelected(),
                    onChange: table.getToggleAllRowsSelectedHandler(),
                  }}
                />
              ),
              cell: ({ row }) => (
                <div className="px-1">
                  <IndeterminateCheckbox
                    {...{
                      checked: row.getIsSelected(),
                      disabled: !row.getCanSelect(),
                      indeterminate: row.getIsSomeSelected(),
                      onChange: row.getToggleSelectedHandler(),
                    }}
                  />
                </div>
              ),
            },
          ]
        : []),
      ...(enableRowNumbering
        ? [
            {
              id: "number",
              header: () => "Number",
              cell: ({ row }) => {
                return <div className="max-w-xs w-8">{row.index + 1}</div>
              },
            },
          ]
        : []),
      ...columnsFormatted,
    ],
    data,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    onPaginationChange: enablePagination ? setPagination : undefined,
    getSortedRowModel: getSortedRowModel(),
    enableSorting,
    manualSorting: enableServersideSorting,
    state: {
      rowSelection,
      sorting,
      pagination: enablePagination ? pagination : undefined,
    },
    initialState: {
      // pagination,
      ...initialState,
    },
    onSortingChange: setSorting,
    enableRowSelection: enableRowSelect, //enable row selection for all rows
    onRowSelectionChange: (e) => {
      setRowSelection(e)
    },
  })

  useEffect(() => {
    updateRowCallback({ highlightedRowIndex, rowSelection, sorting })
  }, [highlightedRowIndex, rowSelection, sorting])

  const rowRefs = useRef<any[]>([])

  useEffect(() => {
    // Reset the refs array to match the number of rows
    rowRefs.current = data.map((_, i) => rowRefs.current[i] || createRef())
  }, [data])

  useEffect(() => {
    if (highlightedRowIndex >= 0 && highlightedRowIndex < rowRefs.current.length) {
      const selectedRowRef = rowRefs.current[highlightedRowIndex]

      if (selectedRowRef.current) {
        selectedRowRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center", // Adjust as needed
        })
      }
    }
  }, [highlightedRowIndex])

  if (loading && size(data) === 0) {
    return (
      <div
        className={cn(
          "mb-12 flex flex-col px-6 py-8 pt-2",
          "sm:py-8",
          "md:px-10 md:py-12",
          "h-full w-full items-center justify-center",
        )}
      >
        <Loader />
      </div>
    )
  }

  if (size(data) === 0) {
    return (
      <div
        className={cn(
          "mb-12 flex flex-col px-6 py-8 pt-2",
          "sm:py-8",
          "md:px-10 md:py-12",
          "h-full w-full items-center justify-center",
        )}
      >
        {emptyState}
      </div>
    )
  }

  const _headerGroups = table.getHeaderGroups()

  return (
    <>
      <div className={cn("w-full", className)}>
        <table className="min-w-full text-left text-sm font-light">
          <thead className="border-b font-medium dark:border-neutral-500">
            {table.getHeaderGroups().map((headerGroup) => {
              return (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <th key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder ? null : (
                          <div
                            className={cn("px-6 py-3", headerCellClassName, {
                              "cursor-pointer select-none": header.column.getCanSort(),
                            })}
                            onClick={header.column.getToggleSortingHandler()}
                            title={
                              header.column.getCanSort()
                                ? header.column.getNextSortingOrder() === "asc"
                                  ? "Sort ascending"
                                  : header.column.getNextSortingOrder() === "desc"
                                    ? "Sort descending"
                                    : "Clear sort"
                                : undefined
                            }
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: " 🔼",
                              desc: " 🔽",
                            }[header.column.getIsSorted() as string] ?? null}
                          </div>
                        )}
                      </th>
                    )
                  })}
                </tr>
              )
            })}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row, i) => {
              return (
                <tr
                  ref={rowRefs.current[i]}
                  onClick={(e) => {
                    setHighlightedRowIndex(i)
                    onRowClick(row.original, e)
                  }}
                  className={`cursor-pointer border-b transition duration-300 ease-in-out ${
                    highlightedRowIndex === i ? "bg-accent" : "hover:bg-accent"
                  }`}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td className={cn("px-6 py-3 font-normal", cellClassName)} key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>

          {/* <tfoot>
            {table.getFooterGroups().map((footerGroup) => (
              <tr
                className="border-b dark:border-neutral-500"
                key={footerGroup.id}
              >
                {footerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.footer,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </tfoot> */}
          {enablePagination && (
            <div className="flex items-center gap-2">
              <Button
                className={"whitespace-nowrap"}
                variant={"ghost"}
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                {"< Prev"}
              </Button>
              <div className="mx-4">{table.getState().pagination.pageIndex}</div>
              <Button
                className={"whitespace-nowrap"}
                variant={"ghost"}
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                {"Next >"}
              </Button>

              <select
                className="mx-4"
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value))
                }}
              >
                {[25, 50, 100, 250, 1000].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
            </div>
          )}
        </table>
      </div>
    </>
  )
}

export default ReactTable
