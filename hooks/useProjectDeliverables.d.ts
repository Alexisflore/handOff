export interface Deliverable {
  id: string;
  created_at: string;
  project_id: string;
  step_id?: string | null;
  step_name?: string | null;
  file_id?: string | null;
  file_name?: string | null;
  title: string;
  description?: string | null;
  file_type: string;
  version?: string | null;
  status?: string | null;
  due_date?: string | null;
  is_client: boolean;
  preview_url?: string | null;
  download_url?: string | null;
}

/**
 * Fetches project deliverables using Supabase browser client
 * @param projectId ID of the project to fetch deliverables for
 * @returns Promise resolving to an array of deliverable objects
 */
export function fetchProjectDeliverables(projectId: string): Promise<Deliverable[]>; 