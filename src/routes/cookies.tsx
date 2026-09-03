import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, List, Section, SubHeading } from "@/components/legal-page";

const TITLE = "Cookie Policy - IZENZO";
const DESCRIPTION =
  "How IZENZO uses cookies and similar tracking technologies on our website and services.";

export const Route = createFileRoute("/cookies")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/cookies" },
    ],
    links: [{ rel: "canonical", href: "/cookies" }],
  }),
  component: Cookies,
});

const firstParty = [
  ["session_id", "Maintains your session on our website", "Session"],
  ["cookie_consent", "Stores your cookie preferences", "1 year"],
];

const thirdParty = [
  ["Google Analytics", "Website analytics and visitor statistics"],
  ["Cloudflare", "Security and performance optimization"],
];

function Cookies() {
  return (
    <LegalPage
      title="Cookie Policy"
      subtitle="This policy applies to IZENZO, a brand of INFONICA LIMITED"
      updated="Last updated: 12th June 2024"
    >
      <Section heading="1. Introduction">
        <p>
          This Cookie Policy explains how IZENZO ("we", "our", or "us") uses cookies and similar
          tracking technologies when you visit our website or use our services. By using our
          website, you consent to the use of cookies as described in this policy.
        </p>
      </Section>

      <Section heading="2. What Are Cookies?">
        <p>
          Cookies are small text files that are placed on your computer or device when you visit a
          website. They are widely used to make websites work more efficiently and to provide
          information to the website owners.
        </p>
      </Section>

      <Section heading="3. How We Use Cookies">
        <p>We use cookies for the following purposes:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="text-foreground">Essential Cookies:</span> Necessary for the website to
            function and cannot be switched off.
          </li>
          <li>
            <span className="text-foreground">Performance Cookies:</span> Help us understand how
            visitors interact with our website.
          </li>
          <li>
            <span className="text-foreground">Functionality Cookies:</span> Enable enhanced
            functionality and personalization.
          </li>
          <li>
            <span className="text-foreground">Targeting/Advertising Cookies:</span> Used to make
            advertising messages more relevant to you.
          </li>
        </ul>
      </Section>

      <Section heading="4. Types of Cookies We Use">
        <SubHeading>4.1 First-party Cookies</SubHeading>
        <p>These are set by our website and can only be read by our site.</p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-card text-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Purpose</th>
                <th className="px-4 py-2 font-medium">Duration</th>
              </tr>
            </thead>
            <tbody>
              {firstParty.map(([name, purpose, duration]) => (
                <tr key={name} className="border-t border-border">
                  <td className="px-4 py-2">{name}</td>
                  <td className="px-4 py-2">{purpose}</td>
                  <td className="px-4 py-2">{duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubHeading>4.2 Third-party Cookies</SubHeading>
        <p>These are set by third-party services that appear on our pages.</p>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-card text-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Service</th>
                <th className="px-4 py-2 font-medium">Purpose</th>
                <th className="px-4 py-2 font-medium">Privacy Policy</th>
              </tr>
            </thead>
            <tbody>
              {thirdParty.map(([service, purpose]) => (
                <tr key={service} className="border-t border-border">
                  <td className="px-4 py-2">{service}</td>
                  <td className="px-4 py-2">{purpose}</td>
                  <td className="px-4 py-2 text-primary">View Policy</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section heading="5. Managing Your Cookie Preferences">
        <p>
          You can manage your cookie preferences through your browser settings. Most browsers allow
          you to:
        </p>
        <List
          items={[
            "See what cookies you've got and delete them on an individual basis",
            "Block third-party cookies",
            "Block cookies from particular sites",
            "Block all cookies from being set",
            "Delete all cookies when you close your browser",
          ]}
        />
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-base font-medium text-foreground">Cookie Consent Settings</h3>
          <p className="mt-2">
            You can change your cookie preferences at any time using the options below:
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Accept All
            </button>
            <button
              type="button"
              className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
            >
              Essential Only
            </button>
            <button
              type="button"
              className="rounded-md border border-input px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/10"
            >
              Save Settings
            </button>
          </div>
        </div>
      </Section>

      <Section heading="6. Changes to This Cookie Policy">
        <p>
          We may update this Cookie Policy from time to time. We will notify you of any changes by
          posting the new policy on this page and updating the "Last updated" date.
        </p>
      </Section>

      <Section heading="7. Contact Us">
        <p>If you have any questions about this Cookie Policy, please contact us at:</p>
        <p>
          Email: privacy@izenzo.com
          <br />
          Address: [Your Business Address]
          <br />
          Data Protection Officer: dpo@izenzo.com
        </p>
        <p>
          This Cookie Policy is effective as of 12th June 2024 and will remain in effect except with
          respect to any changes in its provisions in the future.
        </p>
      </Section>
    </LegalPage>
  );
}
