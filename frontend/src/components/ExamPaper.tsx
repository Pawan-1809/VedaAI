"use client";

import { useRef, useState } from "react";

interface Question {
  number: number;
  text: string;
  type: string;
  marks: number;
  difficulty: "Easy" | "Moderate" | "Hard";
}

interface Section {
  name: string;
  type: string;
  instruction?: string;
  questions: Question[];
}

interface AnswerKeyItem {
  number: number;
  answer: string;
}

interface PaperData {
  title?: string;
  subject?: string;
  grade_level?: string;
  institution?: string;
  duration?: string;
  total_marks?: number;
  sections?: Section[];
  answer_key?: AnswerKeyItem[];
}

interface ExamPaperProps {
  paper: PaperData;
  onBack?: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  Easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200",
  Hard: "bg-rose-50 text-rose-700 border-rose-200",
};

function getSectionMarks(section: Section): number {
  return section.questions.reduce((sum, q) => sum + (q.marks || 0), 0);
}

export default function ExamPaper({
  paper,
  onBack,
  onRegenerate,
  isRegenerating,
}: ExamPaperProps) {
  const paperRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const sections = paper.sections || [];
  const totalMarks =
    paper.total_marks ||
    sections.reduce((s, sec) => s + getSectionMarks(sec), 0);
  const totalQuestions = sections.reduce(
    (s, sec) => s + sec.questions.length,
    0
  );

  const handleDownloadPdf = async () => {
    if (!paperRef.current) return;
    setIsExporting(true);

    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const paperTitle = paper.title || "Assessment_Paper";
      const filename = paperTitle.replace(/\s+/g, "_") + ".pdf";

      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
          },
          jsPDF: {
            unit: "mm",
            format: "a4",
            orientation: "portrait",
          },
          pagebreak: { mode: ["avoid-all", "css", "legacy"] },
        })
        .from(paperRef.current)
        .save();
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Action bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <div className="flex items-center gap-2 flex-wrap">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full text-sm font-medium text-[#303030] hover:bg-[#f6f6f6] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              New Assignment
            </button>
          )}
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-[#dadada] rounded-full text-sm font-medium text-[#303030] hover:bg-[#f6f6f6] disabled:opacity-50 transition-colors"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isRegenerating ? "animate-spin" : ""}
              >
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#181818] rounded-full text-sm font-medium text-white hover:bg-[#303030] disabled:opacity-50 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {isExporting ? "Exporting..." : "Download as PDF"}
          </button>
        </div>
      </div>

      {/* Paper */}
      <div
        ref={paperRef}
        className="bg-white rounded-2xl print:rounded-none shadow-[0_2px_24px_rgba(0,0,0,0.06)] print:shadow-none overflow-hidden"
      >
        {/* Header band */}
        <div className="bg-[#1a1a1a] px-6 py-1.5 flex items-center justify-between print:bg-black">
          <span className="text-[10px] font-medium text-[#ffffff80] tracking-widest uppercase">
            VedaAI Assessment
          </span>
          <span className="text-[10px] font-medium text-[#ffffff80] tracking-widest uppercase">
            Confidential
          </span>
        </div>

        <div className="px-6 sm:px-12 py-8 sm:py-10 flex flex-col gap-8">
          {/* Institution + Title block */}
          <div className="flex flex-col items-center gap-1 text-center border-b-2 border-[#1a1a1a] pb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1a1a1a] tracking-tight">
              {paper.institution || "Delhi Public School, Sector-4, Bokaro"}
            </h1>
            {paper.subject && (
              <p className="text-sm text-[#5e5e5e]">
                Subject: {paper.subject}
              </p>
            )}
            {paper.grade_level && (
              <p className="text-sm text-[#5e5e5e]">
                Class: {paper.grade_level}
              </p>
            )}
          </div>

          {/* Time & Marks row */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#1a1a1a]">
              Time Allowed: <strong>{paper.duration || "3 Hours"}</strong>
            </span>
            <span className="text-[#1a1a1a]">
              Maximum Marks: <strong>{totalMarks}</strong>
            </span>
          </div>

          {/* Student info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4">
            <div className="flex items-end gap-2">
              <span className="text-sm font-semibold text-[#1a1a1a] whitespace-nowrap">
                Name:
              </span>
              <span className="flex-1 border-b border-dashed border-[#a0a0a0] min-w-[120px] h-6" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-sm font-semibold text-[#1a1a1a] whitespace-nowrap">
                Roll No:
              </span>
              <span className="flex-1 border-b border-dashed border-[#a0a0a0] min-w-[80px] h-6" />
            </div>
            <div className="flex items-end gap-2">
              <span className="text-sm font-semibold text-[#1a1a1a] whitespace-nowrap">
                Section:
              </span>
              <span className="flex-1 border-b border-dashed border-[#a0a0a0] min-w-[60px] h-6" />
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-[#fafafa] border border-[#e8e8e8] rounded-xl p-4 print:bg-white print:border-gray-300">
            <p className="text-xs font-semibold text-[#5e5e5e] uppercase tracking-wider mb-2">
              General Instructions
            </p>
            <ul className="text-sm text-[#404040] space-y-1 list-disc list-inside leading-relaxed">
              <li>All questions are compulsory unless stated otherwise.</li>
              <li>Write your answers clearly and legibly.</li>
              <li>Marks for each question are indicated on the right.</li>
              <li>Read each question carefully before answering.</li>
            </ul>
          </div>

          {/* Sections */}
          {sections.map((section, si) => {
            const sectionMarks = getSectionMarks(section);
            const sectionLetter = String.fromCharCode(65 + si);

            return (
              <div key={si} className="flex flex-col gap-4">
                {/* Section header */}
                <div className="flex items-center justify-between border-b-2 border-[#e0e0e0] pb-2">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-[#1a1a1a] text-white text-sm font-bold flex items-center justify-center">
                      {sectionLetter}
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-[#1a1a1a]">
                        {section.name || `Section ${sectionLetter}`}
                      </h2>
                      <p className="text-xs text-[#808080]">{section.type}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[#5e5e5e] bg-[#f5f5f5] px-3 py-1 rounded-full print:bg-gray-100">
                    {sectionMarks} marks
                  </span>
                </div>

                {/* Section instruction */}
                {section.instruction && (
                  <p className="text-xs italic text-[#808080] -mt-2">
                    {section.instruction}
                  </p>
                )}

                {/* Questions */}
                <ol className="flex flex-col gap-3">
                  {section.questions.map((q, qi) => {
                    const diffStyle =
                      DIFFICULTY_STYLES[q.difficulty] ||
                      DIFFICULTY_STYLES.Moderate;

                    return (
                      <li
                        key={qi}
                        className="flex gap-3 sm:gap-4 py-3 px-3 sm:px-4 rounded-xl hover:bg-[#fafafa] transition-colors print:hover:bg-transparent print:py-2 print:px-0"
                      >
                        <span className="text-sm font-bold text-[#1a1a1a] mt-0.5 shrink-0 w-6 text-right">
                          {q.number}.
                        </span>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base text-[#2a2a2a] leading-relaxed font-medium">
                            {q.text}
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${diffStyle}`}
                            >
                              {q.difficulty}
                            </span>
                          </div>
                        </div>

                        <span className="text-sm font-semibold text-[#5e5e5e] shrink-0 mt-0.5 tabular-nums">
                          [{q.marks}]
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })}

          {/* Answer Key toggle */}
          {paper.answer_key && paper.answer_key.length > 0 && (
            <div className="border-t-2 border-[#e0e0e0] pt-4">
              <button
                onClick={() => setShowAnswerKey(!showAnswerKey)}
                className="flex items-center gap-2 text-sm font-bold text-[#1a1a1a] hover:text-[#5e5e5e] transition-colors print:hidden"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${showAnswerKey ? "rotate-90" : ""}`}
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
                Answer Key
              </button>

              {showAnswerKey && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                  {paper.answer_key.map((item, i) => (
                    <div
                      key={i}
                      className="flex gap-2 py-2 border-b border-dashed border-[#e8e8e8] last:border-0"
                    >
                      <span className="text-sm font-bold text-[#1a1a1a] shrink-0 w-8">
                        Q{item.number}.
                      </span>
                      <span className="text-sm text-[#404040]">
                        {item.answer}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Always visible in print */}
              <div className="hidden print:block mt-4">
                <h3 className="text-base font-bold text-[#1a1a1a] mb-3">Answer Key</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  {paper.answer_key.map((item, i) => (
                    <div key={i} className="flex gap-2 py-1">
                      <span className="text-sm font-bold text-[#1a1a1a] shrink-0 w-8">
                        Q{item.number}.
                      </span>
                      <span className="text-sm text-[#404040]">
                        {item.answer}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t-2 border-[#e0e0e0] pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-[#a0a0a0] italic">
              End of Question Paper
            </p>
            <p className="text-xs text-[#a0a0a0]">
              Generated by VedaAI &bull; Total Marks: {totalMarks} &bull; {totalQuestions} Questions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
