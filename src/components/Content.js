import { useEffect, useState } from 'react';
import './Content.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:5000/api';

function Content({ shortlink: propShortlink }) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
    const [content, setContent] = useState(null);

	// determine shortlink from prop or location
	const shortlink = propShortlink || (window.location.pathname || '').replace(/^\//, '');

	useEffect(() => {
		if (!shortlink) {
			setError('No shortlink provided');
			setLoading(false);
			return;
		}

		let cancelled = false;

		async function fetchPaste() {
			setLoading(true);
			setError(null);
            setContent(null);

			try {
				const res = await fetch(`${API_BASE_URL}/pastes/${encodeURIComponent(shortlink)}`, {
					method: 'GET',
					headers: { Accept: 'application/json, text/plain, */*' },
				});

				const text = await res.text();
				let parsed = null;
				try {
					parsed = text ? JSON.parse(text) : null;
				} catch (err) {
					parsed = text;
				}

				if (cancelled) return;

				// prefer parsed when available
				if (res.ok) {
                    setContent(parsed?.content ?? null);
				} else {
					const message = (parsed?.message || parsed?.error) ?? parsed ?? `HTTP ${res.status}`;
					setError(message);
				}
			} catch (err) {
				if (!cancelled) setError(err.message || String(err));
			} finally {
				if (!cancelled) setLoading(false);
			}
		}

		fetchPaste();

		return () => {
			cancelled = true;
		};
	}, [shortlink]);

	function handleCreateNew() {
		window.location.href = '/';
	}

	return (
		<div className='paste-view-container'>

			{loading && 
                <div className='loader-container'>
                    <span className='content-loader'></span>
                    <h3>Fetching your paste, wait a moment...</h3>
                </div>}

			{!loading && error && (
				<div style={{ color: 'var(--danger, #b00020)' }}>
					<strong>Error:</strong> {typeof error === 'string' ? error : JSON.stringify(error)}
				</div>
			)}

			{!loading && !error && (
                <>
                <div className='paste-content'>
                    {content}
                </div>
                <div className='paste-view-footer'>
                <button className='new-paste-button' onClick={handleCreateNew}>
					+ New Paste
				</button>
            </div>
                </>
			)}

            
		</div>
	);
}

export default Content;
