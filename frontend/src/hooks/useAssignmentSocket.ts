"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppDispatch } from "@/store/hooks";
import {
  setGenerationResult,
  setGenerationFailed,
  setGenerationStatus,
} from "@/store/assignmentSlice";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const POLL_INTERVAL = 3000;

export function useAssignmentSocket(assignmentId: string | null) {
  const dispatch = useAppDispatch();
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const resolvedRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (!assignmentId || pollRef.current) return;

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/assignments/${assignmentId}/status/`
        );
        if (!res.ok) return;

        const data = await res.json();

        if (data.status === "completed" && data.paper) {
          resolvedRef.current = true;
          stopPolling();
          dispatch(
            setGenerationResult({
              status: "completed",
              paper: data.paper,
            })
          );
        } else if (data.status === "failed") {
          resolvedRef.current = true;
          stopPolling();
          dispatch(setGenerationFailed("Generation failed. Please try again."));
        } else {
          dispatch(setGenerationStatus(data.status));
        }
      } catch {
        // Network error — keep polling
      }
    }, POLL_INTERVAL);
  }, [assignmentId, dispatch, stopPolling]);

  useEffect(() => {
    if (!assignmentId) return;

    resolvedRef.current = false;

    const ws = new WebSocket(
      `${WS_BASE}/ws/assignments/${assignmentId}/`
    );
    wsRef.current = ws;

    ws.onopen = () => {
      dispatch(setGenerationStatus("processing"));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "generation_complete") {
        resolvedRef.current = true;
        stopPolling();
        dispatch(
          setGenerationResult({
            status: data.status,
            paper: data.paper,
          })
        );
        ws.close();
      } else if (data.type === "generation_failed") {
        resolvedRef.current = true;
        stopPolling();
        dispatch(setGenerationFailed(data.error || "Generation failed."));
        ws.close();
      }
    };

    ws.onerror = () => {
      if (!resolvedRef.current) {
        startPolling();
      }
    };

    ws.onclose = () => {
      if (!resolvedRef.current) {
        startPolling();
      }
    };

    return () => {
      stopPolling();
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [assignmentId, dispatch, startPolling, stopPolling]);
}
