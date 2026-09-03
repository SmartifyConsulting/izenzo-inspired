import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export function SiteHeader({ anchors = false }: { anchors?: boolean }) {
  const links = [
    { label: "Services", href: "#services" },
    { label: "Security", href: "#security" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-[0.18em]">
          <ShieldCheck className="size-5 text-primary" aria-hidden />
          IZENZO
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <div className="hidden items-center gap-6 sm:flex">
            {anchors ? (
              links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </a>
              ))
            ) : (
              links.map((l) => (
                <Link
                  key={l.label}
                  to="/"
                  hash={l.href.slice(1)}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))
            )}
            <Link
              to="/about"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              About
            </Link>
          </div>
          <a
            href="#contact"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get Started
          </a>
        </nav>
      </div>
    </header>
  );
}
