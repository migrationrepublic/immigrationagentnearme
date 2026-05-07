export interface Plan {
  id: string;
  name: string;
  price_aud: number;
  duration_minutes: number;
  slug?: string;
  description?: string;
}

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

export interface ToolLead {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  tool_type: string;
  results: any;
  created_at: string;
}
