import Image from "next/image";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        setAuthed(window.localStorage.getItem("imagine_admin_authed") === "true");
        const onStorage = (e) => {
          if (e.key === "imagine_admin_authed") {
            setAuthed(e.newValue === "true");
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
            <button
              onClick={handleLogout}
              className="ml-2 h-9 px-3 rounded-lg bg-foreground text-background font-medium hover:opacity-90 text-xs"
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
