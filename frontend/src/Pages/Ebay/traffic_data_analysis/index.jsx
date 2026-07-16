import { useMemo, useState } from "react";
import Papa from "papaparse";
import {
  ArrowDownUp,
  BarChart3,
  Eye,
  EyeOff,
  LineChart,
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  History,
  Loader2,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

const STORAGE_KEY = "ebay_sales_traffic_last_compare_v5";

const PERIOD_ACCENTS = [
  "border-l-indigo-500",
  "border-l-emerald-500",
  "border-l-amber-500",
  "border-l-sky-500",
  "border-l-rose-500",
  "border-l-violet-500",
];

const FILTER_TABS = [
  { key: "all", label: "All", dot: "bg-slate-500" },
  { key: "sales", label: "Sales", dot: "bg-emerald-500" },
  { key: "no-sales", label: "No sales", dot: "bg-amber-500" },
  { key: "down", label: "Down", dot: "bg-red-500" },
];

const createPeriod = (index = 1) => ({
  id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
  label: `Period ${index}`,
  trafficFileName: "",
  trafficDisplayName: "",
  salesFileName: "",
  salesDisplayName: "",
  trafficRows: [],
  salesRows: [],
});

const getInitialPeriods = () => [createPeriod(1), createPeriod(2)];

const METRIC_OPTIONS = [
  { key: "sales", label: "Sales", type: "money" },
  { key: "qty", label: "Qty", type: "number" },
  { key: "orders", label: "Orders", type: "number" },
  { key: "impressions", label: "Impressions", shortLabel: "Impr.", type: "number" },
  { key: "views", label: "Views", type: "number" },
  { key: "ctr", label: "CTR", type: "percent" },
  { key: "cvr", label: "CVR", type: "percent" },
  { key: "adTop20", label: "Ad Top 20", type: "number" },
  { key: "organicTop20", label: "Organic Top 20", type: "number" },
  { key: "adOutside", label: "Ad Outside Search", type: "number" },
  { key: "organicOutside", label: "Organic Outside Search", type: "number" },
];

const DEFAULT_VISIBLE_METRICS = ["sales", "qty", "orders", "impressions", "ctr", "cvr"];
const DEFAULT_VISIBLE_BASE = ["itemId", "title"];
const CHART_METRICS = [
  { key: "sales", label: "Sales", type: "money", color: "#2563eb" },
  { key: "qty", label: "Qty", type: "number", color: "#059669" },
  { key: "orders", label: "Orders", type: "number", color: "#d97706" },
  { key: "impressions", label: "Impressions", type: "number", color: "#7c3aed" },
  { key: "views", label: "Views", type: "number", color: "#0891b2" },
  { key: "ctr", label: "CTR", type: "percent", color: "#dc2626" },
  { key: "cvr", label: "CVR", type: "percent", color: "#16a34a" },
];

const NUMBER_SORT_KEYS = new Set(METRIC_OPTIONS.map((item) => item.key));

function normalizeHeader(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function cleanItemId(value) {
  return String(value || "")
    .replace(/^="/, "")
    .replace(/"$/g, "")
    .replace(/[^0-9]/g, "")
    .trim();
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;

  let text = String(value)
    .replace(/^="/, "")
    .replace(/"$/g, "")
    .replace(/EUR|GBP|USD|£|€|\$/gi, "")
    .replace(/%/g, "")
    .replace(/\s/g, "")
    .trim();

  if (!text) return 0;

  const negative = /^-/.test(text) || /^\(.+\)$/.test(text);
  text = text.replace(/[()]/g, "");

  const comma = text.lastIndexOf(",");
  const dot = text.lastIndexOf(".");

  if (comma > -1 && dot > -1) {
    text = comma > dot ? text.replace(/\./g, "").replace(",", ".") : text.replace(/,/g, "");
  } else if (comma > -1) {
    const afterComma = text.length - comma - 1;
    text = afterComma === 3 ? text.replace(/,/g, "") : text.replace(",", ".");
  } else if (dot > -1) {
    const afterDot = text.length - dot - 1;
    if (afterDot === 3) text = text.replace(/\./g, "");
  }

  const number = Number(text.replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(number)) return 0;
  return negative ? -Math.abs(number) : number;
}

function formatNumber(value, decimals = 0) {
  const number = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
}

function formatMoney(value) {
  return formatNumber(value, 2);
}

function formatPercent(value) {
  return `${formatNumber(value, 1)}%`;
}

function formatMetric(value, type) {
  if (type === "money") return formatMoney(value);
  if (type === "percent") return formatPercent(value);
  return formatNumber(value);
}

function formatDiff(value, type) {
  const number = Number(value || 0);
  const sign = number > 0 ? "+" : "";
  if (type === "money") return `${sign}${formatMoney(number)}`;
  if (type === "percent") return `${sign}${formatNumber(number, 1)}%`;
  return `${sign}${formatNumber(number)}`;
}

function getMetricConfig(key) {
  return METRIC_OPTIONS.find((metric) => metric.key === key) || METRIC_OPTIONS[0];
}

function findHeaderRow(lines, type) {
  const requiredWords = type === "traffic" ? ["impressions"] : ["verkauf", "sales", "revenue", "umsatz"];
  let bestIndex = 0;
  let bestScore = -1;

  lines.forEach((line, index) => {
    const lower = line.toLowerCase();
    const score = requiredWords.reduce((total, word) => total + (lower.includes(word) ? 1 : 0), 0);
    const hasItemId =
      lower.includes("ebay-artikelnummer") ||
      lower.includes("item id") ||
      lower.includes("artikelnummer") ||
      lower.includes("listing id");

    if (hasItemId && score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function parseCsvFile(file, type) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const rawText = String(event.target?.result || "");
      const lines = rawText.split(/\r?\n/);
      const headerIndex = findHeaderRow(lines, type);
      const usefulText = lines.slice(headerIndex).join("\n");

      Papa.parse(usefulText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => String(header || "").replace(/^\uFEFF/, "").trim(),
        complete: (result) => {
          const rows = (result.data || []).filter((row) => getItemId(row));
          resolve(rows);
        },
        error: reject,
      });
    };

    reader.onerror = reject;
    reader.readAsText(file, "UTF-8");
  });
}

function getValue(row, possibleHeaders) {
  if (!row) return "";

  const normalizedMap = Object.keys(row).reduce((map, key) => {
    map[normalizeHeader(key)] = row[key];
    return map;
  }, {});

  for (const header of possibleHeaders) {
    const exact = normalizedMap[normalizeHeader(header)];
    if (exact !== undefined && exact !== null && exact !== "") return exact;
  }

  const rowKeys = Object.keys(normalizedMap);

  for (const header of possibleHeaders) {
    const target = normalizeHeader(header);
    const foundKey = rowKeys.find((key) => key.includes(target) || target.includes(key));
    if (foundKey && normalizedMap[foundKey] !== undefined && normalizedMap[foundKey] !== "") {
      return normalizedMap[foundKey];
    }
  }

  return "";
}

function getItemId(row) {
  return cleanItemId(
    getValue(row, [
      "eBay-Artikelnummer",
      "eBay Artikelnummer",
      "Item ID",
      "eBay item number",
      "Listing ID",
      "Artikelnummer",
    ])
  );
}

function getTitle(row) {
  return String(getValue(row, ["Angebotstitel", "Listing title", "Item title", "Title", "Product title"])).trim();
}

function emptyMetrics(title = "") {
  return {
    title,
    sales: 0,
    qty: 0,
    orders: 0,
    impressions: 0,
    views: 0,
    ctr: 0,
    cvr: 0,
    adTop20: 0,
    organicTop20: 0,
    adOutside: 0,
    organicOutside: 0,
  };
}

function extractTraffic(row) {
  const title = getTitle(row);

  return {
    ...emptyMetrics(title),
    qty: toNumber(getValue(row, ["Verkaufte Stückzahl", "Sold quantity", "Sold qty", "Units sold"])),
    impressions: toNumber(getValue(row, ["Gesamtanzahl Impressions", "Total impressions", "Impressions"])),
    views: toNumber(getValue(row, ["Gesamtzahl Seitenaufrufe", "Total page views", "Page views", "Views"])),
    ctr: toNumber(
      getValue(row, [
        "Klickrate = Seitenaufrufe über eBay-Website/Gesamtzahl Impressions",
        "Click-through rate",
        "CTR",
      ])
    ),
    cvr: toNumber(
      getValue(row, [
        "Konversionsrate = Verkaufte Stückzahl/Gesamtzahl Seitenaufrufe",
        "Conversion rate",
        "CVR",
      ])
    ),
    adTop20: toNumber(
      getValue(row, [
        "Anzeigen-Impressions innerhalb der Top 20 Suchergebnisse",
        "Promoted impressions in top 20 search results",
      ])
    ),
    organicTop20: toNumber(
      getValue(row, [
        "Organische Impressions innerhalb der Top 20 Suchergebnisse",
        "Organic impressions in top 20 search results",
      ])
    ),
    adOutside: toNumber(
      getValue(row, ["Anzeigen-Impressions außerhalb der Suche", "Promoted impressions outside search"])
    ),
    organicOutside: toNumber(
      getValue(row, ["Organische Impressions außerhalb der Suche", "Organic impressions outside search"])
    ),
  };
}

function extractSales(row) {
  const qty = toNumber(getValue(row, ["Verkaufte Stückzahl", "Sold quantity", "Sold qty", "Units sold"]));
  const orders = toNumber(
    getValue(row, ["Orders", "Order count", "Anzahl Bestellungen", "Bestellungen", "Number of orders"])
  );

  return {
    ...emptyMetrics(getTitle(row)),
    qty,
    orders: orders || qty,
    sales: toNumber(
      getValue(row, [
        "Gesamtumsatz (inkl. Steuern)",
        "Total sales",
        "Total revenue",
        "Revenue",
        "Umsatz",
      ])
    ),
  };
}

function mergeMetrics(base, incoming) {
  return {
    ...base,
    title: base.title || incoming.title || "",
    sales: (base.sales || 0) + (incoming.sales || 0),
    qty: (base.qty || 0) + (incoming.qty || 0),
    orders: (base.orders || 0) + (incoming.orders || 0),
    impressions: (base.impressions || 0) + (incoming.impressions || 0),
    views: (base.views || 0) + (incoming.views || 0),
    ctr: incoming.ctr || base.ctr || 0,
    cvr: incoming.cvr || base.cvr || 0,
    adTop20: (base.adTop20 || 0) + (incoming.adTop20 || 0),
    organicTop20: (base.organicTop20 || 0) + (incoming.organicTop20 || 0),
    adOutside: (base.adOutside || 0) + (incoming.adOutside || 0),
    organicOutside: (base.organicOutside || 0) + (incoming.organicOutside || 0),
  };
}

function buildPeriodMap(period) {
  const map = new Map();

  period.trafficRows.forEach((row) => {
    const id = getItemId(row);
    if (!id) return;
    const current = map.get(id) || emptyMetrics();
    map.set(id, mergeMetrics(current, extractTraffic(row)));
  });

  period.salesRows.forEach((row) => {
    const id = getItemId(row);
    if (!id) return;
    const current = map.get(id) || emptyMetrics();
    map.set(id, mergeMetrics(current, extractSales(row)));
  });

  return map;
}

function getSortValue(row, sortKey) {
  if (!sortKey) return "";
  if (sortKey === "itemId") return row.itemId;
  if (sortKey === "title") return row.title;

  if (sortKey.startsWith("diff.")) {
    const metric = sortKey.replace("diff.", "");
    return row.diffs?.[metric] || 0;
  }

  const [periodId, metric] = sortKey.split(".");
  return row.periods?.[periodId]?.[metric] || 0;
}

function getSafeLabel(period, fallback) {
  return String(period.label || fallback).trim() || fallback;
}

function getFileDisplay(period, type) {
  const custom = type === "traffic" ? period.trafficDisplayName : period.salesDisplayName;
  const original = type === "traffic" ? period.trafficFileName : period.salesFileName;
  return custom || original || "Not uploaded";
}

function getUploadedFileCount(periods) {
  return periods.reduce((count, period) => count + (period.trafficRows.length ? 1 : 0) + (period.salesRows.length ? 1 : 0), 0);
}

function calculatePeriodTotals(rows, periods) {
  return periods.map((period) => {
    const total = rows.reduce((sum, row) => {
      const metrics = row.periods?.[period.id] || emptyMetrics();

      sum.sales += metrics.sales || 0;
      sum.qty += metrics.qty || 0;
      sum.orders += metrics.orders || 0;
      sum.impressions += metrics.impressions || 0;
      sum.views += metrics.views || 0;
      sum.adTop20 += metrics.adTop20 || 0;
      sum.organicTop20 += metrics.organicTop20 || 0;
      sum.adOutside += metrics.adOutside || 0;
      sum.organicOutside += metrics.organicOutside || 0;

      return sum;
    }, emptyMetrics());

    total.ctr = total.impressions > 0 ? (total.views / total.impressions) * 100 : 0;
    total.cvr = total.views > 0 ? (total.qty / total.views) * 100 : 0;

    return {
      periodId: period.id,
      label: getSafeLabel(period, "Period"),
      ...total,
    };
  });
}

function downloadCsv(filename, rows, periods, visibleBase, visibleMetrics) {
  const headers = [];

  if (visibleBase.includes("itemId")) headers.push("Item ID");
  if (visibleBase.includes("title")) headers.push("Title");

  visibleMetrics.forEach((metricKey) => {
    const metric = getMetricConfig(metricKey);
    periods.forEach((period, index) => {
      headers.push(`${getSafeLabel(period, `Period ${index + 1}`)} ${metric.label}`);
    });
    headers.push(`Diff_${metric.label}`);
  });

  const csvRows = rows.map((row) => {
    const values = [];

    if (visibleBase.includes("itemId")) values.push(row.itemId);
    if (visibleBase.includes("title")) values.push(row.title);

    visibleMetrics.forEach((metricKey) => {
      periods.forEach((period) => {
        values.push(row.periods?.[period.id]?.[metricKey] || 0);
      });
      values.push(row.diffs?.[metricKey] || 0);
    });

    return values;
  });

  const csv = Papa.unparse([headers, ...csvRows]);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function SortIcon({ active, direction }) {
  if (!active) return <ArrowDownUp className="h-3.5 w-3.5 text-slate-400" />;
  return direction === "asc" ? (
    <ChevronUp className="h-3.5 w-3.5 text-slate-700" />
  ) : (
    <ChevronDown className="h-3.5 w-3.5 text-slate-700" />
  );
}

function SortButton({ label, sortKey, sort, onSort, align = "left" }) {
  const active = sort.key === sortKey;

  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={`flex w-full cursor-pointer items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 ${
        align === "right" ? "justify-end" : "justify-start"
      }`}
    >
      <span className="truncate">{label}</span>
      <SortIcon active={active} direction={sort.direction} />
    </button>
  );
}

function FileInput({ label, fileName, loading, tone = "slate", onChange }) {
  const toneClass = tone === "traffic" ? "border-l-sky-500" : tone === "sales" ? "border-l-emerald-500" : "border-l-slate-400";

  return (
    <label className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-l-4 ${toneClass} border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:border-slate-300 hover:bg-slate-50`}>
      <span className="flex min-w-0 items-center gap-2">
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-500" />
        ) : (
          <Upload className="h-4 w-4 shrink-0 text-slate-400" />
        )}
        <span className="truncate">{loading ? "Loading file..." : fileName || label}</span>
      </span>
      <input
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
    </label>
  );
}

function DiffCell({ value, type }) {
  const number = Number(value || 0);
  const className = number > 0 ? "text-emerald-600" : number < 0 ? "text-red-600" : "text-slate-500";

  return (
    <td className={`border-r border-slate-100 px-3 py-3 text-right font-medium ${className}`}>
      {formatDiff(number, type)}
    </td>
  );
}

function MetricCell({ value, type }) {
  return (
    <td className="border-r border-slate-100 px-3 py-3 text-right text-slate-700">
      {formatMetric(value, type)}
    </td>
  );
}

function LoadingBlock({ text = "Loading files and preparing results..." }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex flex-col items-center justify-center gap-3 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
        <p className="text-sm font-medium text-slate-800">{text}</p>
        <p className="text-xs text-slate-500">CSV rows are reading. Results will show after loading completed.</p>
      </div>
    </div>
  );
}

function SummaryCards({ periods, periodTotals, visibleMetrics }) {
  if (!periods.length || !visibleMetrics.length) return null;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {visibleMetrics.map((metricKey) => {
        const metric = getMetricConfig(metricKey);
        const firstTotal = periodTotals[0]?.[metricKey] || 0;
        const lastTotal = periodTotals[periodTotals.length - 1]?.[metricKey] || 0;
        const diff = Number(lastTotal || 0) - Number(firstTotal || 0);
        const diffClass = diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-600" : "text-slate-500";

        return (
          <div key={metricKey} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-800">{metric.label}</p>
                <p className="text-xs text-slate-500">Total by period</p>
              </div>
              <div className={`rounded-lg bg-slate-50 px-2.5 py-1 text-right text-xs font-medium ${diffClass}`}>
                Diff {formatDiff(diff, metric.type)}
              </div>
            </div>

            <div className="space-y-2">
              {periods.map((period, index) => (
                <div key={`${metricKey}-${period.id}`} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                  <span className="min-w-0 truncate text-xs text-slate-500" title={getSafeLabel(period, `Period ${index + 1}`)}>
                    {getSafeLabel(period, `Period ${index + 1}`)}
                  </span>
                  <span className="shrink-0 text-sm font-medium text-slate-800">
                    {formatMetric(periodTotals[index]?.[metricKey] || 0, metric.type)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ColumnFilterPopup({
  open,
  onClose,
  visibleBase,
  setVisibleBase,
  visibleMetrics,
  setVisibleMetrics,
  excludeIdsText,
  setExcludeIdsText,
}) {
  if (!open) return null;

  function toggleBase(key) {
    setVisibleBase((current) => {
      if (current.includes(key)) return current.filter((item) => item !== key);
      return [...current, key];
    });
  }

  function toggleMetric(key) {
    setVisibleMetrics((current) => {
      if (current.includes(key)) return current.filter((item) => item !== key);
      return [...current, key];
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Table columns</h2>
            <p className="text-sm text-slate-500">Tick panna headings mattum table-la show aagum.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          <div className="mb-5">
            <p className="mb-2 text-sm font-medium text-slate-700">Main headings</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                { key: "itemId", label: "Item ID" },
                { key: "title", label: "Title" },
              ].map((column) => (
                <label
                  key={column.key}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={visibleBase.includes(column.key)}
                    onChange={() => toggleBase(column.key)}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300"
                  />
                  {column.label}
                </label>
              ))}
            </div>
          </div>

          <div className="mb-5 rounded-xl border border-rose-100 bg-rose-50/70 p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-rose-800">Exclude IDs</p>
                <p className="text-xs text-rose-600">Multiple Item IDs comma / space / new line-la paste pannunga.</p>
              </div>
              {excludeIdsText ? (
                <button
                  type="button"
                  onClick={() => setExcludeIdsText("")}
                  className="cursor-pointer rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100"
                >
                  Clear
                </button>
              ) : null}
            </div>
            <textarea
              value={excludeIdsText}
              onChange={(event) => setExcludeIdsText(event.target.value)}
              rows={3}
              placeholder={`Example:
123456789012, 234567890123
345678901234`}
              className="w-full resize-y rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-rose-400"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Compare headings</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {METRIC_OPTIONS.map((metric) => (
                <label
                  key={metric.key}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={visibleMetrics.includes(metric.key)}
                    onChange={() => toggleMetric(metric.key)}
                    className="h-4 w-4 cursor-pointer rounded border-slate-300"
                  />
                  {metric.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={() => {
              setVisibleBase(DEFAULT_VISIBLE_BASE);
              setVisibleMetrics(DEFAULT_VISIBLE_METRICS);
              setExcludeIdsText("");
            }}
            className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Reset
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setVisibleMetrics(METRIC_OPTIONS.map((metric) => metric.key))}
              className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemChartModal({ row, periods, onClose }) {
  const [hiddenLines, setHiddenLines] = useState([]);
  const [showChart, setShowChart] = useState(true);

  if (!row) return null;

  const chartData = periods.map((period, index) => ({
    periodId: period.id,
    label: getSafeLabel(period, `Period ${index + 1}`),
    ...CHART_METRICS.reduce((map, metric) => {
      map[metric.key] = Number(row.periods?.[period.id]?.[metric.key] || 0);
      return map;
    }, {}),
  }));

  const visibleLines = CHART_METRICS.filter((metric) => !hiddenLines.includes(metric.key));
  const chartWidth = 920;
  const chartHeight = 340;
  const padding = { top: 24, right: 34, bottom: 54, left: 44 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const xForIndex = (index) =>
    chartData.length <= 1
      ? padding.left + plotWidth / 2
      : padding.left + (plotWidth / (chartData.length - 1)) * index;

  function getLinePoints(metric) {
    const values = chartData.map((item) => Number(item[metric.key] || 0));
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 1);
    const range = max - min || 1;

    return chartData.map((item, index) => {
      const value = Number(item[metric.key] || 0);
      const normalized = (value - min) / range;
      return {
        x: xForIndex(index),
        y: padding.top + (1 - normalized) * plotHeight,
        value,
        label: item.label,
      };
    });
  }

  function toggleLine(metricKey) {
    setHiddenLines((current) =>
      current.includes(metricKey) ? current.filter((key) => key !== metricKey) : [...current, metricKey]
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
      <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-slate-500">Item ID trend</p>
            <h2 className="text-lg font-semibold text-slate-900">{row.itemId}</h2>
            <p className="mt-1 truncate text-sm text-slate-500">{row.title || "No title"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(92vh-88px)] overflow-y-auto p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {CHART_METRICS.map((metric) => {
                const disabled = hiddenLines.includes(metric.key);
                return (
                  <button
                    key={metric.key}
                    type="button"
                    onClick={() => toggleLine(metric.key)}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium ${
                      disabled
                        ? "border-slate-200 bg-white text-slate-400 line-through hover:bg-slate-50"
                        : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-white"
                    }`}
                    title={disabled ? `Show ${metric.label}` : `Hide ${metric.label}`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: metric.color }} />
                    {metric.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowChart((current) => !current)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {showChart ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showChart ? "Hide chart" : "Show chart"}
            </button>
          </div>

          {showChart ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-center gap-2 text-slate-700">
                <LineChart className="h-4 w-4" />
                <p className="text-sm font-medium">All metrics line chart</p>
                <span className="text-xs text-slate-400">Each line is scaled to show period movement clearly.</span>
              </div>

              <div className="overflow-x-auto">
                <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="min-w-[760px] rounded-lg bg-white ring-1 ring-slate-200">
                  {[0, 1, 2, 3, 4].map((line) => {
                    const y = padding.top + (plotHeight / 4) * line;
                    return <line key={line} x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
                  })}

                  {chartData.map((item, index) => {
                    const x = xForIndex(index);
                    return (
                      <g key={item.periodId}>
                        <line x1={x} y1={padding.top} x2={x} y2={padding.top + plotHeight} stroke="#f1f5f9" strokeWidth="1" />
                        <text
                          x={x}
                          y={chartHeight - 20}
                          textAnchor="middle"
                          className="fill-slate-500 text-[11px]"
                        >
                          {item.label.length > 18 ? `${item.label.slice(0, 18)}...` : item.label}
                        </text>
                      </g>
                    );
                  })}

                  {visibleLines.map((metric) => {
                    const points = getLinePoints(metric);
                    const pointString = points.map((point) => `${point.x},${point.y}`).join(" ");

                    return (
                      <g key={metric.key}>
                        <polyline
                          fill="none"
                          stroke={metric.color}
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={pointString}
                        />
                        {points.map((point, index) => (
                          <g key={`${metric.key}-${index}`}>
                            <circle cx={point.x} cy={point.y} r="4" fill={metric.color} stroke="#ffffff" strokeWidth="2">
                              <title>{`${point.label} - ${metric.label}: ${formatMetric(point.value, metric.type)}`}</title>
                            </circle>
                          </g>
                        ))}
                      </g>
                    );
                  })}
                </svg>
              </div>

              {!visibleLines.length ? (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  All lines are hidden. Select at least one metric above to view the chart.
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border-b border-r border-slate-200 px-3 py-2 text-left font-medium text-slate-600">Period</th>
                  {CHART_METRICS.map((metric) => (
                    <th key={metric.key} className="border-b border-r border-slate-200 px-3 py-2 text-right font-medium text-slate-600">
                      {metric.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {chartData.map((item) => (
                  <tr key={item.periodId} className="hover:bg-slate-50">
                    <td className="border-r border-slate-100 px-3 py-2 text-slate-700">{item.label}</td>
                    {CHART_METRICS.map((metric) => (
                      <td key={`${item.periodId}-${metric.key}`} className="border-r border-slate-100 px-3 py-2 text-right text-slate-700">
                        {formatMetric(item[metric.key], metric.type)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EbaySalesTrafficAnalyzer() {
  const [periods, setPeriods] = useState(getInitialPeriods);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [excludeIdsText, setExcludeIdsText] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sort, setSort] = useState({ key: "itemId", direction: "asc" });
  const [loadingKey, setLoadingKey] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [hasCompared, setHasCompared] = useState(false);
  const [showUploadPanel, setShowUploadPanel] = useState(true);
  const [lastCompareAvailable, setLastCompareAvailable] = useState(() => {
    try {
      return Boolean(window.localStorage.getItem(STORAGE_KEY));
    } catch {
      return false;
    }
  });
  const [columnFilterOpen, setColumnFilterOpen] = useState(false);
  const [visibleBase, setVisibleBase] = useState(DEFAULT_VISIBLE_BASE);
  const [visibleMetrics, setVisibleMetrics] = useState(DEFAULT_VISIBLE_METRICS);
  const [selectedRow, setSelectedRow] = useState(null);

  const isLoading = Boolean(loadingKey) || isComparing;
  const uploadedFileCount = getUploadedFileCount(periods);
  const canCompare = uploadedFileCount > 0 && !isLoading;
  const excludedCount = excludeIdsText
    .split(/[\s,]+/)
    .map((value) => cleanItemId(value))
    .filter(Boolean).length;

  const periodMaps = useMemo(() => {
    return periods.reduce((map, period) => {
      map[period.id] = buildPeriodMap(period);
      return map;
    }, {});
  }, [periods]);

  const rows = useMemo(() => {
    const allIds = new Set();
    Object.values(periodMaps).forEach((periodMap) => {
      periodMap.forEach((_, itemId) => allIds.add(itemId));
    });

    return Array.from(allIds).map((itemId) => {
      const periodData = {};
      const diffs = {};
      let title = "";

      periods.forEach((period) => {
        const current = periodMaps[period.id]?.get(itemId) || emptyMetrics();
        periodData[period.id] = current;
        title = title || current.title;
      });

      const firstPeriod = periods[0];
      const lastPeriod = periods[periods.length - 1];
      const firstMetrics = firstPeriod ? periodData[firstPeriod.id] || emptyMetrics() : emptyMetrics();
      const lastMetrics = lastPeriod ? periodData[lastPeriod.id] || emptyMetrics() : emptyMetrics();

      METRIC_OPTIONS.forEach((metric) => {
        diffs[metric.key] = Number(lastMetrics[metric.key] || 0) - Number(firstMetrics[metric.key] || 0);
      });

      return { itemId, title, periods: periodData, diffs };
    });
  }, [periodMaps, periods]);

  const filteredRows = useMemo(() => {
    if (!hasCompared) return [];

    const searchIds = appliedSearch
      .split(/[\s,]+/)
      .map((value) => cleanItemId(value))
      .filter(Boolean);

    const excludedIds = excludeIdsText
      .split(/[\s,]+/)
      .map((value) => cleanItemId(value))
      .filter(Boolean);

    let result = rows;

    if (searchIds.length) {
      const idSet = new Set(searchIds);
      result = result.filter((row) => idSet.has(row.itemId));
    }

    if (excludedIds.length) {
      const excludeSet = new Set(excludedIds);
      result = result.filter((row) => !excludeSet.has(row.itemId));
    }

    if (activeFilter === "sales") {
      result = result.filter((row) => periods.some((period) => (row.periods[period.id]?.sales || 0) > 0));
    }

    if (activeFilter === "no-sales") {
      result = result.filter((row) => periods.every((period) => (row.periods[period.id]?.sales || 0) === 0));
    }

    if (activeFilter === "down") {
      result = result.filter((row) => visibleMetrics.some((key) => Number(row.diffs?.[key] || 0) < 0));
    }

    const sorted = [...result].sort((a, b) => {
      const aValue = getSortValue(a, sort.key);
      const bValue = getSortValue(b, sort.key);
      const direction = sort.direction === "asc" ? 1 : -1;
      const metricKey = sort.key.split(".").pop();

      if (NUMBER_SORT_KEYS.has(metricKey)) {
        return (Number(aValue || 0) - Number(bValue || 0)) * direction;
      }

      return (
        String(aValue || "").localeCompare(String(bValue || ""), undefined, {
          numeric: true,
          sensitivity: "base",
        }) * direction
      );
    });

    return sorted;
  }, [activeFilter, appliedSearch, excludeIdsText, hasCompared, periods, rows, sort, visibleMetrics]);

  const periodTotals = useMemo(() => calculatePeriodTotals(rows, periods), [periods, rows]);

  const filteredPeriodTotals = useMemo(
    () => calculatePeriodTotals(filteredRows, periods),
    [filteredRows, periods]
  );

  const tableColumnCount = visibleBase.length + visibleMetrics.length * (periods.length + 1);

  function handleSort(key) {
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }

  async function handleFile(periodId, type, file) {
    if (!file) return;

    const loadingId = `${periodId}-${type}`;
    setLoadingKey(loadingId);
    setHasCompared(false);

    try {
      const rowsFromFile = await parseCsvFile(file, type);

      setPeriods((current) =>
        current.map((period) => {
          if (period.id !== periodId) return period;
          const displayNameKey = type === "traffic" ? "trafficDisplayName" : "salesDisplayName";
          const currentDisplayName = period[displayNameKey];

          return {
            ...period,
            [`${type}Rows`]: rowsFromFile,
            [`${type}FileName`]: file.name,
            [displayNameKey]: currentDisplayName || file.name.replace(/\.csv$/i, ""),
          };
        })
      );
    } finally {
      setLoadingKey("");
    }
  }

  function saveLastCompare(nextPeriods) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          savedAt: new Date().toISOString(),
          periods: nextPeriods,
        })
      );
      setLastCompareAvailable(true);
    } catch {
      setLastCompareAvailable(false);
    }
  }

  function handleCompare() {
    if (!canCompare) return;

    setIsComparing(true);
    window.setTimeout(() => {
      setHasCompared(true);
      setShowUploadPanel(false);
      setIsComparing(false);
      saveLastCompare(periods);
    }, 250);
  }

  function handleLastCompare() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed?.periods)) return;

      setIsComparing(true);
      window.setTimeout(() => {
        setPeriods(parsed.periods);
        setHasCompared(true);
        setShowUploadPanel(false);
        setSearchText("");
        setAppliedSearch("");
        setExcludeIdsText("");
        setActiveFilter("all");
        setIsComparing(false);
      }, 200);
    } catch {
      setLastCompareAvailable(false);
    }
  }

  function handleNewCompare() {
    setPeriods(getInitialPeriods());
    setSearchText("");
    setAppliedSearch("");
    setExcludeIdsText("");
    setActiveFilter("all");
    setSort({ key: "itemId", direction: "asc" });
    setSelectedRow(null);
    setHasCompared(false);
    setShowUploadPanel(true);
    setLoadingKey("");
    setIsComparing(false);
  }

  function addPeriod() {
    setPeriods((current) => [...current, createPeriod(current.length + 1)]);
    setHasCompared(false);
  }

  function removePeriod(periodId) {
    setPeriods((current) => current.filter((period) => period.id !== periodId));
    setHasCompared(false);
  }

  function updatePeriod(periodId, field, value) {
    setPeriods((current) => current.map((period) => (period.id === periodId ? { ...period, [field]: value } : period)));
    if (field === "label" || field.endsWith("DisplayName")) setHasCompared(false);
  }

  return (
    <div className=" ">
      <div className=" space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {!hasCompared ? (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleNewCompare}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  New Compare
                </button>
                <button
                  type="button"
                  onClick={handleLastCompare}
                  disabled={!lastCompareAvailable || isLoading}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <History className="h-4 w-4" />
                  Last Compare
                </button>
                <button
                  type="button"
                  onClick={addPeriod}
                  disabled={isLoading}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  Add period
                </button>
              </div>

              <button
                type="button"
                onClick={handleCompare}
                disabled={!canCompare}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isComparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                Compare
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <textarea
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  rows={1}
                  placeholder="Search Item ID or multiple IDs separated by comma / space / new line"
                  className="min-h-[42px] w-full resize-none rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-10 text-sm text-slate-700 outline-none focus:border-slate-400"
                />
                {searchText ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchText("");
                      setAppliedSearch("");
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAppliedSearch(searchText)}
                  className="inline-flex h-[42px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white hover:bg-slate-800"
                >
                  <Search className="h-4 w-4" />
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setColumnFilterOpen(true)}
                  className="inline-flex h-[42px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Filter className="h-4 w-4" />
                  Filter {excludedCount ? `(${excludedCount} excluded)` : ""}
                </button>
                <button
                  type="button"
                  onClick={() => downloadCsv("ebay-sales-traffic-analysis.csv", filteredRows, periods, visibleBase, visibleMetrics)}
                  className="inline-flex h-[42px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
                <button
                  type="button"
                  onClick={handleNewCompare}
                  className="inline-flex h-[42px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  New Compare
                </button>
              </div>
            </div>
          )}
        </div>

        {hasCompared ? (
          <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  activeFilter === tab.key
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${tab.dot}`} />
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}

        {hasCompared && !isLoading ? (
          <SummaryCards periods={periods} periodTotals={filteredPeriodTotals} visibleMetrics={visibleMetrics} />
        ) : null}

        {isLoading ? <LoadingBlock /> : null}

        {showUploadPanel && !isComparing ? (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {periods.map((period, index) => (
              <div
                key={period.id}
                className={`rounded-2xl border border-l-4 ${PERIOD_ACCENTS[index % PERIOD_ACCENTS.length]} border-slate-200 bg-white p-4 shadow-sm`}
              >
                <div className="mb-3 flex items-center gap-2">
                  <input
                    value={period.label}
                    onChange={(event) => updatePeriod(period.id, "label", event.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-slate-400"
                    placeholder="Period name"
                  />
                  {periods.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removePeriod(period.id)}
                      disabled={isLoading}
                      className="cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Remove period"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div className="space-y-2">
                    <FileInput
                      label="Upload Traffic CSV"
                      fileName={period.trafficFileName}
                      loading={loadingKey === `${period.id}-traffic`}
                      tone="traffic"
                      onChange={(file) => handleFile(period.id, "traffic", file)}
                    />
                    <input
                      value={period.trafficDisplayName}
                      onChange={(event) => updatePeriod(period.id, "trafficDisplayName", event.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
                      placeholder="Traffic file display name"
                    />
                  </div>

                  <div className="space-y-2">
                    <FileInput
                      label="Upload Sales CSV"
                      fileName={period.salesFileName}
                      loading={loadingKey === `${period.id}-sales`}
                      tone="sales"
                      onChange={(file) => handleFile(period.id, "sales", file)}
                    />
                    <input
                      value={period.salesDisplayName}
                      onChange={(event) => updatePeriod(period.id, "salesDisplayName", event.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
                      placeholder="Sales file display name"
                    />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-500 sm:grid-cols-2">
                  <div className="truncate rounded-lg border border-sky-100 bg-sky-50 px-3 py-2" title={getFileDisplay(period, "traffic")}>
                    Traffic: {getFileDisplay(period, "traffic")}
                  </div>
                  <div className="truncate rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2" title={getFileDisplay(period, "sales")}>
                    Sales: {getFileDisplay(period, "sales")}
                  </div>
                </div>

                {(period.trafficRows.length || period.salesRows.length) ? (
                  <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-lg bg-slate-50 px-2 py-2">
                      <p className="text-[11px] text-slate-500">Sales</p>
                      <p className="text-sm font-medium text-slate-800">{formatMoney(periodTotals[index]?.sales)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-2">
                      <p className="text-[11px] text-slate-500">Qty</p>
                      <p className="text-sm font-medium text-slate-800">{formatNumber(periodTotals[index]?.qty)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-2">
                      <p className="text-[11px] text-slate-500">Orders</p>
                      <p className="text-sm font-medium text-slate-800">{formatNumber(periodTotals[index]?.orders)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-2">
                      <p className="text-[11px] text-slate-500">Impr.</p>
                      <p className="text-sm font-medium text-slate-800">{formatNumber(periodTotals[index]?.impressions)}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {hasCompared && !isLoading ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-4 py-3 text-sm text-slate-500">
              Cards show current table totals. Click Item ID to open line chart. Click any table heading to sort.
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    {visibleBase.includes("itemId") ? (
                      <th className="min-w-[130px] border-b border-r border-slate-200 px-3 py-3 text-left">
                        <SortButton label="Item ID" sortKey="itemId" sort={sort} onSort={handleSort} />
                      </th>
                    ) : null}
                    {visibleBase.includes("title") ? (
                      <th className="min-w-[320px] border-b border-r border-slate-200 px-3 py-3 text-left">
                        <SortButton label="Title" sortKey="title" sort={sort} onSort={handleSort} />
                      </th>
                    ) : null}
                    {visibleMetrics.map((metricKey) => {
                      const metric = getMetricConfig(metricKey);
                      return (
                        <th
                          key={`group-${metricKey}`}
                          colSpan={periods.length + 1}
                          className="border-b border-r border-slate-200 px-3 py-2 text-center text-xs font-semibold text-slate-700"
                        >
                          {metric.label}
                        </th>
                      );
                    })}
                  </tr>
                  <tr>
                    {visibleBase.includes("itemId") ? <th className="border-b border-r border-slate-200 px-3 py-2" /> : null}
                    {visibleBase.includes("title") ? <th className="border-b border-r border-slate-200 px-3 py-2" /> : null}

                    {visibleMetrics.map((metricKey) => {
                      const metric = getMetricConfig(metricKey);
                      return [
                        ...periods.map((period, index) => (
                          <th key={`${period.id}-${metricKey}`} className="min-w-[120px] border-b border-r border-slate-200 px-3 py-2 text-right">
                            <SortButton
                              label={`${getSafeLabel(period, `P${index + 1}`)} ${metric.shortLabel || metric.label}`}
                              sortKey={`${period.id}.${metricKey}`}
                              sort={sort}
                              onSort={handleSort}
                              align="right"
                            />
                          </th>
                        )),
                        <th key={`diff-${metricKey}`} className="min-w-[110px] border-b border-r border-slate-200 px-3 py-2 text-right">
                          <SortButton label={`Diff_${metric.shortLabel || metric.label}`} sortKey={`diff.${metricKey}`} sort={sort} onSort={handleSort} align="right" />
                        </th>,
                      ];
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredRows.length ? (
                    filteredRows.map((row) => (
                      <tr key={row.itemId} className="hover:bg-slate-50">
                        {visibleBase.includes("itemId") ? (
                          <td className="border-r border-slate-100 px-3 py-3 font-medium text-slate-800">
                            <button
                              type="button"
                              onClick={() => setSelectedRow(row)}
                              className="inline-flex cursor-pointer items-center gap-2 rounded-md px-1 py-0.5 text-slate-800 underline-offset-4 hover:text-slate-950 hover:underline"
                            >
                              <LineChart className="h-3.5 w-3.5 text-slate-400" />
                              {row.itemId}
                            </button>
                          </td>
                        ) : null}

                        {visibleBase.includes("title") ? (
                          <td className="max-w-[340px] border-r border-slate-100 px-3 py-3 text-slate-600">
                            <div className="max-h-10 overflow-hidden leading-5">{row.title || "-"}</div>
                          </td>
                        ) : null}

                        {visibleMetrics.map((metricKey) => {
                          const metric = getMetricConfig(metricKey);
                          return [
                            ...periods.map((period) => (
                              <MetricCell
                                key={`${row.itemId}-${period.id}-${metricKey}`}
                                value={row.periods?.[period.id]?.[metricKey] || 0}
                                type={metric.type}
                              />
                            )),
                            <DiffCell key={`${row.itemId}-diff-${metricKey}`} value={row.diffs?.[metricKey]} type={metric.type} />,
                          ];
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={tableColumnCount || 1} className="px-4 py-12 text-center text-sm text-slate-500">
                        No matching Item IDs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>

      <ColumnFilterPopup
        open={columnFilterOpen}
        onClose={() => setColumnFilterOpen(false)}
        visibleBase={visibleBase}
        setVisibleBase={setVisibleBase}
        visibleMetrics={visibleMetrics}
        setVisibleMetrics={setVisibleMetrics}
        excludeIdsText={excludeIdsText}
        setExcludeIdsText={setExcludeIdsText}
      />

      <ItemChartModal
        row={selectedRow}
        periods={periods}
        onClose={() => setSelectedRow(null)}
      />
    </div>
  );
}
