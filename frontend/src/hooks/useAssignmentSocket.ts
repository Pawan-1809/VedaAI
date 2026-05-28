"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppDispatch } from "@/store/hooks";
import {
  setGenerationResult,
  setGenerationFailed,
  setGenerationStatus,
} from "@/store/assignmentSlice";

const WS_BASE = (process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws").replace(/\/+$/, "");
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const POLL_INTERVAL = 3000;
const MAX_POLL_FAILURES = 10;

export function useAssignmentSocket(assignmentId: string | null) {
  const dispatch = useAppDispatch();
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const resolvedRef = useRef(false);
  const pollFailureRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (!assignmentId || pollRef.current) return;

    const recordPollingFailure = () => {
      pollFailureRef.current += 1;

      if (pollFailureRef.current >= MAX_POLL_FAILURES) {
        resolvedRef.current = true;
        stopPolling();
        dispatch(
          setGenerationFailed(
            "Unable to confirm generation status. Please check your connection and try again."
          )
        );
      }
    };

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/assignments/${assignmentId}/status/`
        );

        if (!res.ok) {
          recordPollingFailure();
          return;
        }

        const data = await res.json();
        pollFailureRef.current = 0;

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
          dispatch(
            setGenerationFailed(
              data.error || "Generation failed. Please try again."
            )
          );
        } else {
          dispatch(setGenerationStatus(data.status));
        }
      } catch {
        recordPollingFailure();
      }
    }, POLL_INTERVAL);
  }, [assignmentId, dispatch, stopPolling]);

  useEffect(() => {
    if (!assignmentId) return;

    resolvedRef.current = false;
    pollFailureRef.current = 0;

    startPolling();

    const ws = new WebSocket(`${WS_BASE}/assignments/${assignmentId}/`);
    wsRef.current = ws;

    ws.onopen = () => {
      dispatch(setGenerationStatus("processing"));
    };

    ws.onmessage = (event) => {
      let data: {
        type?: string;
        status?: string;
        paper?: Record<string, unknown>;
        error?: string;
      };

      try {
        data = JSON.parse(event.data);
      } catch {
        resolvedRef.current = true;
        stopPolling();
        dispatch(
          setGenerationFailed(
            "Received an invalid generation update. Please try again."
          )
        );
        ws.close();
        return;
      }

      if (data.type === "generation_complete") {
        resolvedRef.current = true;
        stopPolling();
        dispatch(
          setGenerationResult({
            status: data.status || "completed",
            paper: data.paper || {},
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

    return () => {
      stopPolling();
      if (
        ws.readyState === WebSocket.OPEN ||
        ws.readyState === WebSocket.CONNECTING
      ) {
        ws.close();
      }
    };
  }, [assignmentId, dispatch, startPolling, stopPolling]);
}
