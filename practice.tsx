// File: src/pages/practice.tsx
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Practice = () => {
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [languageId, setLanguageId] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const [params] = useSearchParams();

  useEffect(() => {
    const lang = params.get("language");
    if (lang) setLanguageId(lang);
  }, [params]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => audioChunks.current.push(e.data);
    recorder.onstop = handleStop;
    audioChunks.current = [];
    recorder.start();
    setMediaRecorder(recorder);
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setRecording(false);
  };

  const handleStop = async () => {
    const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
    const base64 = await blobToBase64(audioBlob);
    const response = await fetch("https://yifagiigrzcmsilvydqu.functions.supabase.co/speech-to-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio: base64 }),
    });
    const data = await response.json();
    setTranscript(data.text || "No transcription found");
    saveSession(data.text);
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
      reader.readAsDataURL(blob);
    });
  };

  const saveSession = async (text: string) => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user || !languageId) return;

    await supabase.from("practice_sessions").insert({
      user_id: user.id,
      language_id: languageId,
      session_type: "conversation",
      messages: JSON.stringify([{ role: "user", content: text }]),
    });
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Practice Session</h1>
      <div className="space-y-4">
        <Button onClick={recording ? stopRecording : startRecording}>
          {recording ? "Stop Recording" : "Start Speaking"}
        </Button>
        {transcript && (
          <div className="bg-gray-100 p-4 rounded">
            <p className="text-sm text-muted-foreground">Transcription:</p>
            <p className="text-lg">{transcript}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Practice;
