import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const COLORS = ["#c2410c", "#d97706", "#0284c7", "#64748b"];

function formatChartData(record) {
  if (!record) return [];

  return [
    { name: "Error", value: record.counts.error },
    { name: "Warning", value: record.counts.warning },
    { name: "Info", value: record.counts.info },
    { name: "Other", value: record.counts.uncategorized }
  ];
}

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchHistory() {
    try {
      const response = await fetch(`${API_BASE}/logs`);
      const data = await response.json();
      setHistory(data);
      if (!currentAnalysis && data.length > 0) {
        setCurrentAnalysis(data[0]);
      }
    } catch (fetchError) {
      setError("Unable to fetch previous analysis history.");
    }
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  async function handleUpload(event) {
    event.preventDefault();

    if (!selectedFile) {
      setError("Please choose a log file first.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("logFile", selectedFile);

    try {
      const response = await fetch(`${API_BASE}/logs/upload`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      setCurrentAnalysis(data);
      setSelectedFile(null);
      await fetchHistory();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setLoading(false);
    }
  }

  const chartData = formatChartData(currentAnalysis);

  return (
    <div className="app-shell">
      <div className="hero-band">
        <div className="hero-copy">
          <p className="eyebrow">Cloud Native Log Insight Dashboard</p>
          <h1>Cloud Log Analyzer</h1>
          <p className="lead">
            Upload system logs, detect severity distribution instantly, and keep a
            MongoDB-backed history ready for charts, demos, and cloud deployment.
          </p>
        </div>

        <form className="upload-panel" onSubmit={handleUpload}>
          <label className="upload-label" htmlFor="logFile">
            Select log file
          </label>
          <input
            id="logFile"
            type="file"
            accept=".log,.txt"
            onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
          />
          <button type="submit" disabled={loading}>
            {loading ? "Analyzing..." : "Upload and Analyze"}
          </button>
          {selectedFile ? <p className="selected-file">{selectedFile.name}</p> : null}
          {error ? <p className="error-text">{error}</p> : null}
        </form>
      </div>

      <main className="dashboard">
        <section className="stats-grid">
          <article className="stat-tile">
            <span>Total Lines</span>
            <strong>{currentAnalysis?.totalLines ?? 0}</strong>
          </article>
          <article className="stat-tile">
            <span>Errors</span>
            <strong>{currentAnalysis?.counts.error ?? 0}</strong>
          </article>
          <article className="stat-tile">
            <span>Warnings</span>
            <strong>{currentAnalysis?.counts.warning ?? 0}</strong>
          </article>
          <article className="stat-tile">
            <span>Info</span>
            <strong>{currentAnalysis?.counts.info ?? 0}</strong>
          </article>
        </section>

        <section className="visual-grid">
          <div className="viz-panel">
            <div className="section-head">
              <h2>Severity Mix</h2>
              <p>Pie chart based on the latest selected analysis</p>
            </div>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={110}>
                    {chartData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="viz-panel">
            <div className="section-head">
              <h2>Count Comparison</h2>
              <p>Quick bar view for severity categories</p>
            </div>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="detail-grid">
          <div className="history-panel">
            <div className="section-head">
              <h2>Analysis History</h2>
              <p>Click a previous upload to inspect its graphs</p>
            </div>
            <div className="history-list">
              {history.length === 0 ? (
                <p className="empty-state">No uploads yet. Start with a sample log file.</p>
              ) : (
                history.map((item) => (
                  <button
                    key={item._id}
                    className={`history-card ${
                      currentAnalysis?._id === item._id ? "active" : ""
                    }`}
                    onClick={() => setCurrentAnalysis(item)}
                    type="button"
                  >
                    <div>
                      <h3>{item.fileName}</h3>
                      <p>{new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                    <strong>{item.totalLines} lines</strong>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="samples-panel">
            <div className="section-head">
              <h2>Sample Log Lines</h2>
              <p>Preview a few detected lines for each severity level</p>
            </div>
            <div className="sample-block">
              <h3>Error Samples</h3>
              <ul>
                {(currentAnalysis?.sampleLines.error ?? []).map((line, index) => (
                  <li key={`error-${index}`}>{line}</li>
                ))}
              </ul>
            </div>
            <div className="sample-block">
              <h3>Warning Samples</h3>
              <ul>
                {(currentAnalysis?.sampleLines.warning ?? []).map((line, index) => (
                  <li key={`warning-${index}`}>{line}</li>
                ))}
              </ul>
            </div>
            <div className="sample-block">
              <h3>Info Samples</h3>
              <ul>
                {(currentAnalysis?.sampleLines.info ?? []).map((line, index) => (
                  <li key={`info-${index}`}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
