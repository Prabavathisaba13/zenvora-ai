import { useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp, Key, WifiOff, X } from "lucide-react";

export function getErrorHeading(error) {
  if (!error) return "Something went wrong";
  if (error.code === "API_KEY_MISSING") return "Zenvora AI needs a Gemini API key";
  if (error.code === "RATE_LIMITED" || error.status === 429) return "Rate limit reached";
  if (error.status === 503) return "Zenvora AI is temporarily unavailable";
  if (error.code === "REQUEST_TOO_LARGE") return "Message exceeds maximum length";
  if (error.code === "NETWORK_ERROR") return "Connection issue";
  if (error.code === "UNSUPPORTED_FILE_TYPE" || error.code === "INVALID_PDF") return "Unsupported file format";
  if (error.code === "UPLOAD_TOO_LARGE" || error.code === "PDF_PAGE_LIMIT") return "PDF file exceeds limits";
  if (error.code === "PDF_NO_TEXT") return "No readable text found";
  if (error.code === "PDF_PARSE_FAILED") return "Could not parse PDF document";
  if (error.code === "UPLOAD_RATE_LIMITED") return "Resume uploads temporarily paused";
  return "Could not generate response";
}

export default function ErrorMessage({ error, onDismiss }) {
  const [showDetails, setShowDetails] = useState(false);

  if (!error) return null;

  const isKeyMissing = error.code === "API_KEY_MISSING";
  const isNetwork = error.code === "NETWORK_ERROR";

  return (
    <div className="error-card" role="alert">
      <span className="error-indicator" aria-hidden="true">
        {isKeyMissing ? (
          <Key size={15} />
        ) : isNetwork ? (
          <WifiOff size={15} />
        ) : (
          <AlertCircle size={15} />
        )}
      </span>

      <div className="error-copy">
        <strong>{getErrorHeading(error)}</strong>
        <p>{error.message || "An unexpected error occurred. Please try again."}</p>

        {isKeyMissing && (
          <div className="error-help-box">
            <span>Add your Gemini API key from Google AI Studio into <code>backend/.env</code>:</span>
            <pre>GEMINI_API_KEY=YOUR_VALID_GEMINI_API_KEY</pre>
            <span>Then restart the backend server.</span>
          </div>
        )}

        <div className="error-details-row">
          <button
            type="button"
            className="error-details-toggle"
            onClick={() => setShowDetails((prev) => !prev)}
            aria-expanded={showDetails}
          >
            {showDetails ? (
              <>
                <span>Hide technical details</span>
                <ChevronUp size={12} />
              </>
            ) : (
              <>
                <span>Show technical details</span>
                <ChevronDown size={12} />
              </>
            )}
          </button>
        </div>

        {showDetails && (
          <div className="error-tech-details">
            <code>Code: {error.code || "REQUEST_FAILED"}</code>
            <code>HTTP Status: {error.status || "—"}</code>
          </div>
        )}
      </div>

      <button
        type="button"
        className="icon-button error-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss error message"
        title="Dismiss"
      >
        <X size={15} />
      </button>
    </div>
  );
}
