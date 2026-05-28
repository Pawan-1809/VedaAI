const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface AssignmentSummary {
  id: string;
  status: string;
  total_marks: number;
  number_of_questions: number;
  due_date: string | null;
  created_at: string;
  paper_title: string;
}

export interface AssignmentStatusResponse {
  id: string;
  status: string;
  paper?: Record<string, unknown> | null;
  error?: string;
}

export async function fetchRecentAssignments(limit = 20): Promise<AssignmentSummary[]> {
  const res = await fetch(`${API_BASE}/assignments/recent/?limit=${limit}`);
  if (!res.ok) {
    throw new Error("Failed to load recent assignments.");
  }
  return (await res.json()) as AssignmentSummary[];
}

export async function fetchAssignmentStatus(
  assignmentId: string
): Promise<AssignmentStatusResponse> {
  const res = await fetch(`${API_BASE}/assignments/${assignmentId}/status/`);
  if (!res.ok) {
    throw new Error("Failed to load assignment details.");
  }
  return (await res.json()) as AssignmentStatusResponse;
}

export async function deleteAssignment(assignmentId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/assignments/${assignmentId}/`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error("Failed to delete assignment.");
  }
}
