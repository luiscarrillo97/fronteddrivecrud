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
			const URL_API_CLOUD_RUN = 'https://drivecrud-269414280318.europe-west1.run.app';

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
		} catch (error: unknown) {
			// Verificamos si el error tiene un mensaje de texto seguro
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

			return {
				success: false,
				error: errorMessage
			};
		}
	}
};
