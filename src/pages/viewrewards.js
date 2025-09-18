import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import axios from "axios";
import { Dialog } from "@headlessui/react";

// EmployeeDetails component
function EmployeeDetails({ isOpen, onClose, employee }) {
  if (!employee) return null;
  
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-lg bg-white p-6">
          <Dialog.Title className="text-lg font-semibold mb-4">Employee Details</Dialog.Title>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{employee.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Category:</span>
              <span className="font-medium">{employee.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="font-medium">{employee.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">City:</span>
              <span className="font-medium">{employee.city}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Address:</span>
              <span className="font-medium text-right">{employee.address}</span>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default function ViewRewardsPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [confirmPhone, setConfirmPhone] = useState(null); // phone waiting for confirm
  const [redeemingPhone, setRedeemingPhone] = useState(null); // phone currently being redeemed
  const [employeeDetails, setEmployeeDetails] = useState(null); // employee details for view
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
  const [redeemStatus, setRedeemStatus] = useState({ success: null, message: '' });

  // All users will have these 4 rewards by default
  const defaultRewards = useMemo(
    () => [
      { 
        id: 1,
        text: "17% off iPhone accessory bundles (TG, Tekne Case, Tekne Spotfree, Tekne Adapter, Lens Protector)",
        description: "iPhone Accessories Bundle"
      },
      { 
        id: 2,
        text: "8% on your next iPad",
        description: "iPad Discount"
      },
      { 
        id: 3,
        text: "8% on your next Macbook",
        description: "MacBook Discount"
      },
      { 
        id: 4,
        text: "50% off the next iCare service",
        description: "iCare Service Discount"
      }
    ],
    []
  );

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

  function openConfirm(phone, rewardId) {
    setConfirmPhone(`${String(phone || "")}-${rewardId}`);
  }

  async function fetchEmployeeDetails(username) {
    if (!username) return null;
    try {
      const { data } = await axios.get(
        `https://imagine-sable.vercel.app/auth/employee/${encodeURIComponent(username)}`,
        { timeout: 10000 }
      );
      return data?.ok ? data.employee : null;
    } catch (error) {
      console.error("Failed to fetch employee details:", error);
      return null;
    }
  }

  async function confirmRedeem() {
    if (!confirmPhone) return;
    
    // Extract phone and reward ID from confirmPhone (format: "phone-rewardId")
    const [phone, rewardId] = confirmPhone.split('-');
    
    setRedeemingPhone(confirmPhone);
    setRedeemStatus({ success: null, message: '' });
    
    try {
      console.log("[ViewRewards] Redeeming reward for phone:", phone, "reward ID:", rewardId);
      const { data } = await axios.post(
        "https://imagine-sable.vercel.app/users/redeem",
        { 
          phone: phone,
          index: parseInt(rewardId),
          redeemby: username
        },
        { 
          headers: { "Content-Type": "application/json" }, 
          timeout: 15000 
        }
      );
      
      if (!data?.ok || !data?.user) {
        throw new Error(data?.message || 'Redemption failed');
      }

      console.log("[ViewRewards] Reward redemption success:", data);
      setRedeemStatus({ success: true, message: 'Reward redeemed successfully!' });
      
      // Update the UI to show this specific reward as redeemed
      setUsers((prevUsers) =>
        prevUsers.map((user) => {
          if (user.phone !== phone) return user;
          // Prefer the authoritative server response
          const respUser = data.user;
          // Normalize redeemed to an array of strings
          const redeemed = Array.isArray(respUser?.redeemed)
            ? respUser.redeemed.map((v) => String(v))
            : (() => {
                // Fallback: create from local by setting the selected index to true
                const flags = Array(4).fill("false");
                const idx = Math.max(1, Math.min(4, parseInt(rewardId))) - 1;
                flags[idx] = "true";
                return flags;
              })();
          // Normalize redeemby to an array aligned with rewards
          const idx = Math.max(1, Math.min(4, parseInt(rewardId))) - 1;
          let redeemerArr;
          if (Array.isArray(respUser?.redeemby)) {
            redeemerArr = respUser.redeemby;
          } else if (typeof respUser?.redeemby === 'string') {
            // If backend sends a single string, map it for this index
            redeemerArr = Array(4).fill(null);
            redeemerArr[idx] = respUser.redeemby;
          } else {
            // Fallback: set only the current index to username
            redeemerArr = Array(4).fill(null);
            redeemerArr[idx] = username;
          }
          return {
            ...user,
            redeemby: redeemerArr,
            redeemed: redeemed,
            // Keep legacy field in sync (optional)
            redeemedRewards: Array.from(
              new Set([...(user.redeemedRewards || []), parseInt(rewardId)])
            ),
          };
        })
      );
      
      // Show success message
      const i = Math.max(1, Math.min(4, parseInt(rewardId))) - 1;
      const redeemer = (Array.isArray(data?.user?.redeemby) ? data.user.redeemby[i] : data?.user?.redeemby) || data?.redeemby || data?.redeemedBy || username;
      if (redeemer) {
        const employee = await fetchEmployeeDetails(redeemer);
        if (employee) {
          setEmployeeDetails(employee);
          setIsEmployeeDialogOpen(true);
        }
      }
      
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err.message || 'Redemption failed';
      console.error("[ViewRewards] Reward redemption failed:", errorMsg);
      setRedeemStatus({ 
        success: false, 
        message: `Redemption failed: ${errorMsg}` 
      });
    } finally {
      setConfirmPhone(null);
      setRedeemingPhone(false);
    }
  }

  function cancelRedeem() {
    setConfirmPhone(null);
  }

  // On mount, restore auth from localStorage
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
        console.log("[ViewRewards] Fetching users from API...");
        const { data } = await axios.get("https://imagine-sable.vercel.app/users", { timeout: 15000 });
        const list = Array.isArray(data?.users) ? data.users : [];
        console.log("[ViewRewards] Users fetched:", list.length);
        setUsers(list);
      } catch (err) {
        console.error("[ViewRewards] Failed to fetch users:", err?.response?.data || err?.message || err);
        setError("Failed to fetch users. Please try again.");
      } finally {
        console.log("[ViewRewards] Fetching users finished.");
        setLoading(false);
      }
    }
    fetchUsers();
  }, [authed]);

  async function handleRefresh() {
    if (!authed) return;
    setLoading(true);
    try {
      console.log("[ViewRewards] Manual refresh: fetching users...");
      const { data } = await axios.get("https://imagine-sable.vercel.app/users", { timeout: 15000 });
      const list = Array.isArray(data?.users) ? data.users : [];
      console.log("[ViewRewards] Manual refresh: users fetched:", list.length);
      setUsers(list);
    } catch (err) {
      console.error("[ViewRewards] Manual refresh failed:", err?.response?.data || err?.message || err);
      setError("Failed to fetch users. Please try again.");
    } finally {
      console.log("[ViewRewards] Manual refresh finished.");
      setLoading(false);
    }
  }

  function getEligibleRewards(user) {
    // Every user gets all 4 rewards by default
    // Backend returns user.redeemed as an array of strings: ["false","true",...]
    const redeemedFlags = Array.isArray(user?.redeemed)
      ? user.redeemed.map((v) => String(v).toLowerCase() === "true")
      : [];

    // Fallback for older local state where we kept an array of redeemed reward ids
    const redeemedIds = user?.redeemedRewards || [];
    
    return defaultRewards.map((reward) => {
      const byFlags = Boolean(redeemedFlags[reward.id - 1]);
      const byIds = redeemedIds.includes(reward.id);
      return {
        ...reward,
        redeemed: byFlags || byIds,
      };
    });
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      (u?.name || "").toLowerCase().includes(q) || 
      (u?.phone || "").toLowerCase().includes(q)
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
      const rewards = getEligibleRewards(u).map((r) => r.text).join("; ");
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
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <EmployeeDetails 
        isOpen={isEmployeeDialogOpen} 
        onClose={() => setIsEmployeeDialogOpen(false)}
        employee={employeeDetails}
      />
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
              className="h-11 px-4 rounded-xl border-2 border-black/20 bg-white hover:bg-black/5 text-xs cursor-pointer transition-colors duration-150"
            >
              Export CSV
            </button>
            <button
              onClick={handleRefresh}
              className="h-11 px-3 rounded-xl border-2 border-black/20 bg-white hover:bg-black/5 text-xs cursor-pointer transition-colors duration-150"
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
              const rewards = getEligibleRewards(u);
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
                    <div className="text-sm text-black/60">
                      {(() => {
                        const name = Array.isArray(u?.redeemby)
                          ? (u.redeemby.find((v) => !!v) || null)
                          : (u?.redeemby || null);
                        return name ? `Redeemed by: ${name}` : 'Not yet redeemed';
                      })()}
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Available Rewards</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {rewards.map((reward) => (
                        <div 
                          key={`${u.id}-${reward.id}`}
                          className={`p-3 rounded-lg border ${
                            reward.redeemed 
                              ? 'bg-gray-50 border-gray-200' 
                              : 'bg-white border-gray-300 shadow-sm'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="text-sm">
                              <div className="font-medium">{reward.description}</div>
                              <div className="text-black/70 text-xs">{reward.text}</div>
                            </div>
                            {reward.redeemed ? (
                              <button
                                onClick={async () => {
                                  const redeemerName = Array.isArray(u?.redeemby)
                                    ? u.redeemby[reward.id - 1]
                                    : u?.redeemby;
                                  if (!redeemerName) return;
                                  const employee = await fetchEmployeeDetails(redeemerName);
                                  if (employee) {
                                    setEmployeeDetails(employee);
                                    setIsEmployeeDialogOpen(true);
                                  }
                                }}
                                className={`px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700`}
                              >
                                View Details
                              </button>
                            ) : (
                              <button
                                onClick={() => openConfirm(u?.phone, reward.id)}
                                disabled={loading || redeemingPhone === `${u?.phone}-${reward.id}`}
                                className={`px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700`}
                              >
                                {redeemingPhone === `${u?.phone}-${reward.id}` ? 'Processing...' : 'Redeem'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
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
                    className="h-8 px-3 rounded-lg border-2 border-black/20 disabled:opacity-50 text-xs cursor-pointer disabled:cursor-not-allowed hover:bg-black/5 transition-colors duration-150"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-8 px-3 rounded-lg border-2 border-black/20 disabled:opacity-50 text-xs cursor-pointer disabled:cursor-not-allowed hover:bg-black/5 transition-colors duration-150"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {confirmPhone && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center z-50">
          <div className="w-[90%] max-w-sm rounded-2xl bg-white p-5 border-2 border-black/20">
            <h3 className="text-lg font-semibold mb-2">Confirm Redemption</h3>
            <p className="text-sm text-black/70 mb-4">Mark rewards as redeemed for <strong>{confirmPhone}</strong>?</p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={cancelRedeem} disabled={!!redeemingPhone} className="h-9 px-3 rounded-lg border-2 border-black/20 text-xs disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
              <button onClick={confirmRedeem} disabled={!!redeemingPhone} className="h-9 px-3 rounded-lg bg-foreground text-background text-xs disabled:opacity-50 disabled:cursor-not-allowed">
                {redeemingPhone ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Redeeming...
                  </span>
                ) : (
                  "Confirm"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
