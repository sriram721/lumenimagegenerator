import { createFileRoute } from "@tanstack/react-router";

const STYLE_PRESETS: Record<string, string> = {
  realistic: "photorealistic, ultra detailed, 8k, sharp focus, natural lighting",
  anime: "anime style, studio ghibli inspired, vibrant colors, cel shading",
  cinematic: "cinematic lighting, dramatic atmosphere, film still, depth of field, 35mm",
  digital: "digital art, concept art, trending on artstation, intricate details, vibrant",
};

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { prompt, style } = (await request.json()) as {
            prompt?: string;
            style?: string;
          };
          if (!prompt || typeof prompt !== "string" || prompt.length > 2000) {
            return new Response(JSON.stringify({ error: "Invalid prompt" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const preset = STYLE_PRESETS[style ?? "realistic"] ?? STYLE_PRESETS.realistic;
          const fullPrompt = `${prompt}, ${preset}`;

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            return new Response(JSON.stringify({ error: "Server not configured" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash-image",
              messages: [{ role: "user", content: fullPrompt }],
              modalities: ["image", "text"],
            }),
          });

          if (!res.ok) {
            const text = await res.text();
            return new Response(
              JSON.stringify({ error: `Gateway error (${res.status}): ${text.slice(0, 200)}` }),
              { status: res.status, headers: { "Content-Type": "application/json" } },
            );
          }

          const data = await res.json();
          const imageUrl: string | undefined =
            data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

          if (!imageUrl) {
            return new Response(JSON.stringify({ error: "No image returned" }), {
              status: 502,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ image: imageUrl }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});