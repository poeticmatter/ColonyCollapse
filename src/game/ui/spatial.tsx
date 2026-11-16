import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { CellKey } from '../board/geometry'

/**
 * What the turn controls want the board to show: which hexes can be clicked,
 * which are already picked, and which would be affected. The turn panel registers one while
 * it is on screen; the board reads it.
 */
export interface SpatialSelection {
  clickableCells: ReadonlySet<CellKey>
  selectedCells: ReadonlySet<CellKey>
  /** Hexes shown as "would be rallied" but not clickable. */
  previewCells: ReadonlySet<CellKey>
  onCellClick?: (cell: CellKey) => void
}

const EMPTY_CELLS: ReadonlySet<CellKey> = new Set()

export const NO_SELECTION: SpatialSelection = {
  clickableCells: EMPTY_CELLS,
  selectedCells: EMPTY_CELLS,
  previewCells: EMPTY_CELLS,
}

/** A selection with only the parts the caller cares about. */
export function spatialSelection(parts: Partial<SpatialSelection>): SpatialSelection {
  return { ...NO_SELECTION, ...parts }
}

const SelectionContext = createContext<SpatialSelection>(NO_SELECTION)
const RegisterContext = createContext<(selection: SpatialSelection) => void>(() => undefined)

export function SpatialSelectionProvider({ children }: { children: ReactNode }) {
  const [selection, setSelection] = useState<SpatialSelection>(NO_SELECTION)
  return (
    <RegisterContext.Provider value={setSelection}>
      <SelectionContext.Provider value={selection}>{children}</SelectionContext.Provider>
    </RegisterContext.Provider>
  )
}

/** What the board should currently draw and listen for. */
export function useSpatialSelection(): SpatialSelection {
  return useContext(SelectionContext)
}

/**
 * Shows `selection` on the board while the calling component is mounted. Memoise `selection`
 * with useMemo so it only changes when the choice does.
 */
export function useRegisterSpatialSelection(selection: SpatialSelection): void {
  const register = useContext(RegisterContext)
  useEffect(() => {
    register(selection)
    return () => register(NO_SELECTION)
  }, [register, selection])
}
