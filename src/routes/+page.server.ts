import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();
		const file = formData.get('pdfFile') as File;

		// Validación rápida en el servidor de SvelteKit
		if (!file || file.size === 0) {
			return fail(400, { error: 'No se cargó ningún archivo válido.' });
		}

		try {
			// 1. Preparamos el payload con la clave exacta que espera .NET Core ("pdfFile")
			const apiFormData = new FormData();
			apiFormData.append('pdfFile', file); // Corregido: 'file' cambiado a 'pdfFile'

			const URL_API_CLOUD_RUN =
				'https://drivecrud-269414280318.europe-west1.run.app/api/upload-pdf';

			// 2. Enviamos el binario correcto (apiFormData) de servidor a servidor
			const response = await fetch(URL_API_CLOUD_RUN, {
				method: 'POST',
				body: apiFormData // Corregido: Enviamos el contenedor con la clave mapeada
			});

			if (!response.ok) {
				let errorMessage = `Error de la API (${response.status})`;
				try {
					// Si el backend responde con un RFC 7807 (ProblemDetails), leemos el "detail" o el "error"
					const errorJson = await response.json();
					errorMessage = errorJson.detail || errorJson.error || errorMessage;
				} catch {
					// Si no es un JSON, caemos en leer el texto plano
					const errorText = await response.text();
					if (errorText) errorMessage = errorText;
				}

				console.error('Error detallado del backend:', errorMessage);

				return fail(response.status, {
					success: false,
					error: errorMessage
				});
			}

			const result = await response.json();

			// 3. Retornamos los datos al componente +page.svelte de manera limpia
			return {
				success: true,
				link: result.link // Link público devuelto por la API de .NET
			};
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Error desconocido de conexión';
			console.error('Error de conexión con Cloud Run:', errorMessage);

			return fail(500, {
				success: false,
				error: `No se pudo conectar con el servidor de subidas: ${errorMessage}`
			});
		}
	}
};
