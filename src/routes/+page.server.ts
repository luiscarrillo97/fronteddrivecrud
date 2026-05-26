import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		// Tu API de Cloud Run
		const response = await fetch('https://drivecrud-git-269414280318.europe-west1.run.app/');
		const mensaje = await response.text();

		return {
			mensajeBackend: mensaje
		};
	} catch (error) {
		console.error('Error conectando con la API:', error);
		return {
			mensajeBackend: 'No se pudo conectar con Cloud Run 😢'
		};
	}
};
