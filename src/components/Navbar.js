import Image from "next/image";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const storedUsername = window.localStorage.getItem("imagine_admin_authed");
        setAuthed(!!storedUsername);
        setUsername(storedUsername || '');
        
        const onStorage = (e) => {
          if (e.key === "imagine_admin_authed") {
            const newUsername = e.newValue;
            setAuthed(!!newUsername);
            setUsername(newUsername || '');
          }
        };
        
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
      }
    } catch {}
  }, []);

  function handleLogout() {
    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("imagine_admin_authed");
        // Force a reload so pages remount and show login
        window.location.reload();
      }
    } catch {}
  }

  return (
    <header className="border-b border-black/[.08]">
      <div className="mx-auto w-full max-w-6xl flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <Image src="/logo-imagine.png" alt="Imagine" width={96} height={28} priority />
        </div>
        <nav className="hidden sm:flex items-center gap-3 text-sm">
          <a className="hover:underline" href="/viewrewards">View Rewards</a>
          <a className="hover:underline" href="/dashboard">Dashboard</a>
          {authed && (
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-600 font-medium">Welcome back,</p>
                <p className="text-sm font-semibold text-blue-800">{username}</p>
              </div>
              <button
                onClick={handleLogout}
                className="h-9 px-4 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
