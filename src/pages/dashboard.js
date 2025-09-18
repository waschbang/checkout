import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import axios from "axios";
import { Dialog } from "@headlessui/react";

// EmployeeDetails component
function EmployeeDetails({ isOpen, onClose, employee, loading }) {
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b border-gray-100">
            Employee Details
          </Dialog.Title>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600">Loading employee details...</p>
            </div>
          ) : employee ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 text-lg mb-2">{employee.username}</h3>
                <p className="text-blue-600 text-sm">{employee.category}</p>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Location:</span>
                  <span className="font-medium text-gray-800">{employee.location}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">City:</span>
                  <span className="font-medium text-gray-800">{employee.city}</span>
                </div>
                <div className="pt-2">
                  <p className="text-gray-500 mb-1">Address:</p>
                  <p className="text-gray-800 bg-gray-50 p-3 rounded-md">
                    {employee.address}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No employee data available</p>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default function DashboardPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL | QR | ONLINE
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [employeeDetails, setEmployeeDetails] = useState(null);
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
  const [redeemStatus, setRedeemStatus] = useState({ success: null, message: '' });
  const [loadingEmployee, setLoadingEmployee] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return; // Prevent multiple submissions
    
    setLoading(true);
    setError("");
    
    try {
      const response = await axios.post(
        "https://imagine-sable.vercel.app/auth/login",
        JSON.stringify({
          username: username.trim().toUpperCase(),
          pass: password
        }),
        {
          headers: {
            'Content-Type': 'application/json'
          },
          validateStatus: (status) => status < 500, // Don't throw for 4xx errors
          timeout: 10000 // 10 second timeout
        }
      );
      
      console.log('Login response:', response.data); // Debug log
      
      if (response.data?.ok && response.data.employee) {
        setAuthed(true);
        window.localStorage.setItem("imagine_admin_authed", response.data.employee.username);
        window.localStorage.setItem("imagine_employee", JSON.stringify(response.data.employee));
        setError("");
      } else {
        const errorMessage = response.data?.message || 
                           (response.status === 401 ? "Invalid username or password" : 
                           response.status === 404 ? "Authentication service not found" :
                           "Login failed. Please try again.");
        setError(errorMessage);
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err.code === 'ECONNABORTED' 
        ? "Request timed out. Please check your connection."
        : err.message?.includes('Network Error')
          ? "Network error. Please check your connection."
          : "An unexpected error occurred. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // Restore auth from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const username = window.localStorage.getItem("imagine_admin_authed");
        if (username) {
          setUsername(username);
          setAuthed(true);
        }
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

  async function fetchEmployeeDetails(username) {
    if (!username) return null;
    setLoadingEmployee(true);
    try {
      const { data } = await axios.get(
        `https://imagine-sable.vercel.app/auth/employee/${encodeURIComponent(username)}`,
        { 
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return data?.ok ? data.employee : null;
    } catch (error) {
      console.error("Failed to fetch employee details:", error);
      return null;
    } finally {
      setLoadingEmployee(false);
    }
  }

  async function handleRedeem(phone) {
    if (!authed || !phone) return;
    setLoading(true);
    setRedeemStatus({ success: null, message: '' });
    
    try {
      const response = await axios.post(
        "https://imagine-sable.vercel.app/users/redeem",
        {
          phone: phone.toString().trim(),
          redeemby: username
        },
        { 
          headers: { "Content-Type": "application/json" },
          timeout: 15000 
        }
      );
      
      if (response.data?.ok) {
        setRedeemStatus({ success: true, message: 'Redemption successful!' });
        
        // Fetch the redeemed user's details
        if (response.data?.user?.redeemby) {
          const employee = await fetchEmployeeDetails(response.data.user.redeemby);
          if (employee) {
            setEmployeeDetails(employee);
            setIsEmployeeDialogOpen(true);
          }
        }
        
        // Refresh the users list
        await handleRefresh();
      } else {
        setRedeemStatus({ 
          success: false, 
          message: response.data?.message || "Failed to process redemption" 
        });
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err.message || 'Redemption failed';
      console.error("Redeem error:", errorMsg);
      setRedeemStatus({ 
        success: false, 
        message: `Redemption failed: ${errorMsg}` 
      });
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

  // Aggregate stats across users (based on current filters)
  const stats = useMemo(() => {
    const total = filtered.length; // treat each user as one booking
    let playedUsers = 0;
    filtered.forEach((u) => {
      // A user is considered "played" if any of the 7 days is won/lost/played
      const anyPlayed = [1,2,3,4,5,6,7].some((d) => {
        const st = dayStatus(u, d);
        return st.variant === "won" || st.variant === "lost" || st.variant === "played";
      });
      if (anyPlayed) playedUsers += 1;
    });
    const notPlayedUsers = Math.max(0, total - playedUsers);
    return { total, playedUsers, notPlayedUsers };
  }, [filtered]);

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
            <label className="block mb-4">
              <span className="block text-sm font-medium text-gray-700 mb-1">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </label>
            {error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            <div className="mt-4">
              <button
                type="submit"
                disabled={!username || !password || loading}
                className={`w-full h-11 bg-blue-600 text-white font-medium rounded-lg transition-colors ${
                  !username || !password || loading 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-blue-700'
                }`}
                style={{
                  minWidth: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  lineHeight: '1.25rem',
                  fontWeight: 500
                }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging in...
                  </div>
                ) : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <EmployeeDetails 
        isOpen={isEmployeeDialogOpen} 
        onClose={() => setIsEmployeeDialogOpen(false)}
        employee={employeeDetails}
        loading={loadingEmployee}
      />
      
      {/* Redemption Status Toast */}
      {redeemStatus.message && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg ${
          redeemStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {redeemStatus.message}
        </div>
      )}
      
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
          {/* Stats summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-2xl border-2 border-black/20 bg-white p-4">
              <div className="text-xs text-black/60">Total bookings</div>
              <div className="text-2xl font-semibold">{stats.total}</div>
            </div>
            <div className="rounded-2xl border-2 border-black/20 bg-white p-4">
              <div className="text-xs text-black/60">Played</div>
              <div className="text-2xl font-semibold text-blue-700">{stats.playedUsers}</div>
            </div>
            <div className="rounded-2xl border-2 border-black/20 bg-white p-4">
              <div className="text-xs text-black/60">Not played</div>
              <div className="text-2xl font-semibold text-black/70">{stats.notPlayedUsers}</div>
            </div>
          </div>
          <div className="overflow-auto border-2 border-black/20 rounded-2xl">
            <table className="min-w-full text-sm">
              <thead className="bg-black/5">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  <th className="text-left px-4 py-3 font-medium">Phone</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Start</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
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
                      <td className="px-4 py-3 whitespace-nowrap">
                        {(() => {
                          const redeemer = Array.isArray(u?.redeemby)
                            ? (u.redeemby.find((v) => !!v) || null)
                            : (u?.redeemby || null);
                          return redeemer;
                        })() ? (
                          <button
                            onClick={async () => {
                              const redeemer = Array.isArray(u?.redeemby)
                                ? (u.redeemby.find((v) => !!v) || null)
                                : (u?.redeemby || null);
                              if (!redeemer) return;
                              const employee = await fetchEmployeeDetails(redeemer);
                              if (employee) {
                                setEmployeeDetails(employee);
                                setIsEmployeeDialogOpen(true);
                              }
                            }}
                            disabled={loadingEmployee}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              loadingEmployee 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {loadingEmployee ? (
                              <div className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Loading...
                              </div>
                            ) : 'View Details'}
                          </button>
                        ) : (
                          <span className="text-gray-500 text-sm">Not redeemed</span>
                        )}
                      </td>
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
