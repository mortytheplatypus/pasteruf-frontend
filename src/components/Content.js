import { useEffect, useState } from 'react';
import './Content.css';

const BASE_URL = process.env.REACT_APP_BASE_URL ?? 'http://localhost:5000/api';
const AUTH_USERNAME = process.env.REACT_APP_AUTH_USERNAME ?? '';
const AUTH_PASSWORD = process.env.REACT_APP_AUTH_PASSWORD ?? '';

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes
const CACHE_KEY = 'pasteruf_cache';

function Content({ shortcode: propShortcode }) {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
    const [content, setContent] = useState(null);

	const shortcode = propShortcode || (window.location.pathname || '').replace(/^\//, '');

	useEffect(() => {
		if (!shortcode) {
			setError('No shortcode provided');
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
					const cached = cache[shortcode];
					
					if (cached && now - cached.timestamp < CACHE_DURATION) {
						if (cached.type === 'url') {
							window.location.href = cached.content;
							return;
						}
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
				const response = await fetch(`${BASE_URL}/${encodeURIComponent(shortcode)}`, {
					method: 'GET',
					credentials: 'include',
					headers: { 
						'Authorization': 'Basic ' + btoa(`${AUTH_USERNAME}:${AUTH_PASSWORD}`)
					},
				});

				if (cancelled) return;

				if (response.ok) {
					const data = await response.json();
					
					if (data.type === 'url') {
						// Store in cache
						const existingCache = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}');
						existingCache[shortcode] = {
							type: 'url',
							content: data.content,
							timestamp: now
						};
						localStorage.setItem(CACHE_KEY, JSON.stringify(existingCache));
						
						// Redirect
						window.location.href = data.content;
					} else {
						// Text content
						setContent(data.content);
						
						// Store in cache
						const existingCache = JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}');
						existingCache[shortcode] = {
							type: 'text',
							content: data.content,
							timestamp: now
						};
						localStorage.setItem(CACHE_KEY, JSON.stringify(existingCache));
					}
				} else {
					const text = await response.text();
					let errorMessage = `HTTP ${response.status}`;
					
					try {
						const parsed = JSON.parse(text);
						errorMessage = parsed.error || parsed.message || errorMessage;
					} catch {
						errorMessage = text || errorMessage;
					}
					
					setError(errorMessage);
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
	}, [shortcode]);

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