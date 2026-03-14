import { useRef, useCallback, useState, useEffect } from "react";
import { FilesetResolver, PoseLandmarker, type PoseLandmarkerResult, type NormalizedLandmark } from "@mediapipe/tasks-vision";

// Landmark indices (MediaPipe pose model)
const LEFT_WRIST = 15;
const RIGHT_WRIST = 16;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;
const LEFT_ELBOW = 13;
const RIGHT_ELBOW = 14;
const LEFT_HIP = 23;
const RIGHT_HIP = 24;
const LEFT_ANKLE = 27;
const RIGHT_ANKLE = 28;
const NOSE = 0;

type ExerciseId = "hands-up" | "flyaways" | "sit-reach";

function angle(a: NormalizedLandmark, b: NormalizedLandmark, c: NormalizedLandmark): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let deg = Math.abs((radians * 180) / Math.PI);
  if (deg > 180) deg = 360 - deg;
  return deg;
}

// Detects phase for each exercise: "up" or "down"
function getPhase(landmarks: NormalizedLandmark[], exercise: ExerciseId): "up" | "down" | null {
  if (!landmarks || landmarks.length < 33) return null;

  switch (exercise) {
    case "hands-up": {
      // Arms above head: wrists above nose
      const wristAvgY = (landmarks[LEFT_WRIST].y + landmarks[RIGHT_WRIST].y) / 2;
      const noseY = landmarks[NOSE].y;
      const shoulderAvgY = (landmarks[LEFT_SHOULDER].y + landmarks[RIGHT_SHOULDER].y) / 2;
      return wristAvgY < noseY ? "up" : wristAvgY > shoulderAvgY ? "down" : null;
    }
    case "flyaways": {
      // Arms spread wide: angle at shoulder > 140 = up, < 60 = down
      const leftAngle = angle(landmarks[LEFT_HIP], landmarks[LEFT_SHOULDER], landmarks[LEFT_ELBOW]);
      const rightAngle = angle(landmarks[RIGHT_HIP], landmarks[RIGHT_SHOULDER], landmarks[RIGHT_ELBOW]);
      const avg = (leftAngle + rightAngle) / 2;
      return avg > 130 ? "up" : avg < 50 ? "down" : null;
    }
    case "sit-reach": {
      // Forward reach: angle at hip < 100 = up (reaching), > 150 = down (sitting up)
      const leftHipAngle = angle(landmarks[LEFT_SHOULDER], landmarks[LEFT_HIP], landmarks[LEFT_ANKLE]);
      const rightHipAngle = angle(landmarks[RIGHT_SHOULDER], landmarks[RIGHT_HIP], landmarks[RIGHT_ANKLE]);
      const avg = (leftHipAngle + rightHipAngle) / 2;
      return avg < 100 ? "up" : avg > 140 ? "down" : null;
    }
    default:
      return null;
  }
}

export function usePoseDetection() {
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const phaseRef = useRef<"up" | "down" | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(-1);

  const initialize = useCallback(async () => {
    if (landmarkerRef.current) return;
    setLoading(true);
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });
      setReady(true);
    } catch (e) {
      console.error("Failed to load MediaPipe Pose Landmarker:", e);
      // Fallback to CPU
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });
        setReady(true);
      } catch (e2) {
        console.error("Failed to load on CPU too:", e2);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const detectLoop = useCallback(
    (
      video: HTMLVideoElement,
      exercise: ExerciseId,
      onRep: () => void,
      onLandmarks: (result: PoseLandmarkerResult) => void
    ) => {
      if (!landmarkerRef.current || !video || video.paused || video.ended) return;

      const now = performance.now();
      if (now === lastTimeRef.current) {
        animFrameRef.current = requestAnimationFrame(() => detectLoop(video, exercise, onRep, onLandmarks));
        return;
      }
      lastTimeRef.current = now;

      try {
        const result = landmarkerRef.current.detectForVideo(video, now);
        onLandmarks(result);

        if (result.landmarks && result.landmarks.length > 0) {
          const phase = getPhase(result.landmarks[0], exercise);
          console.log(`[PoseDetection] exercise=${exercise} phase=${phase} prevPhase=${phaseRef.current}`);
          if (phase === "up" && phaseRef.current === "down") {
            console.log("[PoseDetection] REP COUNTED!");
            onRep();
          }
          if (phase) phaseRef.current = phase;
        } else {
          console.log("[PoseDetection] No landmarks detected");
        }
      } catch (e) {
        console.error("[PoseDetection] frame error:", e);
      }

      animFrameRef.current = requestAnimationFrame(() => detectLoop(video, exercise, onRep, onLandmarks));
    },
    []
  );

  const startDetection = useCallback(
    (
      video: HTMLVideoElement,
      exercise: ExerciseId,
      onRep: () => void,
      onLandmarks: (result: PoseLandmarkerResult) => void
    ) => {
      phaseRef.current = null;
      lastTimeRef.current = -1;
      detectLoop(video, exercise, onRep, onLandmarks);
    },
    [detectLoop]
  );

  const stopDetection = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    phaseRef.current = null;
  }, []);

  const cleanup = useCallback(() => {
    stopDetection();
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    setReady(false);
  }, [stopDetection]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { initialize, ready, loading, startDetection, stopDetection, cleanup };
}
