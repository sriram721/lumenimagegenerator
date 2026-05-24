import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  // The whole app is a single self-contained HTML file in /public.
  return (
    <iframe
      src="/ai-generator.html"
      title="Lumen AI Image Generator"
      style={{ border: 0, width: "100vw", height: "100vh", display: "block" }}
    />
  );
}
