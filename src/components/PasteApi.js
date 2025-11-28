// Exports: createPaste({ content, is_url }) -> Promise<responseJson>

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:5000/api';
const AUTH_USERNAME = process.env.REACT_APP_AUTH_USERNAME ?? '';
const AUTH_PASSWORD = process.env.REACT_APP_AUTH_PASSWORD ?? '';

async function createPaste({ content, is_url, expiration } = {}) {

	const body = { is_url, content, expiration_in_minutes: expiration };

	const response = await fetch(`${API_BASE_URL}/pastes`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'Accept': 'application/json',
			'Authorization': 'Basic ' + btoa(`${AUTH_USERNAME}:${AUTH_PASSWORD}`)
		},
		body: JSON.stringify(body),
	});

	// parse response body
	const text = await response.text();
	let parsed = null;
	try {
		parsed = text ? JSON.parse(text) : null;
	} catch (err) {
		parsed = text;
	}

	// success expected to be 201 Created
	if (response.status === 201) {
		const shortlink = parsed?.shortlink ?? null;
		return {
			success: true,
			message: 'Created',
			shortlink,
		};
	}

	// non-success: normalize message
	const message = (parsed?.message || parsed?.error) ?? parsed ?? `HTTP ${response.status}`;
	return {
		success: false,
		message,
	};
}

export { createPaste };
