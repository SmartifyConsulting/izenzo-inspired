# IZENZO site rebuild

Recreate www.izenzo.com as a TanStack Start app with the same page structure and the same copy, in a dark enterprise-security aesthetic (deep navy, blue accent, Inter) matching the original.

## Pages

- `/` — Home: nav (Services, Security, Contact, Get Started), hero "Secure Authentication for the Modern Enterprise", "Trusted by Organisations Worldwide" four-card band (Enterprise Security, 99.9% Uptime, Compliance Ready, Global Scale), Core Services (Identity Management, Secure Access Control, API Security), Security Commitment section with 256-bit / 24/7 / 99.9% / SOC 2 stats, closing CTA "Ready to Secure Your Digital Future?", footer with Quick Links, Company, Newsletter signup, legal links.
- `/about` — Building Trust in a Digital World; About IZENZO ("A brand of INFONICA LIMITED"), Our Mission, Our Story, stats (250+ clients, 99.99% uptime, 24/7 support, 50+ countries), Our Values (4), Our Expertise (3 teams), Our Commitment, back-to-home link.
- `/privacy` — Privacy Policy, 12 numbered sections, "Last updated: 1st January 2024".
- `/terms` — Terms of Service, all numbered sections, "Last updated: 1st January 2024".
- `/cookies` — Cookie Policy, sections incl. cookie types, "Last updated: 12th June 2024".

All copy is taken verbatim from the live site (British spellings kept). Home in-page anchors (#services, #security, #contact) scroll within the home page, as on the original.

## Technical notes

- Routes: `src/routes/index.tsx`, `about.tsx`, `privacy.tsx`, `terms.tsx`, `cookies.tsx`; shared `Header`/`Footer` components under `src/components/`, plus a shared `LegalPage` layout for the three policy pages.
- Design tokens (navy background, blue primary, muted slate text) added to `src/styles.css`; Inter loaded via a `<link>` in `__root.tsx`. No hardcoded colour utilities.
- Per-route `head()` with the original titles/descriptions, plus og/twitter tags.
- Newsletter form is presentational only (no backend) — matches the original static site. Say the word if you want it to actually capture emails.
- Original's particles.js hero background is reproduced as a lightweight CSS/canvas-free animated gradient + grid overlay rather than an extra library dependency.
