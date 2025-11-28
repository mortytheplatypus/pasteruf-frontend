import { useEffect, useState } from 'react';
import './Content.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:5000/api';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const CACHE_KEY = 'pastebin_cache';

function Content({ shortlink: propShortlink }) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
    const [content, setContent] = useState(null);

	const shortlink = propShortlink || (window.location.pathname || '').replace(/^\//, '');

	useEffect(() => {
		if (!shortlink) {
			setError('No shortlink provided');
			setLoading(false);
			return;
		}

		let cancelled = false;

		async function fetchPaste() {
			// Check localStorage cache
			const now = Date.now();
			const cacheData = localStorage.getItem(CACHE_KEY);
			
			if (cacheData) {
				try {
					const cache = JSON.parse(cacheData);
					const cached = cache[shortlink];
					
					if (cached && now - cached.timestamp < CACHE_DURATION) {
						setContent(cached.content);
						setError(null);
						setLoading(false);
						return;
					}
				} catch (e) {
					// Invalid cache, continue to fetch
				}
			}

			// Fetch from backend
			setLoading(true);
			setError(null);
            setContent(null);

			try {
				const response = await fetch(`${API_BASE_URL}/pastes/${encodeURIComponent(shortlink)}`, {
					method: 'GET',
					headers: { Accept: 'application/json, text/plain, */*' },
				});

				const text = await response.text();
				let parsed = null;
				try {
					parsed = text ? JSON.parse(text) : null;
				} catch (err) {
					parsed = text;
				}

				if (cancelled) return;

				if (response.ok) {
					const pasteContent = parsed?.content ?? null;
                    setContent(pasteContent);
					
					// Store in localStorage
					const existingCache = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}');
					existingCache[shortlink] = {
						content: pasteContent,
						timestamp: now
					};
					localStorage.setItem(CACHE_KEY, JSON.stringify(existingCache));
				} else {
					const message = (parsed?.message || parsed?.error) ?? parsed ?? `HTTP ${response.status}`;
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