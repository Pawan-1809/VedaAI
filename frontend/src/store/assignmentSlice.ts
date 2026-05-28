import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { AssignmentFormData, QuestionTypeItem } from "@/lib/validationSchema";

interface AssignmentState {
  formData: AssignmentFormData;
  isSubmitting: boolean;
  error: string | null;
  assignmentId: string | null;
  generationStatus: "idle" | "processing" | "completed" | "failed";
  generatedPaper: Record<string, unknown> | null;
  uploadedFile: File | null;
}

const initialState: AssignmentState = {
  formData: {
    due_date: "",
    question_types: [
      { type: "Multiple Choice Questions", count: 4, marks_per_question: 1 },
      { type: "Short Questions", count: 3, marks_per_question: 2 },
    ],
    additional_instructions: "",
  },
  isSubmitting: false,
  error: null,
  assignmentId: null,
  generationStatus: "idle",
  generatedPaper: null,
  uploadedFile: null,
};

export const submitAssignment = createAsyncThunk(
  "assignment/submit",
  async (
    payload: { data: AssignmentFormData; file: File | null },
    { rejectWithValue }
  ) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const formData = new FormData();
      formData.append("due_date", payload.data.due_date);
      formData.append(
        "question_types",
        JSON.stringify(payload.data.question_types)
      );
      formData.append(
        "additional_instructions",
        payload.data.additional_instructions || ""
      );

      if (payload.file) {
        formData.append("uploaded_file", payload.file);
      }

      const res = await fetch(`${apiUrl}/assignments/`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        return rejectWithValue(err);
      }

      return (await res.json()) as { id: string };
    } catch {
      return rejectWithValue({ detail: "Network error. Please try again." });
    }
  }
);

export const regenerateAssignment = createAsyncThunk(
  "assignment/regenerate",
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as { assignment: AssignmentState }).assignment;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

      const formData = new FormData();
      formData.append("due_date", state.formData.due_date);
      formData.append(
        "question_types",
        JSON.stringify(state.formData.question_types)
      );
      formData.append(
        "additional_instructions",
        state.formData.additional_instructions || ""
      );

      if (state.uploadedFile) {
        formData.append("uploaded_file", state.uploadedFile);
      }

      const res = await fetch(`${apiUrl}/assignments/`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        return rejectWithValue(err);
      }

      return (await res.json()) as { id: string };
    } catch {
      return rejectWithValue({ detail: "Network error. Please try again." });
    }
  }
);

const assignmentSlice = createSlice({
  name: "assignment",
  initialState,
  reducers: {
    setDueDate(state, action: PayloadAction<string>) {
      state.formData.due_date = action.payload;
    },
    setAdditionalInstructions(state, action: PayloadAction<string>) {
      state.formData.additional_instructions = action.payload;
    },
    addQuestionType(state, action: PayloadAction<QuestionTypeItem>) {
      state.formData.question_types.push(action.payload);
    },
    removeQuestionType(state, action: PayloadAction<number>) {
      state.formData.question_types.splice(action.payload, 1);
    },
    updateQuestionType(
      state,
      action: PayloadAction<{ index: number; field: keyof QuestionTypeItem; value: string | number }>
    ) {
      const { index, field, value } = action.payload;
      const qt = state.formData.question_types[index];
      if (qt) {
        (qt as Record<string, string | number>)[field] = value;
      }
    },
    setFormData(state, action: PayloadAction<AssignmentFormData>) {
      state.formData = action.payload;
    },
    setUploadedFile(state, action: PayloadAction<File | null>) {
      // File objects can't be serialized by Redux but we store the reference
      // for regenerate functionality. This is intentional.
      state.uploadedFile = action.payload;
    },
    resetForm(state) {
      Object.assign(state, { ...initialState, uploadedFile: null });
    },
    clearError(state) {
      state.error = null;
    },
    setGenerationStatus(state, action: PayloadAction<string>) {
      state.generationStatus = action.payload as AssignmentState["generationStatus"];
    },
    setGenerationResult(
      state,
      action: PayloadAction<{ status: string; paper: Record<string, unknown> }>
    ) {
      state.generationStatus = "completed";
      state.generatedPaper = action.payload.paper;
    },
    setGenerationFailed(state, action: PayloadAction<string>) {
      state.generationStatus = "failed";
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitAssignment.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(submitAssignment.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.assignmentId = action.payload.id;
        state.generationStatus = "processing";
      })
      .addCase(submitAssignment.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error =
          typeof action.payload === "object" && action.payload !== null
            ? JSON.stringify(action.payload)
            : "Something went wrong";
      })
      .addCase(regenerateAssignment.pending, (state) => {
        state.generationStatus = "processing";
        state.generatedPaper = null;
        state.error = null;
      })
      .addCase(regenerateAssignment.fulfilled, (state, action) => {
        state.assignmentId = action.payload.id;
        state.generationStatus = "processing";
      })
      .addCase(regenerateAssignment.rejected, (state, action) => {
        state.generationStatus = "failed";
        state.error =
          typeof action.payload === "object" && action.payload !== null
            ? JSON.stringify(action.payload)
            : "Regeneration failed";
      });
  },
});

export const {
  setDueDate,
  setAdditionalInstructions,
  addQuestionType,
  removeQuestionType,
  updateQuestionType,
  setFormData,
  setUploadedFile,
  resetForm,
  clearError,
  setGenerationStatus,
  setGenerationResult,
  setGenerationFailed,
} = assignmentSlice.actions;

export default assignmentSlice.reducer;
