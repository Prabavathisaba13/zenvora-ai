import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const backendEnvPath = fileURLToPath(new URL("../.env", import.meta.url));
export const DEFAULT_BACKEND_PORT = 3002;

function readConfiguredPort() {
  try {
    return dotenv.parse(readFileSync(backendEnvPath, "utf8")).PORT;
  } catch (error) {
    if (error.code === "ENOENT") return undefined;
    throw error;
  }
}

export function getBackendPort(environment = process.env) {
  const rawPort = environment.PORT || readConfiguredPort() || DEFAULT_BACKEND_PORT;
  const port = Number(rawPort);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  return port;
}
