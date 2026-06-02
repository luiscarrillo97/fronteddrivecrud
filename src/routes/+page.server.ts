import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

const API_URL = 'https://drivecrud-269414280318.europe-west1.run.app';

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const formData = await request.formData();

		const file = formData.get('file');

		if (!(file instanceof File)) {
			return fail(400, {
				success: false,
				error: 'Debe seleccionar un archivo PDF.'
			});
		}

		if (file.size === 0) {
			return fail(400, {
				success: false,
				error: 'El archivo está vacío.'
			});
		}

		if (!file.name.toLowerCase().endsWith('.pdf')) {
			return fail(400, {
				success: false,
				error: 'Solo se permiten archivos PDF.'
			});
		}

		try {
			const apiFormData = new FormData();

			// IMPORTANTE:
			// Debe llamarse "file" porque así lo espera tu API .NET
			apiFormData.append('file', file);

			const response = await fetch(`${API_URL}/upload`, {
				method: 'POST',
				body: apiFormData
			});

			if (!response.ok) {
				let errorMessage = `Error ${response.status}`;

				try {
					const errorJson = await response.json();

					errorMessage = errorJson.error || errorJson.detail || errorMessage;
				} catch {
					// ignorar
				}

				return fail(response.status, {
					success: false,
					error: errorMessage
				});
			}

			const result = await response.json();

			return {
				success: true,
				fileId: result.fileId,
				fileName: result.fileName,
				link: result.link,
				size: result.size,
				createdAt: result.createdAt
			};
		} catch (error) {
			return fail(500, {
				success: false,
				error: error instanceof Error ? error.message : 'Error de conexión'
			});
		}
	}
};
