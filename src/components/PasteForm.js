import { useState } from "react";
import "./PasteForm.css";
import { createPaste } from "./PasteApi";
import Copy from "./Copy";

const MAX_CONTENT_BYTES = 512 * 1024; // 512 kB

const DAYS = "days";
const HOURS = "hours";
const MINUTES = "minutes";

const DEFAULT_EXPIRATION_MINUTES = 60; // 1 hour

const MAX_EXPIRATION_DAYS = 30;
const MAX_EXPIRATION_HOURS = MAX_EXPIRATION_DAYS * 24;
const MAX_EXPIRATION_MINUTES = MAX_EXPIRATION_HOURS * 60;

const UNIT_MULTIPLIER = {
  minutes: 1,
  hours: 60,
  days: 60 * 24,
};

function LinkIcon() {
  return (
    <svg
      className="form-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      className="form-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      className="form-icon form-icon--btn"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      className="dismiss-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function PasteForm() {
  const [text, setText] = useState("");
  const [isUrl, setIsUrl] = useState(false);
  const [banner, setBanner] = useState({
    type: "",
    shortcode: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [expirationValue, setExpirationValue] = useState(
    DEFAULT_EXPIRATION_MINUTES,
  );
  const [expirationUnit, setExpirationUnit] = useState(MINUTES);
  const [errors, setErrors] = useState({ expiration: "" });

  const validateContentLength = (content) => {
    if (content.trim() === "") return "Paste something first";

    const encoder = new TextEncoder();
    const byteLength = encoder.encode(content).length;
    if (byteLength > MAX_CONTENT_BYTES) {
      return `Content size ${byteLength} bytes cannot exceed maximum ${MAX_CONTENT_BYTES} bytes`;
    }

    return "";
  };

  const validateExpiration = (value, unit = MINUTES) => {
    if (value === "" || value === null) return "Expiration is required";

    const n = Number(value);

    if (!Number.isFinite(n) || isNaN(n)) return "Expiration must be a number";
    if (!Number.isInteger(n)) return "Expiration must be an integer";
    if (n <= 0) return "Expiration must be positive";

    if (unit === DAYS && n > MAX_EXPIRATION_DAYS)
      return `Max expiration is ${MAX_EXPIRATION_DAYS} days`;
    else if (unit === HOURS && n > MAX_EXPIRATION_HOURS)
      return `Max expiration is ${MAX_EXPIRATION_HOURS} hours`;
    else if (unit === MINUTES && n > MAX_EXPIRATION_MINUTES)
      return `Max expiration is ${MAX_EXPIRATION_MINUTES} minutes`;

    return "";
  };

  const handleExpirationChange = (e) => {
    const raw = e.target.value;
    if (raw === "") {
      setExpirationValue("");
      setErrors((prev) => ({ ...prev, expiration: "Expiration is required" }));
      return;
    }

    let num = Number(raw);
    let clampWarning = "";

    if (expirationUnit === DAYS && num > MAX_EXPIRATION_DAYS) {
      num = MAX_EXPIRATION_DAYS;
      clampWarning = `Max expiration is ${MAX_EXPIRATION_DAYS} days`;
    }

    setExpirationValue(num);
    setErrors((prev) => ({
      ...prev,
      expiration: clampWarning || validateExpiration(num, expirationUnit),
    }));
  };

  const handleUnitChange = (e) => {
    const unit = e.target.value;
    let num = expirationValue;
    let clampWarning = "";

    if (unit === DAYS && Number(num) > MAX_EXPIRATION_DAYS) {
      num = MAX_EXPIRATION_DAYS;
      clampWarning = `Max expiration is ${MAX_EXPIRATION_DAYS} days`;
    }

    setExpirationUnit(unit);
    if (num !== expirationValue) setExpirationValue(num);
    setErrors((prev) => ({
      ...prev,
      expiration: clampWarning || validateExpiration(num, unit),
    }));
  };

  const handleNewPaste = () => {
    setText("");
    setIsUrl(false);
    setExpirationValue(DEFAULT_EXPIRATION_MINUTES);
    setExpirationUnit(MINUTES);
    setErrors({ expiration: "" });
    setBanner({ type: "", shortcode: "", message: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const contentError = validateContentLength(text);
    const expirationError = validateExpiration(expirationValue, expirationUnit);

    setErrors({ expiration: expirationError });

    if (contentError || expirationError) return;

    setBanner({ type: "", shortcode: "", message: "" });

    setLoading(true);

    const payload = {
      content: text,
      is_url: isUrl,
      expiration:
        Number(expirationValue) * (UNIT_MULTIPLIER[expirationUnit] || 1),
    };

    try {
      const response = await createPaste(payload);

      const shortcode = response?.shortcode ?? null;

      if (shortcode) {
        setBanner({ type: "success", shortcode, message: "" });
        setErrors({ expiration: "" });
      } else {
        setBanner({
          type: "error",
          shortcode: "",
          message: "Couldn't reach the server. Try again?",
        });
      }
    } catch (err) {
      console.error("Create paste failed", err);
      setBanner({
        type: "error",
        shortcode: "",
        message: "Couldn't reach the server. Try again?",
      });
    } finally {
      setLoading(false);
    }
  };

  const unitMax = Math.floor(
    MAX_EXPIRATION_MINUTES / (UNIT_MULTIPLIER[expirationUnit] || 1),
  );

  const contentError = validateContentLength(text);
  const checkSubmitDisabled =
    validateExpiration(expirationValue, expirationUnit) !== "" ||
    contentError !== "";

  return (
    <form className="paste-form" onSubmit={handleSubmit}>
      <label className="paste-box-label">
        <textarea
          className="paste-box"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your text or URL here..."
          rows={10}
          disabled={loading}
        />
      </label>

      <div className="form-toolbar">
        <div className="form-options">
          <label className="url-checkbox">
            <input
              type="checkbox"
              checked={isUrl}
              onChange={(e) => setIsUrl(e.target.checked)}
              disabled={loading}
            />
            <LinkIcon />
            <span>Is URL?</span>
          </label>

          <label className="expiration-input">
            <ClockIcon />
            <span className="expiration-label">Expires in</span>
            <input
              className="expiration-number"
              type="number"
              min={1}
              max={unitMax}
              value={expirationValue}
              onChange={handleExpirationChange}
              disabled={loading}
            />
            <select
              disabled={loading}
              className="expiration-unit"
              value={expirationUnit}
              onChange={handleUnitChange}
            >
              <option value={MINUTES}>Minutes</option>
              <option value={HOURS}>Hours</option>
              <option value={DAYS}>Days</option>
            </select>
          </label>
        </div>

        <div className="submit-btn-wrapper">
          {contentError && (
            <span className="submit-btn-tooltip" role="tooltip">
              {contentError}
            </span>
          )}
          <button
            disabled={checkSubmitDisabled || loading}
            type="submit"
            className="submit-btn"
          >
            <SendIcon />
            <span>{loading ? "Submitting…" : "Submit"}</span>
          </button>
        </div>
      </div>

      {errors.expiration && (
        <div className="error-messages">
          <div className="error-message">{errors.expiration}</div>
        </div>
      )}

      {banner.type === "success" && (
        <div className="card success-card">
          <div className="card-body">
            <h3>Here you go</h3>
            {banner.shortcode && (
              <p className="shortlink-row">
                <span className="shortlink-label">Your link</span>
                <a
                  className="shortlink-url"
                  href={`${window.location.origin}/${banner.shortcode}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {`${window.location.origin}/${banner.shortcode}`}
                </a>
              </p>
            )}
          </div>
          <div className="card-actions">
            <Copy copyText={`${window.location.origin}/${banner.shortcode}`} />
            <button
              type="button"
              className="new-paste-button"
              onClick={handleNewPaste}
            >
              + New Paste
            </button>
            <button
              type="button"
              className="button-dismiss"
              aria-label="Dismiss"
              onClick={() =>
                setBanner({ type: "", shortcode: "", message: "" })
              }
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      )}

      {banner.type === "error" && (
        <div className="card failure-card">
          <div className="card-body">
            <h3>That didn't work</h3>
            <p>{banner.message || "Mind giving it another shot?"}</p>
          </div>
          <div className="card-actions">
            <button
              type="button"
              className="button-dismiss"
              aria-label="Dismiss"
              onClick={() =>
                setBanner({ type: "", shortcode: "", message: "" })
              }
            >
              <CloseIcon />
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

export default PasteForm;
