import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import axios from "axios";

export default function ViewRewardsPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Rewards mapping by day index (1-7) based on the UI you shared
  const rewardsByDay = useMemo(
    () => ({
      1: "17% off iPhone accessory bundles (TG, Tekne Case, Tekne Spotfree, Tekne Adapter, Lens Protector)",
      2: "8% on your next iPad",
      3: "8% on your next Macbook",
      4: "50% off the next iCare service",
      5: "17 AirPods for 17 lucky winners",
      6: "71 diamond studs for 71 lucky winners",
      7: "A Maldives couple trip worth nearly ₹3 lakhs",
    }),
    []
  );

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

  // On mount, restore auth from localStorage
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

  function getEligibleRewards(dailyResults) {
    // dailyResults is an array like ["1W", "2L", "3W", null, ...]
    if (!Array.isArray(dailyResults)) return [];
    const rewards = [];
    for (const token of dailyResults) {
      if (typeof token !== "string") continue;
      const match = token.match(/^(\d+)([A-Z])$/i);
      if (!match) continue;
      const day = parseInt(match[1], 10);
      const status = (match[2] || "").toUpperCase();
      if (status === "W" && rewardsByDay[day]) {
        rewards.push({ day, text: rewardsByDay[day] });
      }
    }
    // Ensure unique rewards by day in case of duplicates
    const seen = new Set();
    return rewards.filter((r) => {
      const key = r.day;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      (u?.name || "").toLowerCase().includes(q) || (u?.phone || "").toLowerCase().includes(q)
    );
  }, [users, query]);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [query, users]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  function exportCSV() {
    const headers = ["Name", "Phone", "Start Date", "Rewards"];
    const lines = [headers.join(",")];
    filtered.forEach((u) => {
      const rewards = getEligibleRewards(u?.daily_results).map((r) => r.text).join("; ");
      const startedStr = u?.start_date ? new Date(u.start_date).toISOString() : "";
      const row = [u?.name || "", u?.phone || "", startedStr, rewards]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`) // CSV escape
        .join(",");
      lines.push(row);
    });
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rewards_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>View Rewards</h1>
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
      <main className="flex-1 p-6 sm:p-12 mx-auto w-full max-w-6xl">
        <h1 className="text-2xl sm:text-3xl font-bold mb-3">Rewards</h1>

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or number..."
            className="w-full max-w-md h-11 rounded-xl border-2 border-black/20 bg-transparent px-3 outline-none focus:ring-2 focus:ring-black/10 focus:border-black/40"
          />
            <button
              onClick={exportCSV}
              className="h-11 px-4 rounded-xl border-2 border-black/20 bg-white hover:bg-black/5 text-xs"
            >
              Export CSV
            </button>
            <button
              onClick={handleRefresh}
              className="h-11 px-3 rounded-xl border-2 border-black/20 bg-white hover:bg-black/5 text-xs"
            >
              Refresh
            </button>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value) || 10)}
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
          <div className="space-y-4">
            {paginated.map((u) => {
              const rewards = getEligibleRewards(u?.daily_results);
              const started = u?.start_date ? new Date(u.start_date) : null;
              const startedStr = started ? started.toLocaleString() : "—";
              return (
                <div key={u.id} className="border-2 border-black/20 rounded-2xl p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold">{u?.name || "—"}</div>
                      <div className="text-sm text-black/70">{u?.phone || "—"}</div>
                      <div className="text-sm text-black/60 mt-1">Start: {startedStr}</div>
                    </div>
                    <button
                      className="h-10 px-4 rounded-full bg-foreground text-background font-medium hover:opacity-90 self-start"
                      onClick={() => alert(`Redeemed for ${u?.name || u?.phone}`)}
                    >
                      Redeem
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Eligible Rewards</div>
                    {rewards.length ? (
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {rewards.map((r) => (
                          <li key={`${u.id}-${r.day}`}>{r.text}</li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-black/60">No rewards yet</div>
                    )}
                  </div>
                </div>
              );
            })}

            {!filtered.length && (
              <div className="text-black/60">No users found.</div>
            )}
            {!!filtered.length && (
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-black/60">
                  Page {page} of {totalPages} • Showing {(page-1)*pageSize + 1}–{Math.min(page*pageSize, filtered.length)} of {filtered.length}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8 px-3 rounded-lg border-2 border-black/20 disabled:opacity-50 text-xs"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-8 px-3 rounded-lg border-2 border-black/20 disabled:opacity-50 text-xs"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
