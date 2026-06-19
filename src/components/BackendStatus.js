import { useEffect, useState } from 'react';
import { checkHealth } from './HealthApi';
import './BackendStatus.css';

function BackendStatus() {
	const [connected, setConnected] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function attempt() {
			while (!cancelled) {
				const healthy = await checkHealth();
				if (cancelled) return;

				if (healthy) {
					setConnected(true);
					return;
				}

				setConnected(false);
			}
		}

		attempt();

		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<div className={`api-status${connected ? ' api-status--connected' : ' api-status--connecting'}`} role="status">
			<span className="api-status-dot" aria-hidden="true" />
			<span className="api-status-label">
				{connected ? "Connected" : 'Connecting...'}
			</span>
		</div>
	);
}

export default BackendStatus;
