import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, List, Section, SubHeading } from "@/components/legal-page";

const TITLE = "Privacy Policy - IZENZO";
const DESCRIPTION =
  "How IZENZO, a brand of INFONICA LIMITED, collects, uses, discloses, and safeguards your information.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/privacy" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      subtitle="This policy applies to IZENZO, a brand of INFONICA LIMITED"
      updated="Last updated: 1st January 2024"
    >
      <Section heading="1. Introduction">
        <p>
          IZENZO ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
          explains how we collect, use, disclose, and safeguard your information when you use our
          secure digital infrastructure and authentication services.
        </p>
      </Section>

      <Section heading="2. Information We Collect">
        <SubHeading>2.1 Personal Information</SubHeading>
        <p>We may collect personal information that you provide directly to us, including:</p>
        <List
          items={[
            "Name and contact information",
            "Organisation details",
            "Account credentials",
            "Communication preferences",
          ]}
        />
        <SubHeading>2.2 Technical Information</SubHeading>
        <p>We automatically collect certain technical information when you use our services:</p>
        <List
          items={[
            "IP addresses and device information",
            "Usage data and analytics",
            "Security logs and audit trails",
            "Performance metrics",
          ]}
        />
      </Section>

      <Section heading="3. How We Use Your Information">
        <p>We use the collected information for the following purposes:</p>
        <List
          items={[
            "Providing and maintaining our services",
            "Ensuring security and preventing fraud",
            "Improving our services and user experience",
            "Complying with legal obligations",
            "Communicating with you about our services",
          ]}
        />
      </Section>

      <Section heading="4. Data Security">
        <p>
          We implement industry-standard security measures to protect your information, including:
        </p>
        <List
          items={[
            "Encryption of data in transit and at rest",
            "Regular security audits and assessments",
            "Access controls and authentication",
            "24/7 monitoring and incident response",
          ]}
        />
      </Section>

      <Section heading="5. Data Sharing and Disclosure">
        <p>
          We do not sell, trade, or otherwise transfer your personal information to third parties
          except in the following circumstances:
        </p>
        <List
          items={[
            "With your explicit consent",
            "To comply with legal requirements",
            "To protect our rights and safety",
            "With trusted service providers under strict confidentiality agreements",
          ]}
        />
      </Section>

      <Section heading="6. Your Rights">
        <p>You have the right to:</p>
        <List
          items={[
            "Access your personal information",
            "Correct inaccurate information",
            "Request deletion of your information",
            "Object to processing of your information",
            "Data portability",
          ]}
        />
      </Section>

      <Section heading="7. Data Retention">
        <p>
          We retain your information for as long as necessary to provide our services and comply
          with legal obligations. When we no longer need your information, we will securely delete
          or anonymise it.
        </p>
      </Section>

      <Section heading="8. International Transfers">
        <p>
          Your information may be transferred to and processed in countries other than your own. We
          ensure that such transfers comply with applicable data protection laws and implement
          appropriate safeguards.
        </p>
      </Section>

      <Section heading="9. Cookies and Tracking">
        <p>
          We use cookies and similar technologies to enhance your experience and collect usage
          information. You can control cookie settings through your browser preferences.
        </p>
      </Section>

      <Section heading="10. Children's Privacy">
        <p>
          Our services are not intended for children under 16 years of age. We do not knowingly
          collect personal information from children under 16.
        </p>
      </Section>

      <Section heading="11. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any material
          changes by posting the new policy on our website and updating the "Last updated" date.
        </p>
      </Section>

      <Section heading="12. Contact Us">
        <p>
          If you have any questions about this Privacy Policy or our data practices, please contact
          us at:
        </p>
        <p>
          Email: privacy@izenzo.com
          <br />
          Address: [Your Business Address]
          <br />
          Data Protection Officer: dpo@izenzo.com
        </p>
        <p>
          This Privacy Policy is effective as of 1st January 2024 and will remain in effect except
          with respect to any changes in its provisions in the future.
        </p>
      </Section>
    </LegalPage>
  );
}
