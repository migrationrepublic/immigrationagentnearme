export interface ToolLead {
  id: string;
  tool_name: string;
  user_name: string;
  user_email: string;
  user_phone?: string;
  results: Record<string, unknown>;
  created_at: string;
}
