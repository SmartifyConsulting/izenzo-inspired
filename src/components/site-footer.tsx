import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-semibold tracking-[0.18em]">
            <ShieldCheck className="size-5 text-primary" aria-hidden />
            IZENZO
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Enterprise-grade secure digital infrastructure and authentication services for the
            modern web. An INFONICA LIMITED company.
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground">Quick Links</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {["Services", "Security", "Contact", "Pricing", "Documentation"].map((l) => (
              <li key={l}>
                <Link to="/" className="transition-colors hover:text-foreground">
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground">Company</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/about" className="transition-colors hover:text-foreground">
                About Us
              </Link>
            </li>
            {["Careers", "Blog (Coming Soon)", "Press", "Partners"].map((l) => (
              <li key={l}>
                <Link to="/" className="transition-colors hover:text-foreground">
                  {l}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground">Newsletter</h2>
          <p className="mt-4 text-sm text-muted-foreground">
            Subscribe to our newsletter for the latest updates and news.
          </p>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="you@company.com"
              className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Subscribe
            </button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            We respect your privacy. Unsubscribe at any time.
          </p>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} IZENZO is a trading name of INFONICA LIMITED. All rights
            reserved.
          </p>
          <div className="flex items-center gap-2">
            <Link to="/privacy" className="transition-colors hover:text-foreground">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms" className="transition-colors hover:text-foreground">
              Terms of Service
            </Link>
            <span>•</span>
            <Link to="/cookies" className="transition-colors hover:text-foreground">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
