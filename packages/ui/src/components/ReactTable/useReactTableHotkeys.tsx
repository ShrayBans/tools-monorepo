import { useState } from "react"
import { filter, isEmpty, map } from "lodash-es"
import { useHotkeys } from "react-hotkeys-hook"

interface ReactTableHotkeysProps {
  highlightedRowIndex: number
  setHighlightedRowIndex: any
  rowSelection: any
  setRowSelection: any
  totalLocalRows: number
  totalRows?: number
}

export const useReactTableHotkeys = ({
  highlightedRowIndex,
  setHighlightedRowIndex,
  rowSelection,
  setRowSelection,
  // totalRows,
  totalLocalRows,
}: ReactTableHotkeysProps) => {
  const [selectedPivot, setSelectedPivot] = useState<number>(-1)

  useHotkeys("esc", () => {
    if (isEmpty(rowSelection)) {
      setHighlightedRowIndex(0)
    } else {
      setRowSelection({})
      setSelectedPivot(-1)
    }
    // setRowSelection((old) => {
    //   return {
    //     ...old,
    //     [highlightedRowIndex]: true,
    //     [highlightedRowIndex + 1]: true,
    //   };
    // });
  })
  useHotkeys("ArrowDown", (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
    setHighlightedRowIndex(Math.min(highlightedRowIndex + 1, totalLocalRows))
  })
  useHotkeys("j", (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
    setHighlightedRowIndex(Math.min(highlightedRowIndex + 1, totalLocalRows))
  })
  useHotkeys(
    "Shift+ArrowDown",
    (e) => {
      e.preventDefault()

      if (isEmpty(rowSelection)) {
        setSelectedPivot(highlightedRowIndex)
        setRowSelection((old) => {
          return {
            ...old,
            [highlightedRowIndex]: true,
            [highlightedRowIndex + 1]: true,
          }
        })
      } else {
        if (selectedPivot === -1) {
          setSelectedPivot(highlightedRowIndex)
        }
        setRowSelection((old) => {
          const truthyKeys: any[] = filter(
            map(old, (value, key) => {
              const numberKey = Number(key)
              return !!value && !Number.isNaN(numberKey) && numberKey
            }),
            (a) => {
              return !!a
            },
          )
          const lowestKey = Math.max(Math.min(...truthyKeys), 0)
          const highestKey = Math.max(...truthyKeys) || highlightedRowIndex
          setHighlightedRowIndex(Math.min(highlightedRowIndex + 1, totalLocalRows))
          // if (highestKey > highlightedRowIndex) {
          //   setHighlightedRowIndex(highestKey + 1);
          // } else {
          //   setHighlightedRowIndex(
          //     Math.min(highlightedRowIndex + 1, totalLocalRows),
          //   );
          // }

          // If highlightedRowIndex > selectedPivot, then add otherwise subtract
          if (highlightedRowIndex >= selectedPivot) {
            if (highestKey > highlightedRowIndex) {
              setHighlightedRowIndex(highestKey + 1)
            }
            return {
              ...old,
              [highestKey + 1]: true,
            }
          }
          return {
            ...old,
            [lowestKey]: false,
          }
        })
      }
    },
    {},
    [highlightedRowIndex, selectedPivot],
  )
  useHotkeys("k", (e) => {
    e.preventDefault()
    e.stopPropagation()

    setHighlightedRowIndex(Math.max(highlightedRowIndex - 1, 0))
  })
  useHotkeys("ArrowUp", (e) => {
    e.preventDefault()
    e.stopPropagation()

    setHighlightedRowIndex(Math.max(highlightedRowIndex - 1, 0))
  })
  useHotkeys(
    "Shift+ArrowUp",
    (e) => {
      e.preventDefault()

      if (isEmpty(rowSelection)) {
        setSelectedPivot(highlightedRowIndex)
        setRowSelection((old) => {
          return {
            ...old,
            [highlightedRowIndex]: true,
            [highlightedRowIndex - 1]: true,
          }
        })
      } else {
        if (selectedPivot === -1) {
          setSelectedPivot(highlightedRowIndex)
        }
        setRowSelection((old) => {
          const truthyKeys: any[] = filter(
            map(old, (value, key) => {
              const numberKey = Number(key)
              return !!value && !Number.isNaN(numberKey) && numberKey
            }),
            (a) => {
              return !!a
            },
          )
          const lowestKey = Math.max(Math.min(...truthyKeys), 0)
          const highestKey = Math.max(...truthyKeys) || highlightedRowIndex
          // if (lowestKey < highlightedRowIndex) {
          //   setHighlightedRowIndex(lowestKey - 1);
          // } else {
          //   setHighlightedRowIndex(Math.max(highlightedRowIndex - 1, 0));
          // }
          setHighlightedRowIndex(Math.max(highlightedRowIndex - 1, 0))

          if (highlightedRowIndex <= selectedPivot) {
            if (lowestKey < highlightedRowIndex) {
              setHighlightedRowIndex(lowestKey - 1)
            }
            return {
              ...old,
              [lowestKey - 1]: true,
            }
          }
          return {
            ...old,
            [highestKey]: undefined,
          }
        })
      }
    },
    {},
    [highlightedRowIndex, selectedPivot],
  )
  return <></>
}
