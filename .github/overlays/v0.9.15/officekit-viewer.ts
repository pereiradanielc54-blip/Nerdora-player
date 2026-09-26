import { fromArrayBuffer, loadWorkbook } from '@office-kit/xlsx/io';
import { isFormulaValue } from '@office-kit/xlsx/cell';
import {
  borderToCss,
  fillToCss,
  fontToCss,
  getCellAlignment,
  getCellBorder,
  getCellDisplayText,
  getCellFill,
  getCellFont,
} from '@office-kit/xlsx/styles';
import { iterWorksheets } from '@office-kit/xlsx/workbook';
import {
  getCellExtent,
  getColumnDimension,
  getMergedCells,
  getRowDimension,
  type Worksheet,
} from '@office-kit/xlsx/worksheet';
import type { Workbook } from '@office-kit/xlsx/workbook';
import type { Cell } from '@office-kit/xlsx/cell';

declare global {
  interface Window {
    NerdoraXlsx: {
      onRendered(sheetCount: number): void;
      onError(message: string): void;
    };
  }
}

const DEFAULT_COL_WIDTH = 8.43;
const DEFAULT_ROW_HEIGHT_PT = 15;
const MAX_ROWS = 5000;
const MAX_COLS = 300;

type Bounds = { minRow: number; maxRow: number; minCol: number; maxCol: number };
type Merge = { minRow: number; maxRow: number; minCol: number; maxCol: number };

let workbook: Workbook | undefined;
let sheets: Worksheet[] = [];
let activeSheetIndex = 0;
let currentStage: { wrapper: HTMLElement; stage: HTMLElement; width: number; height: number } | undefined;

const byId = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error('Elemento ausente no visualizador: ' + id);
  return el as T;
};

function columnWidthPx(width: number | undefined): number {
  const w = Number.isFinite(width) && (width as number) > 0 ? (width as number) : DEFAULT_COL_WIDTH;
  return Math.max(1, Math.round(w * 7 + 5));
}

function rowHeightPx(height: number | undefined): number {
  const h = Number.isFinite(height) && (height as number) > 0 ? (height as number) : DEFAULT_ROW_HEIGHT_PT;
  return Math.max(1, Math.round(h * 96 / 72));
}

function unionBounds(a: Bounds | undefined, b: Bounds | undefined): Bounds | undefined {
  if (!a) return b ? { ...b } : undefined;
  if (!b) return { ...a };
  return {
    minRow: Math.min(a.minRow, b.minRow),
    maxRow: Math.max(a.maxRow, b.maxRow),
    minCol: Math.min(a.minCol, b.minCol),
    maxCol: Math.max(a.maxCol, b.maxCol),
  };
}

function computeBounds(ws: Worksheet): Bounds | undefined {
  let bounds = getCellExtent(ws);
  for (const m of getMergedCells(ws)) {
    bounds = unionBounds(bounds, {
      minRow: m.minRow,
      maxRow: m.maxRow,
      minCol: m.minCol,
      maxCol: m.maxCol,
    });
  }
  if (!bounds) return undefined;
  return {
    minRow: Math.max(1, Math.min(MAX_ROWS, bounds.minRow)),
    maxRow: Math.max(1, Math.min(MAX_ROWS, bounds.maxRow)),
    minCol: Math.max(1, Math.min(MAX_COLS, bounds.minCol)),
    maxCol: Math.max(1, Math.min(MAX_COLS, bounds.maxCol)),
  };
}

function buildGeometry(ws: Worksheet, b: Bounds) {
  const colWidths: number[] = [];
  const rowHeights: number[] = [];
  let width = 0;
  let height = 0;

  for (let c = b.minCol; c <= b.maxCol; c++) {
    const dim = getColumnDimension(ws, c);
    const px = dim?.hidden ? 0 : columnWidthPx(dim?.width ?? ws.defaultColumnWidth);
    colWidths.push(px);
    width += px;
  }

  for (let r = b.minRow; r <= b.maxRow; r++) {
    const dim = getRowDimension(ws, r);
    const px = dim?.hidden ? 0 : rowHeightPx(dim?.height ?? ws.defaultRowHeight);
    rowHeights.push(px);
    height += px;
  }

  return { colWidths, rowHeights, width: Math.max(1, width), height: Math.max(1, height) };
}

