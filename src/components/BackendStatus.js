import { useEffect, useState } from 'react';
import { checkHealth } from './HealthApi';
import './BackendStatus.css';

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 15;

function BackendStatus() {
	const [showUnavailable, setShowUnavailable] = useState(false);
	const [retrying, setRetrying] = useState(false);

	useEffect(() => {
		let cancelled = false;
		let attempts = 0;
		let timeoutId;

		async function attempt() {
			attempts += 1;
			const healthy = await checkHealth();
			if (cancelled) return;

			if (healthy) {
				setShowUnavailable(false);
				setRetrying(false);
				return;
			}

			setShowUnavailable(true);

			if (attempts >= MAX_ATTEMPTS) {
				setRetrying(false);
				return;
			}

			setRetrying(true);
			timeoutId = setTimeout(attempt, POLL_INTERVAL_MS);
		}

		attempt();

		return () => {
			cancelled = true;
			clearTimeout(timeoutId);
		};
	}, []);

	if (!showUnavailable) return null;

	return (
		<div className="backend-status" role="status">
			{retrying ? 'Backend is not ready. Retrying…' : 'Backend is not ready.'}
		</div>
	);
}

export default BackendStatus;
