import { createFileRoute } from "@tanstack/react-router";
import { Fingerprint, Globe2, KeyRound, Lock, PlugZap, ScrollText, Timer } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const TITLE = "IZENZO - Secure Digital Infrastructure & Authentication Services";
const DESCRIPTION =
  "IZENZO - Enterprise-grade secure digital infrastructure and authentication services. Trusted by organisations worldwide for reliable identity management and secure access solutions.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

const trustCards = [
  {
    icon: Lock,
    title: "Enterprise Security",
    body: "Bank-grade security protocols and encryption standards to protect your digital assets.",
  },
  {
    icon: Timer,
    title: "99.9% Uptime",
    body: "Reliable infrastructure with guaranteed availability for mission-critical applications.",
  },
  {
    icon: ScrollText,
    title: "Compliance Ready",
    body: "Built to meet industry standards including SOC 2, GDPR, and enterprise security requirements.",
  },
  {
    icon: Globe2,
    title: "Global Scale",
    body: "Distributed infrastructure designed to serve organisations of any size, anywhere in the world.",
  },
];

const services = [
  {
    icon: Fingerprint,
    title: "Identity Management",
    body: "Comprehensive identity and access management solutions that provide secure, seamless user experiences across all your applications and services.",
  },
  {
    icon: KeyRound,
    title: "Secure Access Control",
    body: "Advanced authentication and authorisation systems that ensure only authorised users can access your critical resources and data.",
  },
  {
    icon: PlugZap,
    title: "API Security",
    body: "Robust API security infrastructure that protects your backend services whilst enabling secure integration with third-party applications.",
  },
];

const securityStats = [
  { value: "256-bit", label: "Encryption" },
  { value: "24/7", label: "Monitoring" },
  { value: "99.9%", label: "Uptime SLA" },
  { value: "SOC 2", label: "Compliant" },
];

function Index() {
  return (
    <div className="min-h-screen">
      <SiteHeader anchors />

      <main>
        <section className="relative overflow-hidden">
          <div className="hero-glow absolute inset-0" aria-hidden />
          <div className="hero-grid absolute inset-0" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-5 py-28 text-center sm:py-36">
            <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
              Secure Authentication for the Modern Enterprise
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Protect your digital assets with our enterprise-grade identity and access management
              solutions. Seamless, secure, and scalable.
            </p>
            <div className="mt-9">
              <a
                href="#contact"
                className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Get Started
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
            Trusted by Organisations Worldwide
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustCards.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
              >
                <Icon className="size-6 text-primary" aria-hidden />
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="services" className="scroll-mt-20 border-t border-border bg-card/30">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
              Core Services
            </h2>
            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {services.map(({ icon: Icon, title, body }) => (
                <article key={title} className="rounded-xl border border-border bg-card p-7">
                  <div className="flex size-11 items-center justify-center rounded-lg bg-primary/15">
                    <Icon className="size-5 text-primary" aria-hidden />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="security" className="scroll-mt-20">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Our Security Commitment
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                We understand that security is not just a feature—it's the foundation of trust. Our
                platform is built with security-first principles, employing industry-leading
                practices to protect your data and ensure compliance with the most stringent
                security standards.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-5">
              {securityStats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-border bg-card p-6 text-center"
                >
                  <p className="text-2xl font-semibold text-primary">{s.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-20 border-t border-border">
          <div className="hero-glow">
            <div className="mx-auto max-w-3xl px-5 py-24 text-center">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-4xl">
                Ready to Secure Your Digital Future?
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
                Join thousands of organisations that trust IZENZO to power their secure digital
                infrastructure. Our team of security experts is ready to help you implement
                enterprise-grade authentication and identity management solutions.
              </p>
              <a
                href="mailto:info@izenzo.com"
                className="mt-9 inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Contact Us
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
