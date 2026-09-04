import LegalPage from "../components/LegalPage";

export default function RefundPolicy() {
  return (
    <LegalPage
      title="Refund &amp; Cancellation Policy"
      path="/refund-policy"
      description="When you can cancel a RotiRadar booking for free, when a fee applies, and how refunds are processed."
      updated="September 2026"
    >
      <p>
        This policy covers cancellations and refunds for bookings made through RotiRadar. The exact
        cutoff time and fee are configured in the app and shown to you when you cancel.
        {/* TODO: legal review — confirm final cutoff window and fee amounts, and GST treatment of the fee. */}
      </p>

      <h2>Cancelling before the cutoff</h2>
      <p>
        If you cancel more than the cutoff window before your slot starts (currently around two
        hours), you are not charged and any amount paid is refunded in full.
      </p>

      <h2>Cancelling inside the cutoff window</h2>
      <p>
        If you cancel within the cutoff window, a late-cancellation fee applies — this covers the
        cook's committed time and travel. The rest of your payment is refunded.
      </p>

      <h2>If the cook cancels or doesn't arrive</h2>
      <p>
        You're refunded in full, and the app will help you re-book another cook. Repeated cook
        no-shows are acted on against the cook's account.
      </p>

      <h2>Problems during or after the visit</h2>
      <p>
        If something went wrong — the cook left early, the work wasn't as booked — report it from the
        booking screen within 48 hours. We'll review the booking and chat and issue a partial or full
        refund where it's warranted.
      </p>

      <h2>How refunds are processed</h2>
      <p>
        Refunds go back to your original payment method, or to RotiRadar credit if you choose. Bank
        processing usually takes 5–7 working days after we approve the refund. You'll see status
        updates in the app.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:support@rotiradar.in">support@rotiradar.in</a>
      </p>
    </LegalPage>
  );
}
