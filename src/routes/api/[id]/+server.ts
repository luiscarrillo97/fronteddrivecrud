import type { RequestHandler } from '@sveltejs/kit';

const API_URL = 'https://drivecrud-269414280318.europe-west1.run.app';

export const GET: RequestHandler = async ({ params, fetch, cookies }) => {
	const id = params.id;
	const token = cookies.get('token');

	if (!token) {
		return new Response('No autorizado. Falta el token.', { status: 401 });
	}

	if (!id) {
		return new Response('ID requerido', { status: 400 });
	}

	const response = await fetch(`${API_URL}/files/${id}/stream`, {
		headers: {
			Authorization: `Bearer ${token}`
		}
	});

	if (!response.ok) {
		return new Response('No se pudo obtener el archivo', { status: response.status });
	}

	return new Response(response.body, {
		headers: {
			'Content-Type': 'application/pdf',
			'Cache-Control': 'private, max-age=300'
		}
	});
};
