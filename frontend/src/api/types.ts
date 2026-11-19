export type Opportunity = {
  id: number;
  title: string;
  description?: string;
  category: string;
  status: string;
  organization_name?: string | null;
  location?: string | null;
  mode: string;
  start_date?: string | null;
  end_date?: string | null;
  application_deadline?: string | null;
  volunteers_required: number;
  approved_count: number;
  is_demo: boolean;
};

export type OpportunityList = {
  items: Opportunity[];
  total: number;
  page: number;
  page_size: number;
};

export type VolunteerApplication = {
  id: number;
  opportunity_id: number;
  volunteer_id: number;
  status: string;
  message?: string | null;
  applied_at: string;
  opportunity_title?: string | null;
  volunteer_name?: string | null;
  volunteer_email?: string | null;
};

export type VolunteerTask = {
  id: number;
  opportunity_id: number;
  assigned_to_id?: number | null;
  title: string;
  description?: string | null;
  deadline?: string | null;
  status: string;
  opportunity_title?: string | null;
  assignee_name?: string | null;
};

export type TaskForm = {
  opportunity_id: string;
  assigned_to_id: string;
  title: string;
  description: string;
  deadline: string;
};

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred";
}
