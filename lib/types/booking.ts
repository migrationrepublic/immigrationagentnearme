export interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan_id: string;
  date: string;
  time: string;
  notes: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  stripe_session_id?: string;
  created_at?: string;
  plans?: {
    name: string;
  };
}
