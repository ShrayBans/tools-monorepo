import { useState, useEffect } from "react"
import Papa from "papaparse"
import CSVInput from "./CSVInput"
import ReactTable from "../components/ReactTable"
import { map } from "lodash-es"

interface CSVPreviewProps {
  data: any[]
  setData: (data: any[]) => void
  columns: any[]
  setColumns: (columns: any[]) => void
  setFile: (file: any) => void
}

export const CSVPreview = ({ data, setData, setFile, columns, setColumns }: CSVPreviewProps) => {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (data.length && columns.length) setLoading(false)
  }, [data, columns])

  const handleFileChange = (file) => {
    setFile(file)
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: handleDataChange,
    })
  }

  const makeColumns = (rawColumns) => {
    return map(rawColumns, (column) => {
      return {
        Header: column,
        accessor: column,
        Cell: ({ row }) => {
          return String(row.original[column])
        },
      }
    })
  }

  const handleDataChange = (file) => {
    setData(file.data)
    setColumns(makeColumns(file.meta.fields))
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* @ts-ignore */}
      <CSVInput handleFileChange={handleFileChange} data={data} />
      {!loading && (
        <ReactTable enablePagination enableRowNumbering data={data} columns={columns} className="-striped -highlight" />
      )}
    </div>
  )
}
