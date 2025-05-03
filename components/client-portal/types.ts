export interface ClientPortalProps {
  project: any
  client: any
  milestones: any[]
  freelancer: any
  comments: any[]
  sharedFiles: any[]
}

export interface Version {
  id: string
  version_name: string
  is_latest?: boolean
  created_at: string
  file_type?: string
  file_name?: string
  file_url?: string
  status?: string
  step_id: string
  description?: string
}

export interface Comment {
  id: string
  content: string
  created_at: string
  deliverable_id: string
  deliverable_name?: string
  version_name?: string
  is_client: boolean
  users: {
    full_name: string
    avatar_url?: string
  }
}

export interface Deliverable {
  id: string
  title: string
  description?: string
  status: "upcoming" | "current" | "completed"
  icon?: string
  versions?: Version[]
}

export interface CurrentUser {
  id: string
  email?: string
  role?: string
  isDesigner: boolean
  full_name?: string
  avatar_url?: string
} 