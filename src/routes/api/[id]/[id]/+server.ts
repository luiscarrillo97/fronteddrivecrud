import type { RequestHandler } from '@sveltejs/kit';

const API_URL = 'https://drivecrud-269414280318.europe-west1.run.app';

// Agregamos 'cookies' a los parámetros desestructurados
export const GET: RequestHandler = async ({ params, fetch, cookies }) => {
	const id = params.id;

	// 1. Leer el token de la sesión del usuario
	const token = cookies.get('token');

	if (!id) {
		return new Response('ID requerido', { status: 400 });
	}

	// 2. Si alguien intenta ver el PDF directamente por URL sin estar logueado, lo bloqueamos
	if (!token) {
		return new Response('No autorizado. Debes iniciar sesión.', { status: 401 });
	}

	// 3. Hacemos la petición al backend enviando la llave (Token)
	const response = await fetch(`${API_URL}/files/${id}/stream`, {
		headers: {
			Authorization: `Bearer ${token}` // ¡Aquí está la magia de seguridad!
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
