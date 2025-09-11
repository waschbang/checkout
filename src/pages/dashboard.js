import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import axios from "axios";

export default function DashboardPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL | QR | ONLINE
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  function handleSubmit(e) {
    e.preventDefault();
    if (username === "admin" && password === "admin") {
      setAuthed(true);
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem("imagine_admin_authed", "true");
        }
      } catch {}
      setError("");
    } else {
      setError("Invalid credentials. Try admin / admin.");
    }
  }

  // Restore auth from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const flag = window.localStorage.getItem("imagine_admin_authed");
        if (flag === "true") setAuthed(true);
      }
    } catch {}
  }, []);

  // Fetch users after authentication
  useEffect(() => {
    async function fetchUsers() {
      if (!authed) return;
      setLoading(true);
      try {
        const { data } = await axios.get("https://imagine-sable.vercel.app/users", { timeout: 15000 });
        const list = Array.isArray(data?.users) ? data.users : [];
        setUsers(list);
      } catch (err) {
        console.error("Failed to fetch users:", err?.message || err);
        setError("Failed to fetch users. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [authed]);

  async function handleRefresh() {
    if (!authed) return;
    setLoading(true);
    try {
      const { data } = await axios.get("https://imagine-sable.vercel.app/users", { timeout: 15000 });
      const list = Array.isArray(data?.users) ? data.users : [];
      setUsers(list);
    } catch (err) {
      console.error("Failed to fetch users:", err?.message || err);
      setError("Failed to fetch users. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Normalize usertype text to either QR or ONLINE when filtering
  function normalizeType(val) {
    const t = String(val || "").trim().toUpperCase();
    if (t === "QR") return "QR";
    if (t === "ONLINE" || t === "WEB" || t === "APP") return "ONLINE";
    return "";
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery = !q || (u?.name || "").toLowerCase().includes(q) || (u?.phone || "").toLowerCase().includes(q);
      const type = normalizeType(u?.usertype);
      const matchesType = typeFilter === "ALL" || type === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [users, query, typeFilter]);

  // Reset pagination when filters/search change
  useEffect(() => {
    setPage(1);
  }, [query, typeFilter, users]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);


  function exportCSV() {
    const headers = [
      "Name","Phone","Type","Start",
      "D1","D2","D3","D4","D5","D6","D7"
    ];
    const lines = [headers.join(",")];
    filtered.forEach((u) => {
      const startedStr = u?.start_date ? new Date(u.start_date).toISOString().slice(0,10) : "";
      const type = normalizeType(u?.usertype);
      const dayCells = [1,2,3,4,5,6,7].map((d) => dayStatus(u, d).label);
      const rowVals = [u?.name || "", u?.phone || "", type, startedStr, ...dayCells];
      const row = rowVals.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
      lines.push(row);
    });
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Derive day-wise status for 1..7
  function dayStatus(user, dayIndex) {
    // prefer daily_results tokens like "1W", "1L", "1A"
    const token = Array.isArray(user?.daily_results) ? user.daily_results.find((t) => typeof t === "string" && t.startsWith(String(dayIndex))) : null;
    if (typeof token === "string") {
      const letter = token.replace(/^\d+/, "").toUpperCase();
      if (letter === "W") return { label: "Won", variant: "won" };
      if (letter === "L") return { label: "Lost", variant: "lost" };
      if (letter === "A") return { label: "Absent", variant: "absent" };
    }
    // fallback to message_sent for played/absent info
    const msg = Array.isArray(user?.message_sent) ? user.message_sent[dayIndex - 1] : undefined;
    if (msg === "played") return { label: "Played", variant: "played" };
    if (msg === "absent") return { label: "Absent", variant: "absent" };
    return { label: "Not played", variant: "idle" };
  }

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Dashboard</h1>
          <p style={{ color: "#666", marginBottom: 16 }}>Login to continue</p>
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 14 }}>Username</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                style={{ padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8 }}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span style={{ fontSize: 14 }}>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="admin"
                autoComplete="current-password"
                style={{ padding: "10px 12px", border: "1px solid #ddd", borderRadius: 8 }}
              />
            </label>
            {error ? (
              <div style={{ color: "#d00", fontSize: 14 }}>{error}</div>
            ) : null}
            <button type="submit" style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid #222", background: "#111", color: "#fff", fontWeight: 600 }}>
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 p-6 sm:p-12 mx-auto w-full max-w-7xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4">Admin Dashboard</h1>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-5">
          <div className="flex items-center gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or number"
              className="w-full sm:w-[320px] h-11 rounded-xl border-2 border-black/20 bg-transparent px-3 outline-none focus:ring-2 focus:ring-black/10 focus:border-black/40"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-11 rounded-xl border-2 border-black/20 bg-transparent px-3 outline-none focus:ring-2 focus:ring-black/10 focus:border-black/40"
            >
              <option value="ALL">All types</option>
              <option value="QR">QR</option>
              <option value="ONLINE">Online</option>
            </select>
            <button onClick={exportCSV} className="h-11 px-4 rounded-xl border-2 border-black/20 bg-white hover:bg-black/5 text-xs">Export CSV</button>
            <button onClick={handleRefresh} className="h-11 px-3 rounded-xl border-2 border-black/20 bg-white hover:bg-black/5 text-xs">Refresh</button>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-black/60 hidden sm:block">Total: {filtered.length} users</div>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value) || 20)}
              className="h-11 rounded-xl border-2 border-black/20 bg-transparent px-3"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="min-h-[40vh] grid place-items-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 rounded-full border-2 border-black/20 border-t-black animate-spin" />
              <div className="text-black/70 text-sm">Loading users…</div>
            </div>
          </div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <>
          <div className="overflow-auto border-2 border-black/20 rounded-2xl">
            <table className="min-w-full text-sm">
              <thead className="bg-black/5">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Phone</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Start</th>
                  {[1,2,3,4,5,6,7].map((d) => (
                    <th key={d} className="text-center px-2 py-3 font-medium">D{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((u) => {
                  const started = u?.start_date ? new Date(u.start_date) : null;
                  const startedStr = started ? started.toLocaleDateString() : "—";
                  const type = normalizeType(u?.usertype) || "—";
                  return (
                    <tr key={u.id} className="border-t border-black/10">
                      <td className="px-4 py-3 whitespace-nowrap font-medium">{u?.name || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{u?.phone || "—"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{type}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{startedStr}</td>
                      {[1,2,3,4,5,6,7].map((d) => {
                        const st = dayStatus(u, d);
                        const cls = st.variant === "won" ? "bg-emerald-100 text-emerald-800"
                          : st.variant === "lost" ? "bg-red-100 text-red-800"
                          : st.variant === "played" ? "bg-blue-100 text-blue-800"
                          : st.variant === "absent" ? "bg-gray-200 text-gray-700"
                          : "bg-white text-black/70 border";
                        return (
                          <td key={`${u.id}-d${d}`} className="px-2 py-2 text-center">
                            <span className={`inline-block px-2 py-1 rounded-full text-[11px] border-2 border-black/10 ${cls}`}>{st.label}</span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {!filtered.length && (
                  <tr>
                    <td colSpan={11} className="px-4 py-6 text-center text-black/60">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!!filtered.length && (
            <div className="flex items-center justify-between pt-3">
              <div className="text-xs text-black/60">Page {page} of {totalPages} • Showing {(page-1)*pageSize + 1}–{Math.min(page*pageSize, filtered.length)} of {filtered.length}</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="h-8 px-3 rounded-lg border-2 border-black/20 disabled:opacity-50 text-xs">Prev</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="h-8 px-3 rounded-lg border-2 border-black/20 disabled:opacity-50 text-xs">Next</button>
              </div>
            </div>
          )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
