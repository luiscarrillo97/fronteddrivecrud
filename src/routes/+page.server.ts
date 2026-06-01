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
			// Cambia esto en tu +page.server.ts:
			const URL_API_CLOUD_RUN =
				'https://drivecrud-269414280318.europe-west1.run.app/api/upload-pdf';

			// Enviamos el binario de servidor a servidor
			const response = await fetch(URL_API_CLOUD_RUN, {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				// Leemos el texto del error que manda el backend
				const errorText = await response.text();
				console.error('Error detallado del backend:', errorText);

				return {
					success: false,
					error: `Error de la API (${response.status}): ${errorText}`
				};
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
