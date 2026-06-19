const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:5000/api';

async function checkHealth() {
	try {
		const response = await fetch(`${API_BASE_URL}/health`, {
			method: 'GET',
			headers: { 'Accept': 'application/json' },
		});

		if (!response.ok) return false;

		const data = await response.json();
		return data?.status === 'healthy';
	} catch {
		return false;
	}
}

export { checkHealth };
