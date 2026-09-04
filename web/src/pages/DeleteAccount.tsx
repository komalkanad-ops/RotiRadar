import LegalPage from "../components/LegalPage";

export default function DeleteAccount() {
  return (
    <LegalPage
      title="Deleting your account"
      path="/delete-account"
      description="How to delete your RotiRadar account and data, what gets removed, and what we're required to keep."
      updated="September 2026"
    >
      <p>
        You can ask us to delete your RotiRadar account and associated personal data at any time.
        This page exists so the option is available outside the app too.
      </p>

      <h2>From the app</h2>
      <p>
        Go to <strong>Profile → Settings → Delete account</strong> and confirm. Your account is
        deactivated immediately and deletion is completed within 30 days.
      </p>

      <h2>By email</h2>
      <p>
        Email <a href="mailto:privacy@rotiradar.in">privacy@rotiradar.in</a> from the address on your
        account, or with your registered phone number, and ask us to delete it. We may ask one
        question to confirm it's you.
      </p>

      <h2>What gets deleted</h2>
      <ul>
        <li>Your profile, saved addresses, and preferences.</li>
        <li>Your chat messages and device identifiers.</li>
        <li>For cooks: your public profile and uploaded identity documents.</li>
      </ul>

      <h2>What we have to keep</h2>
      <p>
        Transaction and invoice records, and a minimal record of any safety report or dispute, are
        retained for the period tax and legal rules require, then deleted. These are not linked to a
        usable account after deletion. {/* TODO: legal review — state the exact statutory retention periods. */}
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:privacy@rotiradar.in">privacy@rotiradar.in</a>
      </p>
    </LegalPage>
  );
}
