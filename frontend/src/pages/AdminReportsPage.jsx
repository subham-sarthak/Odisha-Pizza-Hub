import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { orderReportApi } from "../api";

const retentionOptions = [
  { label: "All", value: "all" },
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 365 days", value: "365" }
];

const formatDate = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const formatBytes = (size) => {
  const value = Number(size || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const parseFileNameDate = (fileName) => {
  const match = String(fileName || "").match(/^orders-(\d{4})-(\d{2})-(\d{2})\.pdf$/i);
  if (!match) return null;
  const [, year, month, day] = match;
  return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
};

export default function AdminReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retention, setRetention] = useState("all");
  const [error, setError] = useState("");
  const [downloadingFile, setDownloadingFile] = useState("");

  const loadReports = async (retentionValue = retention) => {
    setLoading(true);
    setError("");

    try {
      const { data } = await orderReportApi.list(retentionValue);
      setReports(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to fetch order reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports(retention);
  }, [retention]);

  const sortedReports = useMemo(
    () =>
      [...reports].sort((a, b) => {
        const aDate = new Date(a.reportDate || parseFileNameDate(a.fileName) || 0).getTime();
        const bDate = new Date(b.reportDate || parseFileNameDate(b.fileName) || 0).getTime();
        return bDate - aDate;
      }),
    [reports]
  );

  const handleDownload = async (fileName) => {
    setDownloadingFile(fileName);

    try {
      const response = await orderReportApi.download(fileName, false);
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not download report");
    } finally {
      setDownloadingFile("");
    }
  };

  const handleView = async (fileName) => {
    setDownloadingFile(fileName);

    try {
      const response = await orderReportApi.download(fileName, true);
      const blob = response.data;
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not open report");
    } finally {
      setDownloadingFile("");
    }
  };

  return (
    <section className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        <div>
          <h2>Admin Order Reports</h2>
          <p className="muted">Permanent daily PDF history. Orders may be deleted after 24 hours, reports stay available.</p>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button type="button" className="btn-secondary" onClick={() => navigate("/admin-dashboard")}>Back to Dashboard</button>
          <button type="button" onClick={() => loadReports(retention)}>Refresh</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <label htmlFor="retention-select" style={{ display: "block", marginBottom: "0.5rem", fontWeight: 700 }}>
          Filter Reports
        </label>
        <select id="retention-select" value={retention} onChange={(event) => setRetention(event.target.value)} style={{ maxWidth: "16rem" }}>
          {retentionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: "1rem" }}>Order Reports</h3>

        {loading ? <p className="muted">Loading reports...</p> : null}
        {!loading && error ? <p style={{ color: "#b91c1c" }}>{error}</p> : null}
        {!loading && !error && sortedReports.length === 0 ? <p className="muted">No reports found for selected filter.</p> : null}

        {!loading && !error && sortedReports.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Report</th>
                  <th>Size</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedReports.map((report) => {
                  const disabled = downloadingFile === report.fileName;
                  return (
                    <tr key={report.fileName}>
                      <td>{formatDate(report.reportDate || parseFileNameDate(report.fileName))}</td>
                      <td>{report.fileName}</td>
                      <td>{formatBytes(report.sizeInBytes)}</td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                          <button type="button" className="btn-secondary" onClick={() => handleView(report.fileName)} disabled={disabled}>
                            View
                          </button>
                          <button type="button" onClick={() => handleDownload(report.fileName)} disabled={disabled}>
                            {disabled ? "Working..." : "Download"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}
