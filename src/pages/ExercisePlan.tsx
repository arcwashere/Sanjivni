import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, CameraOff, Hand, StretchHorizontal, Armchair, Play, Square, RotateCcw, Loader2 } from "lucide-react";
import { usePoseDetection } from "@/hooks/usePoseDetection";
import type { PoseLandmarkerResult } from "@mediapipe/tasks-vision";

type ExerciseId = "hands-up" | "flyaways" | "sit-reach";

const exercises = [
  { id: "hands-up" as ExerciseId, name: "Hands Up & Stretch", description: "Raise both arms overhead and stretch", icon: Hand },
  { id: "flyaways" as ExerciseId, name: "Hand Flyaways", description: "Extend arms to sides and bring back", icon: StretchHorizontal },
  { id: "sit-reach" as ExerciseId, name: "Sit & Reach", description: "Sit and reach forward to touch toes", icon: Armchair },
];

const POSE_CONNECTIONS = [
  [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 12], [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
];

const ExercisePlan = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseId | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [repCounts, setRepCounts] = useState<Record<string, number>>({ "hands-up": 0, "flyaways": 0, "sit-reach": 0 });
  const streamRef = useRef<MediaStream | null>(null);
  const { initialize, ready, loading, startDetection, stopDetection, cleanup } = usePoseDetection();

  const drawLandmarks = useCallback((result: PoseLandmarkerResult) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!result.landmarks || result.landmarks.length === 0) return;
    const lm = result.landmarks[0];

    // Draw connections
    ctx.strokeStyle = "hsl(152, 45%, 42%)";
    ctx.lineWidth = 3;
    POSE_CONNECTIONS.forEach(([a, b]) => {
      if (lm[a] && lm[b]) {
        ctx.beginPath();
        ctx.moveTo(lm[a].x * canvas.width, lm[a].y * canvas.height);
        ctx.lineTo(lm[b].x * canvas.width, lm[b].y * canvas.height);
        ctx.stroke();
      }
    });

    // Draw points
    lm.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x * canvas.width, point.y * canvas.height, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "hsl(152, 45%, 55%)";
      ctx.fill();
      ctx.strokeStyle = "hsl(0, 0%, 100%)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } });
      streamRef.current = stream;
      setCameraOn(true);
      await initialize();
    } catch {
      alert("Unable to access camera. Please allow camera permissions.");
    }
  }, [initialize]);

  // Attach stream to video element once it's rendered
  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOn]);

  const stopCamera = useCallback(() => {
    stopDetection();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
    setIsTracking(false);
  }, [stopDetection]);

  const startTracking = () => {
    if (!selectedExercise || !cameraOn || !ready || !videoRef.current) return;
    setIsTracking(true);
    startDetection(
      videoRef.current,
      selectedExercise,
      () => setRepCounts((prev) => ({ ...prev, [selectedExercise]: prev[selectedExercise] + 1 })),
      drawLandmarks
    );
  };

  const stopTracking = () => {
    setIsTracking(false);
    stopDetection();
  };

  const resetReps = () => {
    if (selectedExercise) {
      setRepCounts((prev) => ({ ...prev, [selectedExercise]: 0 }));
    }
  };

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      cleanup();
    };
  }, [cleanup]);

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="bg-primary text-primary-foreground px-5 pt-12 pb-6 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => { stopCamera(); navigate("/parent/overview"); }} className="w-9 h-9 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Exercise Plan</h1>
        </div>
        <p className="text-sm opacity-80">Select an exercise, turn on camera, and start counting reps</p>
      </div>

      <div className="px-5 pt-5 max-w-lg mx-auto space-y-5">
        {/* Camera View */}
        <div className="relative w-full aspect-[4/3] bg-foreground/5 rounded-2xl overflow-hidden border border-border">
          {cameraOn ? (
            <>
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
              <CameraOff className="w-10 h-10" />
              <p className="text-sm">Camera is off</p>
            </div>
          )}
          {selectedExercise && (
            <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-lg font-bold shadow-lg">
              {repCounts[selectedExercise]} reps
            </div>
          )}
          {loading && (
            <div className="absolute inset-0 bg-foreground/30 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-xl text-sm font-medium text-foreground shadow-lg">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading AI model…
              </div>
            </div>
          )}
        </div>

        {/* Camera Controls */}
        <div className="flex gap-3">
          <button
            onClick={cameraOn ? stopCamera : startCamera}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all ${
              cameraOn ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
            }`}
          >
            {cameraOn ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
            {cameraOn ? "Stop Camera" : "Start Camera"}
          </button>
        </div>

        {/* Exercise Selection */}
        <div>
          <h2 className="section-title mb-3">Choose Exercise</h2>
          <div className="space-y-2">
            {exercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => { setSelectedExercise(ex.id); stopTracking(); }}
                className={`w-full glass-card rounded-xl p-4 flex items-center gap-3 text-left transition-all ${
                  selectedExercise === ex.id ? "ring-2 ring-primary border-primary" : ""
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <ex.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">{ex.description}</p>
                </div>
                <span className="text-lg font-bold text-primary">{repCounts[ex.id]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tracking Controls */}
        {selectedExercise && cameraOn && (
          <div className="flex gap-3">
            <button
              onClick={isTracking ? stopTracking : startTracking}
              disabled={!ready}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all disabled:opacity-50 ${
                isTracking ? "bg-warning text-warning-foreground" : "bg-primary text-primary-foreground"
              }`}
            >
              {!ready ? <Loader2 className="w-4 h-4 animate-spin" /> : isTracking ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {!ready ? "Loading…" : isTracking ? "Stop" : "Start Counting"}
            </button>
            <button onClick={resetReps} className="w-12 flex items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExercisePlan;
