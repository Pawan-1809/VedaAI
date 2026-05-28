import Sidebar from "@/components/Sidebar";
import AssignmentForm from "@/components/AssignmentForm";

export default function CreateAssignment() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="lg:ml-[304px] flex-1 flex justify-center pt-16 lg:pt-[78px] pb-20 lg:pb-8 px-4 lg:px-8">
        <div className="w-full max-w-[810px] flex flex-col gap-8">
          {/* Header */}
          <div className="flex items-center gap-4 px-2">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-[#4bc26d] border-4 border-[rgba(75,194,109,0.4)] shadow-[0px_16px_48px_rgba(0,0,0,0.12),0px_32px_48px_rgba(0,0,0,0.2)]" />
              <div className="flex flex-col gap-[2px]">
                <h1 className="text-xl font-bold text-[#303030]">
                  Create Assignment
                </h1>
                <p className="text-sm font-normal text-[rgba(94,94,94,0.55)]">
                  Set up a new assignment for your students
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-0 border-[2.5px] border-[#5e5e5e] rounded-full" />
            <div className="flex-1 h-0 border-[2.5px] border-[#dadada] rounded-full" />
          </div>

          {/* Form card */}
          <div className="bg-[rgba(255,255,255,0.5)] rounded-[32px] p-5 sm:p-8">
            {/* Section title */}
            <div className="flex flex-col gap-[2px] mb-8">
              <h2 className="text-xl font-bold text-[#303030]">
                Assignment Details
              </h2>
              <p className="text-sm font-normal text-[rgba(94,94,94,0.8)]">
                Basic information about your assignment
              </p>
            </div>

            <AssignmentForm />
          </div>
        </div>
      </main>
    </div>
  );
}
