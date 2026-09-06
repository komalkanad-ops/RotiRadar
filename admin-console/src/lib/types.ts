// Shapes returned by the backend /admin/* routes (and a few shared ones). Loose on purpose — the
// console only reads a subset of each.

export interface Stats {
  users: number;
  cooks: Record<string, number>;
  bookings: Record<string, number>;
  grossPaidPaise: number;
  pendingKycDocuments: number;
}

export interface Cook {
  id: string;
  phone: string | null;
  name: string;
  status: string;
  languages: string[];
  experienceYrs: number;
  bio: string | null;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  documents?: CookDocument[];
}

export interface CookDocument {
  id: string;
  type: string;
  fileUrl: string;
  status: string;
  reviewedAt: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  phone: string | null;
  name: string | null;
  email: string | null;
  authProvider: string;
  createdAt: string;
  addresses?: Address[];
  bookings?: Booking[];
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  pincode: string;
}

export interface Booking {
  id: string;
  customerId: string;
  cookId: string | null;
  tier: string;
  startAt: string;
  durationMinutes: number;
  status: string;
  servicePaise: number;
  platformFeePaise: number;
  taxPaise: number;
  totalPaise: number;
  cancellationFeePaise: number;
  cancelledBy: string | null;
  cancelReason: string | null;
  createdAt: string;
  statusEvents?: StatusEvent[];
  transactions?: Transaction[];
  customer?: { id: string; phone: string | null; name: string | null; email: string | null };
  cook?: { id: string; phone: string | null; name: string; status: string } | null;
  address?: Address;
}

export interface StatusEvent {
  id: string;
  status: string;
  note: string | null;
  actor: string | null;
  createdAt: string;
}

export interface Transaction {
  id: string;
  amountPaise: number;
  status: string;
  provider: string;
  providerOrderId: string | null;
  providerPaymentId: string | null;
  refundedPaise: number;
  createdAt: string;
}

export interface Message {
  id: string;
  senderRole: "CUSTOMER" | "COOK";
  body: string;
  imageUrl: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface Report {
  id: string;
  category: string;
  detail: string;
  bookingId: string | null;
  userId: string | null;
  cookId: string | null;
  attachmentUrl: string | null;
  status: string;
  actionTaken: string | null;
  handledBy: string | null;
  createdAt: string;
}

export interface Dispute {
  id: string;
  bookingId: string;
  openedBy: string;
  reason: string;
  status: string;
  resolution: string | null;
  refundPaise: number;
  handledBy: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}
