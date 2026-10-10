import { fileURLToPath } from "node:url";

process.env.DOTENV_CONFIG_PATH = fileURLToPath(new URL("../.env", import.meta.url));
await import("dotenv/config");

const [{ createApp }, { getBackendPort }] = await Promise.all([
  import("./app.js"),
  import("./config.js"),
]);

const port = getBackendPort();
const app = createApp();
const geminiApiKeyConfigured = Boolean(
  process.env.GEMINI_API_KEY?.trim() &&
  process.env.GEMINI_API_KEY.trim() !== "your_gemini_api_key_here",
);

const server = app.listen(port, () => {
  console.log(`Zenvora AI API listening on http://localhost:${port}`);
  console.log(`Backend working directory: ${process.cwd()}`);
  console.log(`GEMINI_API_KEY configured: ${geminiApiKeyConfigured ? "yes" : "no"}`);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Zenvora AI API could not start because port ${port} is already in use. ` +
      "Check whether another Zenvora backend is running before starting a second one.",
    );
  } else {
    console.error("Zenvora AI API failed to start.", error);
  }
  process.exitCode = 1;
});
