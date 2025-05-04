import { createBrowserClient } from "@supabase/ssr"

// Define the expected structure for a shared file
export interface Deliverable {
  id: string;
  created_at: string;
  project_id: string;
  step_id?: string | null; // Optional step ID
  step_name?: string | null; // Optional step name from join
  file_id?: string | null; // Optional file ID
  file_name?: string | null; // Optional file name from join
  title: string;
  description?: string | null;
  file_type: string;
  file_size?: string | null;
  file_url?: string | null;
  version?: string | null;
  status?: string | null;
  due_date?: string | null;
  is_client: boolean;
  preview_url?: string | null;
  download_url?: string | null;
}

export async function fetchProjectDeliverables(projectId: string): Promise<Deliverable[]> {
  if (!projectId) {
    console.error("Project ID is required to fetch shared files.");
    return [];
  }

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // Get shared files for this project
    const { data, error } = await supabase
      .from("shared_files")
      .select(`
        id,
        created_at,
        project_id,
        title,
        description,
        file_name,
        file_type,
        file_size,
        file_url
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching project shared files:", error);
      throw new Error(`Failed to fetch deliverables: ${error.message}`);
    }

    // Process the data to match the Deliverable interface
    const processedData: Deliverable[] = data?.map((item: any) => ({
      id: item.id,
      created_at: item.created_at,
      project_id: item.project_id,
      step_id: null, // No step relationship
      step_name: null, // No step name
      file_id: item.id, // The shared_file's own id
      file_name: item.file_name,
      title: item.title || "Untitled",
      description: item.description,
      file_type: item.file_type || "unknown",
      file_size: item.file_size,
      file_url: item.file_url,
      version: null, // Not available in the table
      status: "Uploaded", // Default status
      due_date: null, // Not available in the table
      is_client: true, // Assume client uploaded by default
      preview_url: item.file_url, // Use file_url as preview_url
      download_url: item.file_url, // Use file_url as download_url
    })) || [];

    console.log(`Fetched ${processedData.length} shared files for project ${projectId}`);
    return processedData;

  } catch (err) {
    console.error("An unexpected error occurred while fetching shared files:", err);
    // Re-throw the error or return an empty array depending on desired error handling
    throw err; // Or return [];
  }
}