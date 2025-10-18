import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function decodeBase64Chunks(base64: string, chunkSize = 32768): Uint8Array {
  const chunks: Uint8Array[] = [];
  for (let i = 0; i < base64.length; i += chunkSize) {
    const chunk = base64.slice(i, i + chunkSize);
    const binary = atob(chunk);
    const bytes = new Uint8Array(binary.length);
    for (let j = 0; j < binary.length; j++) {
      bytes[j] = binary.charCodeAt(j);
    }
    chunks.push(bytes);
  }

  const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    const { audio } = await req.json();
    if (!audio) throw new Error("Missing audio data");

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) throw new Error("Missing OpenAI API key");

    const audioBuffer = decodeBase64Chunks(audio);
    const blob = new Blob([audioBuffer], { type: "audio/webm" });

    const form = new FormData();
    form.append("file", blob, "audio.webm");
    form.append("model", "whisper-1");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: Bearer ${apiKey} },
      body: form,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(OpenAI error: ${error});
    }

    const result = await response.json();
    return new Response(JSON.stringify({ text: result.text }), {
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
