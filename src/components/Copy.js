import { useState } from 'react';
import './Copy.css';

function CopyIcon() {
  return (
    <svg className="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="copy-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function Copy({ copyText = null }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    navigator.clipboard.writeText(copyText ?? window.location.href);
  };

  return (
    <button
      type="button"
      title={copied ? 'Copied!' : 'Copy'}
      onClick={handleCopy}
      className={`copy-btn${copied ? ' copy-btn--copied' : ''}`}
    >
      {copied ? (
        <>
          <CheckIcon />
          <span className="copy-toast">Copied!</span>
        </>
      ) : (
        <CopyIcon />
      )}
    </button>
  );
}
