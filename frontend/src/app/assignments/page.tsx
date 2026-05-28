"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import ExamPaper from "@/components/ExamPaper";
import {
  fetchAssignmentStatus,
  fetchRecentAssignments,
  deleteAssignment,
  type AssignmentSummary,
} from "@/lib/assignmentsApi";
import {
  Search,
  Filter,
  MoreVertical,
  Plus,
  X,
} from "lucide-react";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function AssignmentsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="lg:ml-[304px] flex-1 flex items-center justify-center pt-16 lg:pt-[78px] pb-20 lg:pb-8">
          <div className="w-10 h-10 rounded-full border-4 border-[#dadada] border-t-[#303030] animate-spin" />
        </main>
      </div>
    }>
      <AssignmentsContent />
    </Suspense>
  );
}

function AssignmentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const openId = searchParams.get("open");

  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [selectedPaper, setSelectedPaper] = useState<Record<string, unknown> | null>(null);
  const [isLoadingPaper, setIsLoadingPaper] = useState(false);

  const handleOpen = async (assignmentId: string) => {
    setIsLoadingPaper(true);
    try {
      const data = await fetchAssignmentStatus(assignmentId);
      if (data.paper) {
        setSelectedPaper(data.paper);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoadingPaper(false);
    }
  };

  const handleDelete = async (assignmentId: string) => {
    setActiveMenu(null);
    try {
      await deleteAssignment(assignmentId);
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    } catch {
      // Silently fail
    }
  };

  useEffect(() => {
    let isMounted = true;
    setIsLoadingList(true);
    fetchRecentAssignments(50)
      .then((data) => {
        if (isMounted) {
          setAssignments(data);
          setListError(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setListError("Unable to load assignments.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingList(false);
      });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!openId || assignments.length === 0) return;
    const exists = assignments.some((a) => a.id === openId);
    if (exists) void handleOpen(openId);
  }, [openId, assignments]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = assignments.filter((a) =>
    (a.paper_title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedPaper) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="lg:ml-[304px] flex-1 flex justify-center pt-16 lg:pt-[78px] pb-20 lg:pb-8 px-4 lg:px-8">
          <div className="w-full max-w-[920px]">
            <ExamPaper paper={selectedPaper} onBack={() => setSelectedPaper(null)} />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="lg:ml-[304px] flex-1 flex justify-center pt-16 lg:pt-[78px] pb-20 lg:pb-8 px-4 lg:px-8">
        <div className="w-full max-w-[920px] flex flex-col gap-6">
          {/* Header */}
          <header className="flex flex-col gap-1">
            <h1 className="text-xl font-bold text-[#303030]">Assignments</h1>
            <p className="text-sm text-[rgba(94,94,94,0.8)]">
              Manage and view assignments for your classes.
            </p>
          </header>

          {/* Filter + Search bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-[#dadada] text-sm font-medium text-[#303030] hover:bg-[#f6f6f6] transition-colors shrink-0">
              <Filter size={16} />
              Filter By
            </button>
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a9a9a9]" />
              <input
                type="text"
                placeholder="Search Assignment"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[42px] pl-10 pr-4 bg-white border border-[#dadada] rounded-full text-sm text-[#303030] placeholder:text-[#a9a9a9] outline-none focus:border-[#303030] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a9a9a9] hover:text-[#303030]"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          {isLoadingList ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 rounded-full border-4 border-[#dadada] border-t-[#303030] animate-spin" />
            </div>
          ) : listError ? (
            <div className="text-sm text-red-600 py-8 text-center">{listError}</div>
          ) : filtered.length === 0 && assignments.length === 0 ? (
            /* Empty State — matches Figma */
            <div className="flex flex-col items-center justify-center gap-6 py-16">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-[#f0f0f0] flex items-center justify-center">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="28" cy="28" r="18" stroke="#b0b0b0" strokeWidth="3" fill="none" />
                    <line x1="40" y1="40" x2="54" y2="54" stroke="#b0b0b0" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="absolute -bottom-1 -right-1 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <X size={24} className="text-red-500" />
                </div>
              </div>
              <div className="text-center max-w-sm">
                <h2 className="text-lg font-bold text-[#303030] mb-1">
                  No assignments yet
                </h2>
                <p className="text-sm text-[rgba(94,94,94,0.8)] leading-relaxed">
                  Create your first assignment to start collecting and grading student
                  submissions. You can set up rubrics, define marking criteria, and let AI
                  assist with grading.
                </p>
              </div>
              <button
                onClick={() => router.push("/create")}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-[#dadada] rounded-full text-sm font-medium text-[#303030] hover:bg-[#f6f6f6] transition-colors"
              >
                <Plus size={18} />
                Create Your First Assignment
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-[rgba(94,94,94,0.55)] py-8 text-center">
              No assignments match &quot;{searchQuery}&quot;
            </div>
          ) : (
            <>
              {/* Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" ref={menuRef}>
                {filtered.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="relative bg-white rounded-2xl border border-[#e8e8e8] p-5 flex flex-col gap-3 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="text-base font-bold text-[#303030] leading-tight pr-6">
                        {assignment.paper_title || "Assessment Paper"}
                      </h3>
                      {/* Context menu trigger */}
                      <button
                        onClick={() => setActiveMenu(activeMenu === assignment.id ? null : assignment.id)}
                        className="w-7 h-7 rounded-full hover:bg-[#f6f6f6] flex items-center justify-center text-[#a9a9a9] hover:text-[#303030] transition-colors shrink-0"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Context menu dropdown */}
                      {activeMenu === assignment.id && (
                        <div className="absolute top-12 right-4 bg-white rounded-xl shadow-lg border border-[#e8e8e8] py-1 z-10 min-w-[160px]">
                          <button
                            onClick={() => { setActiveMenu(null); handleOpen(assignment.id); }}
                            className="w-full px-4 py-2.5 text-left text-sm text-[#303030] hover:bg-[#f6f6f6] transition-colors"
                          >
                            View Assignment
                          </button>
                          <button
                            onClick={() => handleDelete(assignment.id)}
                            className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                      <span className="text-[#E56820] font-medium">
                        Assigned on: {formatDate(assignment.created_at)}
                      </span>
                      {assignment.due_date && (
                        <span className="text-[rgba(94,94,94,0.8)]">
                          Due: {formatDate(assignment.due_date)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom create button */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={() => router.push("/create")}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-[#dadada] rounded-full text-sm font-medium text-[#303030] hover:bg-[#f6f6f6] transition-colors"
                >
                  <Plus size={18} />
                  Create Assignment
                </button>
              </div>
            </>
          )}

          {isLoadingPaper && (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 flex items-center gap-3 shadow-xl">
                <div className="w-6 h-6 rounded-full border-3 border-[#dadada] border-t-[#303030] animate-spin" />
                <span className="text-sm text-[#303030]">Loading paper...</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
