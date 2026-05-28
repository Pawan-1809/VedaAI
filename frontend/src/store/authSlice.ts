import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { getAuthToken, setAuthToken, removeAuthToken } from "@/lib/authStorage";

interface AuthState {
  token: string | null;
  user: { username: string } | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AuthState = {
  token: getAuthToken(),
  user: null,
  status: "idle",
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (credentials: Record<string, string>, { rejectWithValue }) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${apiUrl}/auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const err = await res.json();
        return rejectWithValue(err);
      }

      const data = await res.json();
      setAuthToken(data.token);
      return data;
    } catch {
      return rejectWithValue({ detail: "Network error. Please try again." });
    }
  }
);

export const logout = createAsyncThunk("auth/logout", async () => {
  removeAuthToken();
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.token = action.payload.token;
        state.user = { username: action.payload.username };
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as any)?.detail || "Login failed";
      })
      .addCase(logout.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.status = "idle";
      });
  },
});

export default authSlice.reducer;
