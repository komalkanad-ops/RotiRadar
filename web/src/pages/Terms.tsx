import LegalPage from "../components/LegalPage";

export default function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      path="/terms"
      description="The terms for using RotiRadar as a customer or a cook — the platform's role, bookings, payments, conduct, and liability."
      updated="September 2026"
    >
      <p>
        These terms govern your use of RotiRadar. By creating an account you agree to them. If you
        don't, please don't use the service. {/* TODO: legal review — operating entity, governing law, arbitration seat, consumer-law carve-outs. */}
      </p>

      <h2>What RotiRadar is</h2>
      <p>
        RotiRadar is a platform that connects people who want a meal cooked at home with independent
        cooks nearby. Cooks are not employees of RotiRadar. RotiRadar is not the provider of the
        cooking service; it provides the technology, payments, verification, and support around it.
      </p>

      <h2>Eligibility and accounts</h2>
      <p>
        You must be 18 or older and provide accurate information. You're responsible for activity on
        your account. We may suspend or close accounts for breach of these terms, fraud, or abuse.
      </p>

      <h2>Bookings and payment</h2>
      <ul>
        <li>Prices, platform fee, and taxes are shown before you confirm a booking.</li>
        <li>Payment is taken through our payment provider at the time of booking.</li>
        <li>Groceries and a usable kitchen are the customer's responsibility.</li>
        <li>
          Cancellations and refunds follow the{" "}
          <a href="/refund-policy">Refund &amp; Cancellation Policy</a>.
        </li>
      </ul>

      <h2>Cook obligations</h2>
      <p>
        Cooks must complete verification, keep their details current, follow food-hygiene good
        practice, arrive on time, and cook only the tiers they've accepted. Commission and payout
        terms are shown in the Cook app.
      </p>

      <h2>Conduct</h2>
      <p>
        No harassment, discrimination, threats, or illegal activity. Communicate through the app.
        Don't try to take payments or bookings off-platform. Reported chats may be reviewed as
        described in the <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>Liability</h2>
      <p>
        RotiRadar provides the platform "as is" and is not liable for the acts or omissions of
        independent cooks or customers beyond what the law requires. Nothing here limits liability
        that cannot be limited under applicable law. {/* TODO: legal review — insurance position, indemnities, liability cap. */}
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms; material changes will be notified in the app or by email. Continued
        use after a change means you accept the updated terms.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:legal@rotiradar.in">legal@rotiradar.in</a>
      </p>
    </LegalPage>
  );
}
