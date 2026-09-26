import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Workbook } from "@fortune-sheet/react";
import { transformExcelToFortune } from "@corbe30/fortune-excel";

const MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const CHUNK_STRIDE = 32768;

function decodeBridgeFile() {
  const total = NerdoraXlsx.getChunkCount();
  const parts = new Array(total);
  for (let i = 0; i < total; i++) parts[i] = NerdoraXlsx.getChunk(i);

  const raw = atob(parts.join(""));
  const bytes = new Uint8Array(raw.length);
  for (let start = 0; start < raw.length; start += CHUNK_STRIDE) {
    const end = Math.min(start + CHUNK_STRIDE, raw.length);
    for (let i = start; i < end; i++) bytes[i] = raw.charCodeAt(i);
  }

  return new File([bytes], "Nerdora.xlsx", { type: MIME });
}

function decodeHtmlText(value) {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = String(value ?? "");
  return textarea.value;
}

function normalizeSheets(input) {
  const sheets = Array.isArray(input) ? input : [];
  return sheets.map((sheet, index) => ({
    ...sheet,
    name: decodeHtmlText(sheet?.name || ("Aba " + (index + 1))),
    config: { ...(sheet?.config || {}) },
    showGridLines: 0,
    status: index === 0 ? 1 : 0,
    order: sheet?.order ?? index,
  }));
}

function Viewer() {
  const sheetRef = useRef(null);
  const [key, setKey] = useState(0);
  const [sheets, setSheets] = useState([
    {
      id: "nerdora-loading",
      name: "Carregando",
      status: 1,
      order: 0,
      row: 2,
      column: 2,
      celldata: [],
      config: {},
      showGridLines: 0,
    },
  ]);

  useEffect(() => {
    let cancelled = false;

    const reportError = (error) => {
      if (cancelled) return;
      const message = error?.message || String(error || "Falha ao abrir o XLSX.");
      try { NerdoraXlsx.onError(message); } catch (_) {}
    };

    const load = async () => {
      try {
        if (document.fonts?.ready) await document.fonts.ready;

        const file = decodeBridgeFile();
        let imported = null;

        const acceptSheets = (incoming) => {
          imported = normalizeSheets(incoming);
          if (!imported.length) throw new Error("Nenhuma aba válida foi encontrada no XLSX.");
          if (!cancelled) setSheets(imported);
        };

        await transformExcelToFortune(
          file,
          acceptSheets,
          setKey,
          sheetRef
        );

        if (!imported?.length) {
          throw new Error("O conversor não retornou abas para este XLSX.");
        }

        window.setTimeout(() => {
          if (cancelled) return;
          const root = document.getElementById("root");
          const hasRenderedChildren = !!root && root.children.length > 0;
          if (!hasRenderedChildren) {
            reportError(new Error("FortuneSheet não conseguiu montar a visualização."));
            return;
          }
          try { NerdoraXlsx.onRendered(imported.length); } catch (_) {}
        }, 900);
      } catch (error) {
        reportError(error);
      }
    };

    const onWindowError = (event) => {
      if (event?.error) reportError(event.error);
    };
    window.addEventListener("error", onWindowError);
    load();

    return () => {
      cancelled = true;
      window.removeEventListener("error", onWindowError);
    };
  }, []);

  return (
    <Workbook
      key={key}
      ref={sheetRef}
      data={sheets}
      allowEdit={false}
      showToolbar={false}
      showFormulaBar={false}
      showSheetTabs={true}
      rowHeaderWidth={0}
      columnHeaderHeight={0}
      cellContextMenu={[]}
      headerContextMenu={[]}
      sheetTabContextMenu={[]}
      forceCalculation={false}
      lang="en"
    />
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<Viewer />);
