import { useState } from 'react';
import './PasteForm.css';
import { createPaste } from './PasteApi';

const MAX_CONTENT_BYTES = 512 * 1024; // 512 kB

const DAYS = 'days';
const HOURS = 'hours';
const MINUTES = 'minutes';

const DEFAULT_EXPIRATION_MINUTES = 60; // 1 hour

const MAX_EXPIRATION_DAYS = 30;
const MAX_EXPIRATION_HOURS = MAX_EXPIRATION_DAYS * 24; 
const MAX_EXPIRATION_MINUTES = MAX_EXPIRATION_HOURS * 60;

const  UNIT_MULTIPLIER = { 
  minutes: 1, 
  hours: 60, 
  days: 60 * 24
};

function PasteForm() {
  const [text, setText] = useState('');
  const [isUrl, setIsUrl] = useState(false);
  const [banner, setBanner] = useState({ type: '', shortcode: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [expirationValue, setExpirationValue] = useState(DEFAULT_EXPIRATION_MINUTES);
  const [expirationUnit, setExpirationUnit] = useState(MINUTES);
  const [errors, setErrors] = useState({ content: '', expiration: '' });

  

  const validateContentLength = (content) => {
    if (content.trim() === '') return 'Content cannot be empty';

    const encoder = new TextEncoder();
    const byteLength = encoder.encode(content).length;
    if (byteLength > MAX_CONTENT_BYTES) {
      return `Content size ${byteLength} bytes cannot exceed maximum ${MAX_CONTENT_BYTES} bytes`;
    }

    return '';
  };

  const validateExpiration = (value, unit = MINUTES) => {
    if (value === '' || value === null) return 'Expiration is required';

    const n = Number(value);
  
    if (!Number.isFinite(n) || isNaN(n)) return 'Expiration must be a number';
    if (!Number.isInteger(n)) return 'Expiration must be an integer';
    if (n <= 0) return 'Expiration must be positive';

    if (unit === DAYS && n > MAX_EXPIRATION_DAYS) return `Max expiration is ${MAX_EXPIRATION_DAYS} days`;
    else if (unit === HOURS && n > MAX_EXPIRATION_HOURS) return `Max expiration is ${MAX_EXPIRATION_HOURS} hours`;
    else if (unit === MINUTES && n > MAX_EXPIRATION_MINUTES) return `Max expiration is ${MAX_EXPIRATION_MINUTES} minutes`;

    return '';
  };

  const handleExpirationChange = (e) => {
    const val = e.target.value;
    setExpirationValue(val === '' ? '' : Number(val));
    setErrors((prev) => ({ ...prev, expiration: validateExpiration(val, expirationUnit) }));
  };

  const handleUnitChange = (e) => {
    const unit = e.target.value;
    setExpirationUnit(unit);
    setErrors((prev) => ({ ...prev, expiration: validateExpiration(expirationValue, unit) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const contentError = validateContentLength(text);
    const expirationError = validateExpiration(expirationValue, expirationUnit);

    setErrors({ content: contentError, expiration: expirationError });

    if (contentError || expirationError) return;

    setBanner({ type: '', shortcode: '', message: '' });

    setLoading(true);

    const payload = {
      content: text,
      is_url: isUrl,
      expiration: Number(expirationValue) * (UNIT_MULTIPLIER[expirationUnit] || 1),
    };

    try {
      const response = await createPaste(payload);

      const shortcode = response?.shortcode ?? null;

      if (shortcode) {
        setBanner({ type: 'success', shortcode, message: '' });

        // Reset form to defaults on success
        setText('');
        setIsUrl(false);
        setExpirationValue(DEFAULT_EXPIRATION_MINUTES);
        setExpirationUnit(MINUTES);
        setErrors({ content: '', expiration: '' });
      } else {
        setBanner({ type: 'error', shortcode: '', message: 'Service currently unavailable' });
      }
    } catch (err) {
      console.error('Create paste failed', err);
      setBanner({ type: 'error', shortcode: '', message: 'Service currently unavailable' });
    } finally {
      setLoading(false);
    }
  };

  const unitMax = Math.floor(MAX_EXPIRATION_MINUTES / (UNIT_MULTIPLIER[expirationUnit] || 1));

  const checkSubmitDisabled = validateExpiration(expirationValue, expirationUnit) !== '' || validateContentLength(text) !== '';

  return (
    <form className="paste-form" onSubmit={handleSubmit}>
      <label>
        <textarea
          className="paste-box"
          value={text}
          onChange={(e) => {
            const v = e.target.value;
            setText(v);
            setErrors((prev) => ({ ...prev, content: validateContentLength(v) }));
          }}
          placeholder="Paste your text or URL here..."
          rows={10}
          disabled={loading}
        />
      </label>

      <label className="url-checkbox">
        <input
          type="checkbox"
          checked={isUrl}
          onChange={(e) => setIsUrl(e.target.checked)}
          disabled={loading}
        />
        Is URL?
      </label>

      <label className="expiration-input">
        <span className="expiration-label">Expiration: </span>
        <input
          className="expiration-number"
          type="number"
          min={1}
          max={unitMax}
          value={expirationValue}
          onChange={handleExpirationChange}
          disabled={loading}
        />

        <select disabled={loading} className="expiration-unit" value={expirationUnit} onChange={handleUnitChange}>
          <option value={MINUTES}>Minutes</option>
          <option value={HOURS}>Hours</option>
          <option value={DAYS}>Days</option>
        </select>
      </label>

      <button disabled={checkSubmitDisabled || loading} type="submit" className="submit-btn">Submit</button>

      {errors.content && <div className="error-message">{errors.content}</div>}

      {errors.expiration && <div className="error-message">{errors.expiration}</div>}

      {loading && (
        <div className="loader">Submitting…</div>
      )}

      {banner.type === 'success' && (
        <div className="card success-card">
          <div className="card-body">
            <h3>Success!</h3>
            {banner.shortcode && (
              <p>Shortlink: <a href={`${window.location.origin}/${banner.shortcode}`} target="_blank" rel="noreferrer">{`${window.location.origin}/${banner.shortcode}`}</a></p>
            )}
          </div>
          <div className="card-actions">
            <button onClick={() => setBanner({ type: '', shortcode: '', message: '' })}>Dismiss</button>
          </div>
        </div>
      )}

      {banner.type === 'error' && (
        <div className="card error-card">
          <div className="card-body">
            <h3>Apologies!</h3>
            <p>{banner.message ?? 'Service currently unavailable'}</p>
          </div>
          <div className="card-actions">
            <button onClick={() => setBanner({ type: '', shortcode: '', message: '' })}>Dismiss</button>
          </div>
        </div>
      )}
    </form>
  );
}

export default PasteForm;
