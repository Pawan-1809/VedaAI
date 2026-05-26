import { z } from "zod";

export const QUESTION_TYPE_OPTIONS = [
  "Multiple Choice Questions",
  "Short Questions",
  "Long Questions",
  "Diagram/Graph-Based Questions",
  "Numerical Problems",
  "True/False",
  "Fill in the Blanks",
  "Match the Following",
] as const;

const questionTypeItemSchema = z.object({
  type: z.string().min(1, "Question type is required"),
  count: z.number().int().min(1, "Must have at least 1 question"),
  marks_per_question: z.number().int().min(1, "Marks must be at least 1"),
});

export const assignmentFormSchema = z.object({
  due_date: z.string().min(1, "Due date is required"),
  question_types: z
    .array(questionTypeItemSchema)
    .min(1, "Add at least one question type"),
  additional_instructions: z.string(),
});

export type AssignmentFormData = z.infer<typeof assignmentFormSchema>;
export type QuestionTypeItem = z.infer<typeof questionTypeItemSchema>;
