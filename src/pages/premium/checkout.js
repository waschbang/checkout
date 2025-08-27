import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import axios from "axios";

export default function PremiumCheckout() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [model, setModel] = useState("iPhone 17");
  const [loading, setLoading] = useState(false);
  const [color, setColor] = useState("Natural Titanium");
  const [storage, setStorage] = useState("128 GB");

  const basePriceByModel = {
    "iPhone 17": 999,
    "iPhone 17 Pro": 1199,
    "iPhone 17 Pro Max": 1299,
  };
  const storageAddOn = {
    "128 GB": 0,
    "256 GB": 100,
    "512 GB": 300,
    "1 TB": 500,
  };

  const unitPrice = useMemo(() => {
    return (basePriceByModel[model] || 0) + (storageAddOn[storage] || 0);
  }, [model, storage]);

  const totalPrice = useMemo(() => {
    return unitPrice; // Prebook is limited to 1 unit
  }, [unitPrice]);

  const inputClass = "w-full h-11 rounded-xl border-2 border-black/20 bg-transparent px-3 outline-none focus:ring-2 focus:ring-black/10 focus:border-black/40";

  function normalizeIndianNumber(input) {
    const digits = (input || "").replace(/\D/g, "");
    if (digits.startsWith("91")) return digits;
    if (digits.startsWith("0")) return `91${digits.substring(1)}`;
    return `91${digits}`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const normalized = normalizeIndianNumber(phone);

      const options = {
        method: "POST",
        url: "https://apis.aisensy.com/project-apis/v1/project/671a4cf55b514e0bfccba32d/messages",
        // url: "https://apis.aisensy.com/project-apis/v1/project/68778bfb52435a133a4b3039/messages",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-AiSensy-Project-API-Pwd": "81175b599c8d27dd2fd65", 
          // "X-AiSensy-Project-API-Pwd": "56e47afac4e7fcbcf0806",

        },
        data: {
          to: normalized,
          type: "template",
          template: {
            language: { policy: "deterministic", code: "en" },
            name: "welcome_message",
            components: [
              { type: "body", parameters: [{ type: "text", text: "" }] },
            ],
          },
        },
      };

      const { data } = await axios.request(options);
      console.log("AiSensy success:", data);
      // Continue to success page with phone for WhatsApp button
      router.push(`/premium/success?phone=${encodeURIComponent(normalized)}`);
    } catch (error) {
      console.error("AiSensy error:", error?.response?.data || error?.message || error);
      // Navigate to success page anyway with normalized phone so user can reach WhatsApp
      const fallback = normalizeIndianNumber(phone);
      router.push(`/premium/success?phone=${encodeURIComponent(fallback)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="border-b border-black/[.08]">
        <div className="mx-auto w-full max-w-6xl flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-imagine.png"
              alt="Imagine"
              width={96}
              height={28}
              priority
            />
          </div>
          <nav className="hidden sm:flex items-center gap-4 text-sm">
            <a className="hover:underline" href="/premium/checkout">Prebook</a>
            <a className="hover:underline" href="#benefits">Benefits</a>
            <a className="hover:underline" href="#support">Support</a>
          </nav>
        </div>
      </header>

      <main className="flex-1 p-6 sm:p-12">
        <div className="mx-auto w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border-2 border-black/20 rounded-2xl p-6 sm:p-8 bg-background/60 backdrop-blur-sm">
          <div className="mb-3 flex justify-center">
            <Image
              src="/iphone-pink.png"
              alt={`${model} in ${color}`}
              width={800}
              height={1000}
              className="h-auto w-full max-w-[44rem]"
              priority
            />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-black/60 dark:text-white/60">Selected</div>
                <div className="text-lg font-medium">{model}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-black/60 dark:text-white/60">Unit price</div>
                <div className="text-lg font-semibold">${unitPrice.toLocaleString()}</div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm mb-2">Color</label>
              <div className="flex flex-wrap gap-2">
                {["Natural Titanium", "Black", "Blue", "Pink"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-9 px-4 rounded-full border transition-colors ${
                      color === c
                        ? "bg-foreground text-background border-2 border-black/20"
                        : "border-2 border-black/20 hover:bg-black/5"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm mb-2">Storage</label>
              <div className="flex flex-wrap gap-2">
                {["128 GB", "256 GB", "512 GB", "1 TB"].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStorage(s)}
                    className={`h-9 px-4 rounded-full border transition-colors ${
                      storage === s
                        ? "bg-foreground text-background border-2 border-black/20"
                        : "border-2 border-black/20 hover:bg-black/5"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-2xl border-2 border-black/20 p-4">
              <div className="flex items-center justify-between text-sm">
                <span>Device</span>
                <span>${basePriceByModel[model].toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span>Storage add‑on</span>
                <span>${storageAddOn[storage].toLocaleString()}</span>
              </div>
              <div className="border-t border-black/20 mt-4 pt-3 flex items-center justify-between">
                <span className="font-medium">Total</span>
                <span className="text-xl font-semibold">${totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <ul id="benefits" className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-black/70 dark:text-white/70">
              <li className="flex items-center gap-2">✔ Priority delivery on launch</li>
              <li className="flex items-center gap-2">✔ Early store pickup option</li>
              <li className="flex items-center gap-2">✔ 24×7 premium support</li>
              <li className="flex items-center gap-2">✔ Free case with prebooking</li>
            </ul>
          </div>
        </div>

        <div className="border-2 border-black/20 rounded-2xl p-6 sm:p-8 bg-background/60 backdrop-blur-sm h-fit">
          <h2 className="text-xl font-semibold mb-4">Contact details</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1" htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                placeholder="John Doe"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm mb-1" htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                  placeholder="+1 555 123 4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1" htmlFor="model">Model</label>
              <select
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={inputClass}
              >
                <option>iPhone 17</option>
                <option>iPhone 17 Pro</option>
                <option>iPhone 17 Pro Max</option>
              </select>
            </div>

            <div className="text-sm text-black/70 dark:text-white/70">
              <div>Color: <span className="font-medium">{color}</span></div>
              <div>Storage: <span className="font-medium">{storage}</span></div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full bg-foreground text-background font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? "Processing…" : `Prebook • $${totalPrice.toLocaleString()}`}
            </button>
          </form>
        </div>
        </div>
      </main>

      <footer className="border-t border-black/[.08] bg-background">
        <div className="mx-auto w-full max-w-6xl p-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm" id="support">
            <div>
              <div className="font-medium mb-3">Company</div>
              <ul className="space-y-2 text-black/70">
                <li><a className="hover:underline" href="#">About</a></li>
                <li><a className="hover:underline" href="#">Careers</a></li>
                <li><a className="hover:underline" href="#">Stores</a></li>
              </ul>
            </div>
            <div>
              <div className="font-medium mb-3">Support</div>
              <ul className="space-y-2 text-black/70">
                <li><a className="hover:underline" href="#">Help Center</a></li>
                <li><a className="hover:underline" href="#">Order Status</a></li>
                <li><a className="hover:underline" href="#">Contact us</a></li>
              </ul>
            </div>
            <div>
              <div className="font-medium mb-3">Services</div>
              <ul className="space-y-2 text-black/70">
                <li><a className="hover:underline" href="#">Trade‑in</a></li>
                <li><a className="hover:underline" href="#">AppleCare</a></li>
                <li><a className="hover:underline" href="#">Financing</a></li>
              </ul>
            </div>
            <div>
              <div className="font-medium mb-3">Follow</div>
              <ul className="space-y-2 text-black/70">
                <li><a className="hover:underline" href="#">Instagram</a></li>
                <li><a className="hover:underline" href="#">Twitter</a></li>
                <li><a className="hover:underline" href="#">YouTube</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 text-xs text-black/60">© {new Date().getFullYear()} Imagine. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}


