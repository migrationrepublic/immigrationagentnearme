export type ToolStep = {
  id: string;
  question: string;
  description?: string;
  type: 'select' | 'radio' | 'input' | 'boolean';
  options?: { label: string; value: string | number; points?: number }[];
};

export type ToolData = {
  id: string;
  title: string;
  description: string;
  steps: ToolStep[];
};

export type ToolSubmission = {
  toolId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  responses: Record<string, any>;
  totalScore?: number;
};
