const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:5000/api';
const HEALTH_TIMEOUT_MS = 5000;

async function checkHealth() {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

	try {
		const response = await fetch(`${API_BASE_URL}/health`, {
			method: 'GET',
			headers: { Accept: 'application/json' },
			signal: controller.signal,
		});

		if (!response.ok) return false;

		const data = await response.json();
		return data?.status === 'healthy';
	} catch {
		return false;
	} finally {
		clearTimeout(timeoutId);
	}
}

export { checkHealth };
