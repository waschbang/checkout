export default function Footer() {
  return (
    <footer className="border-t border-black/[.08] bg-background">
      <div className="mx-auto w-full max-w-6xl p-8">
        <div className="text-center text-xs text-black/60">
          © {new Date().getFullYear()} Imagine. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