function buildMergeMaps(ws: Worksheet) {
  const origins = new Map<string, Merge>();
  const covered = new Set<string>();

  for (const m of getMergedCells(ws)) {
    const merge = { minRow: m.minRow, maxRow: m.maxRow, minCol: m.minCol, maxCol: m.maxCol };
    origins.set(m.minRow + '_' + m.minCol, merge);
    const cells = (m.maxRow - m.minRow + 1) * (m.maxCol - m.minCol + 1);
    if (cells > 20000) continue;
    for (let r = m.minRow; r <= m.maxRow; r++) {
      for (let c = m.minCol; c <= m.maxCol; c++) {
        if (r !== m.minRow || c !== m.minCol) covered.add(r + '_' + c);
      }
    }
  }

  return { origins, covered };
}

function applyCss(el: HTMLElement, rules: Record<string, string>) {
  for (const [k, v] of Object.entries(rules)) el.style.setProperty(k, v);
}

function effectiveValue(cell: Cell) {
  const value = cell.value;
  return isFormulaValue(value) ? value.cachedValue : value;
}

function applyAlignment(el: HTMLElement, cell: Cell) {
  if (!workbook) return;
  const alignment = getCellAlignment(workbook, cell);
  const value = effectiveValue(cell);

  switch (alignment.horizontal) {
    case 'center':
    case 'centerContinuous':
      el.style.justifyContent = 'center';
      el.style.textAlign = 'center';
      break;
    case 'right':
      el.style.justifyContent = 'flex-end';
      el.style.textAlign = 'right';
      break;
    case 'left':
      el.style.justifyContent = 'flex-start';
      el.style.textAlign = 'left';
      break;
    default:
      if (typeof value === 'number' || value instanceof Date) {
        el.style.justifyContent = 'flex-end';
        el.style.textAlign = 'right';
      } else {
        el.style.justifyContent = 'flex-start';
        el.style.textAlign = 'left';
      }
  }

  switch (alignment.vertical) {
    case 'top':
      el.style.alignItems = 'flex-start';
      break;
    case 'bottom':
      el.style.alignItems = 'flex-end';
      break;
    default:
      el.style.alignItems = 'center';
  }

  if (alignment.wrapText) {
    el.classList.add('wrap');
  }

  if (alignment.textRotation === 255) {
    el.classList.add('vertical-text');
  } else if (typeof alignment.textRotation === 'number' && alignment.textRotation !== 0) {
    const content = el.firstElementChild as HTMLElement | null;
    if (content) {
      content.style.transform = 'rotate(' + (-alignment.textRotation) + 'deg)';
      content.style.transformOrigin = 'center center';
    }
  }
}

function renderCell(stage: HTMLElement, ws: Worksheet, cell: Cell, b: Bounds, merge?: Merge) {
  if (!workbook) return;
  if (cell.row < b.minRow || cell.row > b.maxRow || cell.col < b.minCol || cell.col > b.maxCol) return;

  const el = document.createElement('div');
  el.className = 'cell';

  const colStart = cell.col - b.minCol + 1;
  const rowStart = cell.row - b.minRow + 1;
  const colSpan = merge ? merge.maxCol - merge.minCol + 1 : 1;
  const rowSpan = merge ? merge.maxRow - merge.minRow + 1 : 1;

  el.style.gridColumn = colStart + ' / span ' + colSpan;
  el.style.gridRow = rowStart + ' / span ' + rowSpan;

  applyCss(el, fillToCss(getCellFill(workbook, cell)));
  applyCss(el, borderToCss(getCellBorder(workbook, cell)));
  applyCss(el, fontToCss(getCellFont(workbook, cell)));

  const content = document.createElement('div');
  content.className = 'cell-content';
  content.textContent = getCellDisplayText(workbook, cell);
  el.appendChild(content);

  applyAlignment(el, cell);
  stage.appendChild(el);
}

