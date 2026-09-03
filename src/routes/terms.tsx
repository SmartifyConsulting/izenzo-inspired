import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, List, Section, SubHeading } from "@/components/legal-page";

const TITLE = "Terms of Service - IZENZO";
const DESCRIPTION =
  "The terms governing use of IZENZO's authentication, identity management, and secure access control services.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/terms" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      subtitle="These terms apply to IZENZO, a brand of INFONICA LIMITED"
      updated="Last updated: 1st January 2024"
    >
      <Section heading="1. Acceptance of Terms">
        <p>
          By accessing and using IZENZO's secure digital infrastructure and authentication services
          ("Services"), you agree to be bound by these Terms of Service ("Terms"). If you do not
          agree to these Terms, please do not use our Services.
        </p>
      </Section>

      <Section heading="2. Description of Services">
        <p>
          IZENZO provides enterprise-grade authentication, identity management, and secure access
          control services. Our Services include but are not limited to:
        </p>
        <List
          items={[
            "Identity and access management solutions",
            "Secure authentication and authorisation systems",
            "API security infrastructure",
            "Compliance and security monitoring",
          ]}
        />
      </Section>

      <Section heading="3. Eligibility">
        <p>
          You must be at least 18 years old and have the legal capacity to enter into these Terms.
          If you are using our Services on behalf of an organisation, you represent that you have
          the authority to bind that organisation to these Terms.
        </p>
      </Section>

      <Section heading="4. Account Registration and Security">
        <SubHeading>4.1 Account Creation</SubHeading>
        <p>
          To access certain Services, you may need to create an account. You agree to provide
          accurate, current, and complete information during registration and to update such
          information as necessary.
        </p>
        <SubHeading>4.2 Account Security</SubHeading>
        <p>
          You are responsible for maintaining the confidentiality of your account credentials and
          for all activities that occur under your account. You must immediately notify us of any
          unauthorised use of your account.
        </p>
      </Section>

      <Section heading="5. Acceptable Use">
        <p>
          You agree to use our Services only for lawful purposes and in accordance with these Terms.
          You must not:
        </p>
        <List
          items={[
            "Use the Services for any illegal or unauthorised purpose",
            "Attempt to gain unauthorised access to our systems or networks",
            "Interfere with or disrupt the Services or servers",
            "Transmit any malicious code or harmful content",
            "Violate any applicable laws or regulations",
          ]}
        />
      </Section>

      <Section heading="6. Service Availability">
        <p>
          We strive to maintain high availability of our Services but cannot guarantee
          uninterrupted access. We reserve the right to modify, suspend, or discontinue any part of
          our Services with reasonable notice.
        </p>
      </Section>

      <Section heading="7. Data Protection and Privacy">
        <p>
          Your privacy is important to us. Our collection, use, and protection of your personal
          information is governed by our Privacy Policy, which is incorporated into these Terms by
          reference.
        </p>
      </Section>

      <Section heading="8. Intellectual Property">
        <SubHeading>8.1 Our Rights</SubHeading>
        <p>
          All content, features, and functionality of our Services, including but not limited to
          text, graphics, logos, and software, are owned by IZENZO or its licensors and are
          protected by intellectual property laws.
        </p>
        <SubHeading>8.2 Your Rights</SubHeading>
        <p>
          You retain ownership of any content you submit to our Services. By submitting content, you
          grant us a non-exclusive, worldwide, royalty-free licence to use, reproduce, and
          distribute such content in connection with providing our Services.
        </p>
      </Section>

      <Section heading="9. Payment Terms">
        <p>
          Some Services may require payment. All fees are payable in advance and are non-refundable
          unless otherwise specified. We reserve the right to change our pricing with reasonable
          notice.
        </p>
      </Section>

      <Section heading="10. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, IZENZO shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages, including but not limited to loss
          of profits, data, or use, arising out of or relating to these Terms or the Services.
        </p>
      </Section>

      <Section heading="11. Indemnification">
        <p>
          You agree to indemnify and hold harmless IZENZO and its officers, directors, employees,
          and agents from any claims, damages, or expenses arising out of your use of the Services
          or violation of these Terms.
        </p>
      </Section>

      <Section heading="12. Termination">
        <p>
          Either party may terminate these Terms at any time with written notice. Upon termination,
          your right to use the Services will cease immediately, and we may delete your account and
          data in accordance with our data retention policies.
        </p>
      </Section>

      <Section heading="13. Governing Law">
        <p>
          These Terms shall be governed by and construed in accordance with the laws of the United
          Kingdom. Any disputes arising out of these Terms shall be subject to the exclusive
          jurisdiction of the courts of the United Kingdom.
        </p>
      </Section>

      <Section heading="14. Changes to Terms">
        <p>
          We may update these Terms from time to time. We will notify you of any material changes by
          posting the new Terms on our website and updating the "Last updated" date. Your continued
          use of the Services after such changes constitutes acceptance of the new Terms.
        </p>
      </Section>

      <Section heading="15. Severability">
        <p>
          If any provision of these Terms is found to be unenforceable or invalid, that provision
          will be limited or eliminated to the minimum extent necessary so that the Terms will
          otherwise remain in full force and effect.
        </p>
      </Section>

      <Section heading="16. Contact Information">
        <p>If you have any questions about these Terms of Service, please contact us at:</p>
        <p>
          Email: legal@izenzo.com
          <br />
          Address: [Your Business Address]
          <br />
          Phone: [Your Phone Number]
        </p>
        <p>
          These Terms of Service are effective as of 1st January 2024 and will remain in effect
          except with respect to any changes in their provisions in the future.
        </p>
      </Section>
    </LegalPage>
  );
}
