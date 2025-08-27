import Link from "next/link";

export default function PremiumSuccess() {
  const targetPhone = "919321119277"; // +91 93211 19277 formatted for wa.me
  const waHref = `https://wa.me/${targetPhone}?text=${encodeURIComponent("Imagine")}`;
  return (
    <div className="min-h-screen p-8 sm:p-20 grid place-items-center">
      <div className="w-full max-w-xl text-center border-2 border-black/20 rounded-2xl p-10 shadow-sm bg-background text-foreground">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-semibold mb-2">Prebooking confirmed</h1>
        <p className="text-black/70 mb-6">
          Thanks for prebooking iPhone 17 with Imagine Premium. We sent a confirmation email with your details.
        </p>
        <div className="flex gap-3 justify-center flex-col sm:flex-row">
          <Link href="/" className="h-11 px-5 rounded-full border border-black/[.08] dark:border-white/[.145] inline-flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10">
            Go home
          </Link>
          <Link href="/premium/checkout" className="h-11 px-5 rounded-full bg-foreground text-background inline-flex items-center justify-center hover:opacity-90">
            Book another
          </Link>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 px-5 rounded-full border border-emerald-600 text-emerald-700 inline-flex items-center justify-center hover:bg-emerald-50"
          >
            WhatsApp Rewards
          </a>
        </div>
      </div>
    </div>
  );
}


