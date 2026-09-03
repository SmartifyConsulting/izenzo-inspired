import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Lightbulb, ShieldCheck, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

const TITLE = "About Us - IZENZO";
const DESCRIPTION =
  "Pioneering secure digital infrastructure solutions that empower organisations to thrive in an increasingly connected landscape.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

const stats = [
  { value: "250+", label: "Enterprise Clients" },
  { value: "99.99%", label: "Uptime" },
  { value: "24/7", label: "Support" },
  { value: "50+", label: "Countries Served" },
];

const values = [
  {
    icon: ShieldCheck,
    title: "Security First",
    body: "We believe security isn't a feature—it's a fundamental requirement. Every solution we build is designed with security as the foundation, not an afterthought.",
  },
  {
    icon: Users,
    title: "User-Centric Design",
    body: "We create solutions that people can actually use. Our products combine enterprise-grade security with intuitive interfaces that don't require a manual to understand.",
  },
  {
    icon: Eye,
    title: "Transparency",
    body: "We're open about how we operate because trust is earned through transparency. Our clients know exactly what we're doing to protect their digital assets.",
  },
  {
    icon: Lightbulb,
    title: "Continuous Innovation",
    body: "In the fast-moving world of cybersecurity, standing still means falling behind. We're committed to continuous improvement and staying ahead of emerging threats.",
  },
];

const expertise = [
  {
    title: "Security Specialists",
    body: "Our security team brings expertise in threat analysis, penetration testing, and secure system design, ensuring our solutions meet the highest security standards.",
  },
  {
    title: "Engineering Excellence",
    body: "Our engineering team combines deep technical knowledge with a passion for creating robust, scalable authentication solutions.",
  },
  {
    title: "Customer Success",
    body: "Dedicated professionals who ensure our clients receive exceptional support and guidance at every step of their security journey.",
  },
];

function About() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div className="hero-glow absolute inset-0" aria-hidden />
          <div className="relative mx-auto max-w-4xl px-5 py-24 text-center">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
              Building Trust in a Digital World
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Pioneering secure digital infrastructure solutions that empower organisations to
              thrive in an increasingly connected landscape.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">About IZENZO</h2>
          <p className="mt-2 text-sm text-primary">A brand of INFONICA LIMITED</p>

          <div className="mt-10 grid gap-10 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-7">
              <h3 className="text-lg font-semibold">Our Mission</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                We're committed to redefining digital trust through innovative authentication and
                security solutions. We believe in a future where technology enables, rather than
                complicates, secure digital experiences for everyone.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Our Story</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Founded in 2018, IZENZO emerged from a simple yet powerful idea: digital security
                should be robust yet invisible, comprehensive yet easy to use. What began as a small
                team of security experts has grown into a trusted partner for organisations across
                the globe.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Our journey has been shaped by the evolving challenges of cybersecurity, and we've
                remained at the forefront by anticipating industry shifts and adapting our solutions
                to meet the needs of an increasingly digital world.
              </p>
            </div>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-card p-6 text-center">
                <p className="text-2xl font-semibold text-primary">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-card/30">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <h2 className="text-center text-2xl font-semibold tracking-tight sm:text-3xl">
              Our Values
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {values.map(({ icon: Icon, title, body }) => (
                <article key={title} className="rounded-xl border border-border bg-card p-7">
                  <Icon className="size-6 text-primary" aria-hidden />
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Our Expertise</h2>
          <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            IZENZO is powered by a world-class team of security professionals, cryptographers, and
            technology experts. Our collective experience spans decades in the fields of
            cybersecurity, identity management, and enterprise software development.
          </p>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {expertise.map((e) => (
              <article key={e.title} className="rounded-xl border border-border bg-card p-7">
                <h3 className="text-base font-semibold">{e.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{e.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-border">
          <div className="hero-glow">
            <div className="mx-auto max-w-3xl px-5 py-20 text-center">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Our Commitment</h2>
              <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                As we continue to grow and evolve, our commitment remains the same: to provide our
                clients with the most secure, reliable, and user-friendly authentication solutions
                available. We're not just building products—we're building the foundation for a more
                secure digital future.
              </p>
              <p className="mt-4 text-sm text-foreground">
                Join us on our mission to create a more secure digital world.
              </p>
              <div className="mt-8">
                <Link
                  to="/"
                  className="text-sm text-primary transition-colors hover:text-primary/80"
                >
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
