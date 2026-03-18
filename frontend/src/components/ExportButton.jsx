const downloadCSV = (filename, rows) => {
  if (!rows || rows.length === 0) return alert("No data to export");
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map(row =>
      headers.map(h => {
        const val = row[h] === null || row[h] === undefined ? "" : row[h];
        const str = String(val).replace(/"/g, '""');
        return str.includes(",") || str.includes("\n") || str.includes('"') ? `"${str}"` : str;
      }).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export default function ExportButton({ filename, getData, label = "Export CSV" }) {
  const handleExport = async () => {
    try {
      const rows = await getData();
      downloadCSV(filename, rows);
    } catch {
      alert("Failed to export data");
    }
  };

  return (
    <button className="btn-ghost" onClick={handleExport} style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      {label}
    </button>
  );
}