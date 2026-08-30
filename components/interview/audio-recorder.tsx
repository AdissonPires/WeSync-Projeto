"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Mic, Square, RotateCcw, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { transcribeAudioStep } from "@/app/actions/transcription";

type RecorderState = "idle" | "recording" | "recorded" | "transcribing" | "transcribed";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioRecorder({
  stepLabel,
  onTranscript,
}: {
  stepLabel: string;
  onTranscript: (text: string) => void;
}) {
  const [state, setState] = useState<RecorderState>("idle");
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        setState("recorded");
        streamRef.current?.getTracks().forEach((t) => t.stop());
        void handleTranscribe(blob);
      };

      recorder.start();
      setState("recording");
      setSeconds(0);
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  async function handleTranscribe(blob: Blob) {
    setState("transcribing");
    const formData = new FormData();
    formData.append("audio", blob, "gravacao.webm");
    formData.append("stepLabel", stepLabel);

    const result = await transcribeAudioStep(formData);
    if (result.success && result.data) {
      setTranscript(result.data.text);
      onTranscript(result.data.text);
      setState("transcribed");
    } else {
      toast.error(result.error ?? "Não foi possível transcrever o áudio.");
      setState("recorded");
    }
  }

  function reset() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setTranscript("");
    onTranscript("");
    setSeconds(0);
    setState("idle");
  }

  return (
    <div className="rounded-lg border border-dashed border-brand-border p-3">
      {state === "idle" && (
        <Button type="button" variant="outline" size="sm" onClick={startRecording}>
          <Mic className="h-3.5 w-3.5" />
          Gravar nota de voz (opcional)
        </Button>
      )}

      {state === "recording" && (
        <div className="flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <span className="font-mono text-sm text-brand-text">{formatTime(seconds)}</span>
          <div className="flex h-4 flex-1 items-center gap-0.5 overflow-hidden">
            {Array.from({ length: 24 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "w-1 rounded-full bg-brand-primary/70",
                  "animate-pulse"
                )}
                style={{
                  height: `${30 + ((i * 37) % 70)}%`,
                  animationDelay: `${(i % 6) * 100}ms`,
                }}
              />
            ))}
          </div>
          <Button type="button" variant="destructive" size="sm" onClick={stopRecording}>
            <Square className="h-3 w-3" />
            Parar
          </Button>
        </div>
      )}

      {(state === "recorded" || state === "transcribing" || state === "transcribed") && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            {audioUrl && <audio src={audioUrl} controls className="h-9 flex-1" />}
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5" />
              Regravar
            </Button>
          </div>

          {state === "transcribing" && (
            <p className="flex items-center gap-1.5 text-xs text-brand-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Transcrevendo áudio…
            </p>
          )}

          {state === "transcribed" && transcript && (
            <div className="flex items-start gap-1.5 rounded-md bg-brand-bg p-2 text-xs text-brand-muted">
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-brand-primary" />
              <span>{transcript}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
