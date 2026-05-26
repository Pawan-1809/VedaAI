"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Upload,
  CalendarPlus,
  ChevronDown,
  X,
  Plus,
  Mic,
  ArrowLeft,
  ArrowRight,
  Loader2,
  XCircle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  submitAssignment,
  regenerateAssignment,
  setFormData,
  clearError,
  resetForm,
} from "@/store/assignmentSlice";
import {
  assignmentFormSchema,
  QUESTION_TYPE_OPTIONS,
  type AssignmentFormData,
} from "@/lib/validationSchema";
import { useAssignmentSocket } from "@/hooks/useAssignmentSocket";
import StepperInput from "./StepperInput";
import ExamPaper from "./ExamPaper";

export default function AssignmentForm() {
  const dispatch = useAppDispatch();
  const {
    isSubmitting,
    error,
    assignmentId,
    generationStatus,
    generatedPaper,
  } = useAppSelector((s) => s.assignment);

  useAssignmentSocket(assignmentId);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      due_date: "",
      question_types: [
        { type: "Multiple Choice Questions", count: 4, marks_per_question: 1 },
        { type: "Short Questions", count: 3, marks_per_question: 2 },
        { type: "Diagram/Graph-Based Questions", count: 5, marks_per_question: 5 },
        { type: "Numerical Problems", count: 5, marks_per_question: 5 },
      ],
      additional_instructions: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "question_types",
  });

  const questionTypes = watch("question_types");

  const totalQuestions = questionTypes.reduce((sum, qt) => sum + (qt.count || 0), 0);
  const totalMarks = questionTypes.reduce(
    (sum, qt) => sum + (qt.count || 0) * (qt.marks_per_question || 0),
    0
  );

  const usedTypes = questionTypes.map((qt) => qt.type);
  const availableTypes = QUESTION_TYPE_OPTIONS.filter(
    (t) => !usedTypes.includes(t)
  );

  const onSubmit = async (data: AssignmentFormData) => {
    dispatch(setFormData(data));
    dispatch(clearError());
    dispatch(submitAssignment(data));
  };

  if (assignmentId && generationStatus === "completed" && generatedPaper) {
    return (
      <ExamPaper
        paper={generatedPaper as Record<string, unknown>}
        onBack={() => dispatch(resetForm())}
        onRegenerate={() => dispatch(regenerateAssignment())}
        isRegenerating={false}
      />
    );
  }

  if (assignmentId && generationStatus === "failed") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <XCircle size={48} className="text-red-500" />
        <h2 className="text-xl font-bold text-[#303030]">Generation Failed</h2>
        <p className="text-sm text-[rgba(94,94,94,0.8)] text-center max-w-md">
          {error || "Something went wrong while generating the paper."}
        </p>
        <button
          type="button"
          onClick={() => dispatch(resetForm())}
          className="flex items-center gap-1 px-6 py-3 bg-[#181818] rounded-full text-base font-medium text-white hover:bg-[#303030] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (assignmentId && generationStatus === "processing") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-[#dadada] border-t-[#303030] animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#303030]">
            Generating Your Paper...
          </h2>
          <p className="text-sm text-[rgba(94,94,94,0.8)] mt-1">
            AI is crafting your assessment. This usually takes 10-30 seconds.
          </p>
        </div>
        <p className="text-xs text-[rgba(94,94,94,0.55)]">
          Assignment ID: {assignmentId}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-8">
      {/* File Upload Zone */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col items-center justify-center gap-4 px-8 py-6 bg-white border-[1.75px] border-dashed border-[rgba(0,0,0,0.2)] rounded-3xl min-h-[200px] cursor-pointer hover:border-[#303030]/40 transition-colors">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <Upload size={24} strokeWidth={2.5} className="text-[#1e1e1e]" />
          </div>
          <div className="flex flex-col gap-1 w-full">
            <p className="text-base font-medium text-[#303030] text-center">
              Choose a file or drag & drop it here
            </p>
            <p className="text-sm font-normal text-[#a9a9a9] text-center">
              JPEG, PNG, upto 10MB
            </p>
          </div>
          <button
            type="button"
            className="px-6 py-2 bg-[#f6f6f6] rounded-full text-sm font-medium text-[#303030] hover:bg-[#eaeaea] transition-colors"
          >
            Browse File
          </button>
        </div>
        <p className="text-base font-medium text-[rgba(48,48,48,0.6)]">
          Upload images of your preferred document/image
        </p>
      </div>

      {/* Due Date */}
      <div className="flex flex-col gap-2">
        <label className="text-base font-bold text-[#303030]">Due Date</label>
        <div className="relative">
          <input
            type="date"
            {...register("due_date")}
            className="w-full h-[44px] px-4 border border-[#dadada] rounded-full text-base font-medium text-[#303030] bg-transparent outline-none focus:border-[#303030] transition-colors appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-4 [&::-webkit-calendar-picker-indicator]:w-6 [&::-webkit-calendar-picker-indicator]:h-6 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            placeholder="DD-MM-YYYY"
          />
          <CalendarPlus
            size={24}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2b2b2b] pointer-events-none"
          />
        </div>
        {errors.due_date && (
          <p className="text-xs text-red-500 mt-1">{errors.due_date.message}</p>
        )}
      </div>

      {/* Question Types + Counts + Marks */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-start gap-16">
          {/* Left: Question type selectors */}
          <div className="flex flex-col gap-4 flex-1">
            <h3 className="text-base font-bold text-[#303030]">Question Type</h3>

            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1">
                    <select
                      {...register(`question_types.${index}.type`)}
                      className="w-full h-[44px] px-4 pr-10 bg-white rounded-full text-base font-medium text-[#303030] outline-none appearance-none cursor-pointer"
                    >
                      <option value={questionTypes[index]?.type}>
                        {questionTypes[index]?.type}
                      </option>
                      {availableTypes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#303030] pointer-events-none"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                  className="w-4 h-4 flex items-center justify-center text-[#303030] hover:text-red-500 disabled:opacity-30 transition-colors"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>
            ))}

            {/* Add Question Type */}
            {availableTypes.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  append({
                    type: availableTypes[0],
                    count: 1,
                    marks_per_question: 1,
                  })
                }
                className="flex items-center gap-2 group"
              >
                <span className="w-9 h-9 rounded-full bg-[#2b2b2b] flex items-center justify-center group-hover:bg-[#181818] transition-colors">
                  <Plus size={20} className="text-white" />
                </span>
                <span className="text-sm font-bold text-[#303030]">
                  Add Question Type
                </span>
              </button>
            )}
          </div>

          {/* Right: Count + Marks columns */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center gap-4">
              <h4 className="text-base font-medium text-[#303030] whitespace-nowrap">
                No. of Questions
              </h4>
              {fields.map((field, index) => (
                <StepperInput
                  key={`count-${field.id}`}
                  value={questionTypes[index]?.count ?? 1}
                  onChange={(v) => setValue(`question_types.${index}.count`, v)}
                />
              ))}
            </div>

            <div className="flex flex-col items-center gap-4">
              <h4 className="text-base font-medium text-[#303030]">Marks</h4>
              {fields.map((field, index) => (
                <StepperInput
                  key={`marks-${field.id}`}
                  value={questionTypes[index]?.marks_per_question ?? 1}
                  onChange={(v) =>
                    setValue(`question_types.${index}.marks_per_question`, v)
                  }
                />
              ))}
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="flex flex-col gap-1 text-right">
            <span className="text-base font-medium text-[#303030]">
              Total Questions : {totalQuestions}
            </span>
            <span className="text-base font-medium text-[#303030]">
              Total Marks : {totalMarks}
            </span>
          </div>
        </div>

        {errors.question_types && (
          <p className="text-xs text-red-500">{errors.question_types.message}</p>
        )}
      </div>

      {/* Additional Instructions */}
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-bold text-[#303030]">
          Additional Information{" "}
          <span className="font-normal text-[rgba(48,48,48,0.6)]">
            (For better output)
          </span>
        </h3>
        <div className="relative">
          <textarea
            {...register("additional_instructions")}
            placeholder="e.g Generate a question paper for 3 hour exam duration..."
            rows={3}
            className="w-full px-4 py-4 bg-[rgba(255,255,255,0.25)] border-[1.25px] border-dashed border-[#dadada] rounded-2xl text-sm font-medium text-[#303030] placeholder:text-[rgba(48,48,48,0.6)] outline-none resize-none focus:border-[#303030]/50 transition-colors"
          />
          <div className="absolute right-3 bottom-3 w-9 h-9 rounded-full bg-[#f0f0f0] flex items-center justify-center">
            <Mic size={16} className="text-[#303030]" />
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-2xl text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-between items-center pt-2">
        <button
          type="button"
          className="flex items-center gap-1 px-6 py-3 bg-white rounded-full text-base font-medium text-[#303030] hover:bg-[#f6f6f6] transition-colors"
        >
          <ArrowLeft size={20} />
          Previous
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-1 px-6 py-3 bg-[#181818] rounded-full text-base font-medium text-white hover:bg-[#303030] disabled:opacity-60 transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Next
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
