import type { RequestHandler } from '@sveltejs/kit';

const API_URL = 'https://drivecrud-269414280318.europe-west1.run.app';

export const GET: RequestHandler = async ({ params, fetch }) => {
	const id = params.id;

	if (!id) {
		return new Response('ID requerido', { status: 400 });
	}

	const response = await fetch(`${API_URL}/files/${id}/stream`);

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