function applyFitToWidth() {
  if (!currentStage) return;
  const viewport = byId<HTMLDivElement>('viewport');
  const available = Math.max(120, viewport.clientWidth - 20);
  const scale = Math.max(0.1, Math.min(1, available / currentStage.width));

  currentStage.stage.style.transform = 'scale(' + scale + ')';
  currentStage.wrapper.style.width = Math.max(1, currentStage.width * scale) + 'px';
  currentStage.wrapper.style.height = Math.max(1, currentStage.height * scale) + 'px';
}

function renderSheet(ws: Worksheet) {
  const host = byId<HTMLDivElement>('sheetHost');
  const empty = byId<HTMLDivElement>('empty');
  host.replaceChildren();
  empty.style.display = 'none';
  currentStage = undefined;

  const b = computeBounds(ws);
  if (!b) {
    empty.style.display = 'block';
    return;
  }

  const geometry = buildGeometry(ws, b);
  const merges = buildMergeMaps(ws);

  const wrapper = document.createElement('div');
  wrapper.className = 'sheet-wrapper';

  const stage = document.createElement('div');
  stage.className = 'sheet-stage';
  stage.style.width = geometry.width + 'px';
  stage.style.height = geometry.height + 'px';
  stage.style.gridTemplateColumns = geometry.colWidths.map(v => v + 'px').join(' ');
  stage.style.gridTemplateRows = geometry.rowHeights.map(v => v + 'px').join(' ');

  const cells: Cell[] = [];
  for (const [rowIndex, rowMap] of ws.rows) {
    if (rowIndex < b.minRow || rowIndex > b.maxRow) continue;
    for (const [colIndex, cell] of rowMap) {
      if (colIndex < b.minCol || colIndex > b.maxCol) continue;
      cells.push(cell);
    }
  }
  cells.sort((a, z) => (a.row - z.row) || (a.col - z.col));

  const rendered = new Set<string>();

  for (const cell of cells) {
    const key = cell.row + '_' + cell.col;
    if (merges.covered.has(key)) continue;
    const merge = merges.origins.get(key);
    renderCell(stage, ws, cell, b, merge);
    rendered.add(key);
  }

  // A merged range can exist even when its anchor was not materialized.
  for (const [key, merge] of merges.origins) {
    if (rendered.has(key)) continue;
    const rowMap = ws.rows.get(merge.minRow);
    const cell = rowMap?.get(merge.minCol);
    if (cell) renderCell(stage, ws, cell, b, merge);
  }

  wrapper.appendChild(stage);
  host.appendChild(wrapper);

  currentStage = { wrapper, stage, width: geometry.width, height: geometry.height };

  requestAnimationFrame(() => {
    applyFitToWidth();
    const viewport = byId<HTMLDivElement>('viewport');
    viewport.scrollTop = 0;
    viewport.scrollLeft = 0;
  });
}

function renderTabs() {
  const tabs = byId<HTMLDivElement>('tabs');
  tabs.replaceChildren();

  const hasTabs = sheets.length > 1;
  document.body.classList.toggle('has-tabs', hasTabs);

  if (!hasTabs) {
    tabs.classList.remove('visible');
    return;
  }

  tabs.classList.add('visible');

  sheets.forEach((ws, index) => {
    const button = document.createElement('button');
    button.className = 'tab' + (index === activeSheetIndex ? ' active' : '');
    button.type = 'button';
    button.textContent = ws.title || ('Aba ' + (index + 1));
    button.addEventListener('click', () => {
      activeSheetIndex = index;
      renderTabs();
      renderSheet(sheets[index]!);
    });
    tabs.appendChild(button);
  });
}

export async function renderXlsx(bytes: Uint8Array): Promise<void> {
  try {
    workbook = await loadWorkbook(fromArrayBuffer(bytes));
    sheets = [...iterWorksheets(workbook)];

    if (!sheets.length) throw new Error('Nenhuma aba de planilha foi encontrada no XLSX.');

    activeSheetIndex = 0;
    renderTabs();
    renderSheet(sheets[0]!);
    window.NerdoraXlsx.onRendered(sheets.length);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : String(error);
    window.NerdoraXlsx.onError(message || 'Não foi possível abrir o XLSX.');
  }
}

let resizeTimer: number | undefined;
window.addEventListener('resize', () => {
  if (resizeTimer !== undefined) window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(applyFitToWidth, 100);
});
