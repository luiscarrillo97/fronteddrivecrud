import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();
		const file = formData.get('pdfFile') as File;

		// Validación rápida en servidor frontend
		if (!file || file.size === 0) {
			return fail(400, { error: 'No se cargó ningún archivo válido.' });
		}

		try {
			// Preparamos el payload exacto que espera tu endpoint de .NET Core (IFormFile)
			const apiFormData = new FormData();
			apiFormData.append('file', file);

			// Reemplaza esto con tu URL de Cloud Run (ej: https://drivecrud-...)
			const URL_API_CLOUD_RUN = 'https://TU-URL-DE-CLOUD-RUN.run.app/api/upload-pdf';

			// Enviamos el binario de servidor a servidor
			const response = await fetch(URL_API_CLOUD_RUN, {
				method: 'POST',
				body: apiFormData
				// Nota: No se agrega Header de Content-Type manual, el fetch lo asigna con el boundary del archivo de forma automática
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return fail(response.status, {
					error: errorData.message || 'Error en la respuesta de la API de Cloud Run.'
				});
			}

			const result = await response.json();

			// Retornamos los datos al componente .svelte de manera limpia
			return {
				success: true,
				link: result.link // Link público del archivo devuelto por .NET
			};
		} catch (err: unknown) {
			return fail(500, { error: `No se pudo conectar con el servidor API: ${err.message}` });
		}
	}
};
