import { configureStore } from "@reduxjs/toolkit";
import assignmentReducer from "./assignmentSlice";
import authReducer from "./authSlice";

export const makeStore = () => configureStore({
  reducer: {
    assignment: assignmentReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["assignment/setUploadedFile", "assignment/submit/pending"],
        ignoredPaths: ["assignment.uploadedFile"],
      },
    }),
});

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
