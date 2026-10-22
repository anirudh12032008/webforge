"use client";

import { Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// Minimal Web Speech API surface (not in TS's DOM lib; Chrome/Edge/Safari ship it, often prefixed).
type RecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Props = {
  lang: string;
  onFinal: (text: string) => void;
  labels: { start: string; stop: string; denied: string; error: string };
};

/**
 * Mic toggle for dictation. Streams the browser's speech recognition (continuous + interim) in the
 * chosen language: interim words preview next to the button, finished phrases go to `onFinal`.
 * Renders nothing where the browser has no speech recognition (e.g. Firefox).
 */
export function VoiceInputButton({ lang, onFinal, labels }: Props) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const recognition = useRef<Recognition | null>(null);

  useEffect(() => {
    setSupported(recognitionCtor() !== null);
    return () => recognition.current?.stop();
  }, []);

  if (!supported) return null;

  const start = () => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (event) => {
      let pending = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const { isFinal, 0: alt } = event.results[i];
        if (isFinal) onFinal(alt.transcript.trim());
        else pending += alt.transcript;
      }
      setInterim(pending);
    };
    r.onerror = ({ error }) => {
      if (error === "not-allowed" || error === "service-not-allowed") toast.error(labels.denied);
      else if (error !== "aborted" && error !== "no-speech") toast.error(labels.error);
    };
    r.onend = () => {
      setListening(false);
      setInterim("");
    };
    recognition.current = r;
    r.start();
    setListening(true);
  };

  return (
    <div className="flex min-w-0 items-center gap-2">
      {interim && <span className="truncate text-xs text-muted-foreground italic" aria-live="polite">{interim}</span>}
      <Button
        type="button"
        size="sm"
        variant={listening ? "destructive" : "outline"}
        aria-pressed={listening}
        aria-label={listening ? labels.stop : labels.start}
        onClick={() => (listening ? recognition.current?.stop() : start())}
      >
        {listening ? (
          <>
            <span className="size-2 animate-pulse rounded-full bg-safety motion-reduce:animate-none" aria-hidden />
            <Square aria-hidden />
          </>
        ) : (
          <Mic aria-hidden />
        )}
        <span className="hidden sm:inline">{listening ? labels.stop : labels.start}</span>
      </Button>
    </div>
  );
}
