"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { fetchRecentAssignments, type AssignmentSummary } from "@/lib/assignmentsApi";
import { useAppSelector } from "@/store/hooks";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Home() {
  const [assignments, setAssignments] = useState<AssignmentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const auth = useAppSelector((s) => s.auth);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchRecentAssignments(3)
      .then((data) => {
        if (isMounted) {
          setAssignments(data);
          setError(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Unable to load recent assignments.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="lg:ml-[304px] flex-1 flex justify-center pt-16 lg:pt-[78px] pb-20 lg:pb-8 px-4 lg:px-8">
        <div className="w-full max-w-[920px] flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#4bc26d] border-4 border-[rgba(75,194,109,0.4)] shadow-[0px_16px_48px_rgba(0,0,0,0.12),0px_32px_48px_rgba(0,0,0,0.2)]" />
              <div>
                <h1 className="text-2xl font-bold text-[#303030]">
                  Welcome back{auth.user?.username ? `, ${auth.user.username}` : ""}
                </h1>
                <p className="text-sm text-[rgba(94,94,94,0.55)]">
                  Start a new assignment or review recent papers.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/create"
                className="px-6 py-2.5 rounded-full bg-[#181818] text-white text-sm font-medium shadow-[0px_16px_48px_rgba(0,0,0,0.12),0px_32px_48px_rgba(0,0,0,0.2)]"
              >
                Create Assignment
              </Link>
              <Link
                href="/assignments"
                className="px-6 py-2.5 rounded-full bg-white border border-[#dadada] text-sm font-medium text-[#303030] hover:bg-[#f6f6f6] transition-colors"
              >
                View All Assignments
              </Link>
            </div>
          </header>

          <section className="bg-[rgba(255,255,255,0.5)] rounded-[32px] p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#303030]">Recent Papers</h2>
                <p className="text-sm text-[rgba(94,94,94,0.8)]">
                  The latest AI-generated assessments.
                </p>
              </div>
              <Link
                href="/assignments"
                className="text-sm font-medium text-[#303030] hover:underline"
              >
                See all
              </Link>
            </div>

            {isLoading ? (
              <div className="text-sm text-[rgba(94,94,94,0.55)]">Loading recent papers...</div>
            ) : error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : assignments.length === 0 ? (
              <div className="text-sm text-[rgba(94,94,94,0.55)]">
                No completed papers yet. Create one to get started.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="bg-white rounded-2xl border border-[#e8e8e8] px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div>
                      <p className="text-base font-semibold text-[#303030]">
                        {assignment.paper_title || "Assessment Paper"}
                      </p>
                      <p className="text-xs text-[rgba(94,94,94,0.55)]">
                        Created {formatDate(assignment.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[rgba(94,94,94,0.8)]">
                      <span className="px-3 py-1 rounded-full bg-[#f6f6f6]">
                        {assignment.number_of_questions} questions
                      </span>
                      <span className="px-3 py-1 rounded-full bg-[#f6f6f6]">
                        {assignment.total_marks} marks
                      </span>
                      <Link
                        href={`/assignments?open=${assignment.id}`}
                        className="px-3 py-1 rounded-full bg-[#181818] text-white"
                      >
                        Open
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
