import LegalPage from "../components/LegalPage";

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      path="/privacy"
      description="What data RotiRadar collects, how masked calls and chat monitoring work, how KYC documents are handled, and your rights."
      updated="September 2026"
    >
      <p>
        This policy explains what RotiRadar collects, why, and what you can do about it. It applies
        to the RotiRadar customer app, the RotiRadar for Cooks app, this website, and our support
        channels. {/* TODO: legal review — align with the DPDP Act 2023 and name the operating entity. */}
      </p>

      <h2>What we collect</h2>
      <p>
        <strong>Account details:</strong> your name, phone number, email, and the addresses you save.
      </p>
      <p>
        <strong>From cooks:</strong> date of birth, gender, languages, experience, a photo, service
        area, bank/UPI details for payouts, and identity documents (Aadhaar, PAN, and any police
        verification) for verification.
      </p>
      <p>
        <strong>Bookings:</strong> the meal type, time, address, price, status history, and ratings.
      </p>
      <p>
        <strong>Communications:</strong> in-app chat messages tied to a booking, and metadata for
        masked calls (the parties, time, and duration — not audio, unless call recording is later
        introduced with separate, explicit consent).
      </p>
      <p>
        <strong>Payments:</strong> processed by our payment provider. We store a transaction record
        and the last details needed for receipts and refunds, not full card numbers.
      </p>
      <p>
        <strong>Device &amp; usage:</strong> app version, device type, coarse location while you have
        a booking, and diagnostic logs.
      </p>

      <h2>Chat and call monitoring</h2>
      <p>
        To keep customers and cooks safe, our safety team can review the in-app chat and masked-call
        metadata for a booking — routinely for abuse detection, and in detail when a report is filed.
        By using RotiRadar you acknowledge this. We keep records of reports, what we found, and what
        action we took.
      </p>

      <h2>How we use it</h2>
      <ul>
        <li>To match you with a cook, run the booking, and take payment.</li>
        <li>To verify cooks and prevent fraud and abuse.</li>
        <li>To provide support and resolve disputes.</li>
        <li>To improve the service and meet legal and tax obligations.</li>
      </ul>

      <h2>Who we share it with</h2>
      <p>
        With the cook or customer on a booking (name, approximate location, and what's needed to do
        the job — never the other person's phone number). With our payment, communications, cloud,
        and analytics providers under contract. With authorities where the law requires it.
      </p>

      <h2>Retention</h2>
      <p>
        We keep account and booking data while your account is active and for as long as tax and
        legal rules require afterwards. Identity documents are access-logged and kept only as long as
        needed for verification and dispute windows. {/* TODO: legal review — set concrete retention periods per data type. */}
      </p>

      <h2>Your choices</h2>
      <p>
        You can view and edit your profile in the app, request a copy of your data, or ask us to
        delete your account (see the <a href="/delete-account">account deletion</a> page). Contact{" "}
        <a href="mailto:privacy@rotiradar.in">privacy@rotiradar.in</a> for any privacy request.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy: <a href="mailto:privacy@rotiradar.in">privacy@rotiradar.in</a>.
        {/* TODO: legal review — add the registered business name, address, and grievance officer per Indian IT Rules. */}
      </p>
    </LegalPage>
  );
}
