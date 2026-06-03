import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

const API_URL = 'https://drivecrud-269414280318.europe-west1.run.app';

// ======================================================
// LOAD — lista archivos al cargar la página
// ======================================================
export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const response = await fetch(`${API_URL}/files`);
		if (!response.ok) return { files: [], error: 'No se pudo cargar la lista de archivos.' };
		const files = await response.json();
		return { files };
	} catch {
		return { files: [], error: 'Error de conexión al cargar archivos.' };
	}
};

export const actions: Actions = {
	// ======================================================
	// SUBIR archivo nuevo
	// ======================================================
	upload: async ({ request, fetch }) => {
		const formData = await request.formData();
		const file = formData.get('file');

		if (!(file instanceof File))
			return fail(400, {
				action: 'upload',
				success: false,
				error: 'Debe seleccionar un archivo PDF.'
			});
		if (file.size === 0)
			return fail(400, { action: 'upload', success: false, error: 'El archivo está vacío.' });
		if (!file.name.toLowerCase().endsWith('.pdf'))
			return fail(400, {
				action: 'upload',
				success: false,
				error: 'Solo se permiten archivos PDF.'
			});

		try {
			const apiFormData = new FormData();
			apiFormData.append('file', file);

			const response = await fetch(`${API_URL}/upload`, { method: 'POST', body: apiFormData });

			if (!response.ok) {
				let msg = `Error ${response.status}`;
				try {
					const j = await response.json();
					msg = j.error || j.detail || msg;
				} catch {
					/* ignorar */
				}
				return fail(response.status, { action: 'upload', success: false, error: msg });
			}

			const result = await response.json();
			return {
				action: 'upload',
				success: true,
				fileId: result.fileId,
				fileName: result.fileName,
				link: result.link,
				size: result.size,
				createdAt: result.createdAt
			};
		} catch (error) {
			return fail(500, {
				action: 'upload',
				success: false,
				error: error instanceof Error ? error.message : 'Error de conexión'
			});
		}
	},

	// ======================================================
	// VER PDF — proxy seguro, el usuario nunca ve el ID ni
	// el link de Drive. El PDF llega como base64 al frontend.
	// ======================================================
	// ======================================================
	// VER PDF — ahora solo valida el ID y lo devuelve
	// El streaming real lo hace /api/pdf/[id]/+server.ts
	// ======================================================
	view: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		if (typeof id !== 'string' || !id)
			return fail(400, { action: 'view', success: false, error: 'ID requerido.' });

		// Ya no hacemos fetch aquí, solo devolvemos el ID
		return { action: 'view', success: true, fileId: id };
	},
	// ======================================================
	// REEMPLAZAR archivo existente
	// ======================================================
	replace: async ({ request, fetch }) => {
		const formData = await request.formData();
		const file = formData.get('file');
		const id = formData.get('id');

		if (typeof id !== 'string' || !id)
			return fail(400, { action: 'replace', success: false, error: 'ID de archivo requerido.' });
		if (!(file instanceof File))
			return fail(400, {
				action: 'replace',
				success: false,
				error: 'Debe seleccionar un archivo PDF.'
			});
		if (file.size === 0)
			return fail(400, { action: 'replace', success: false, error: 'El archivo está vacío.' });
		if (!file.name.toLowerCase().endsWith('.pdf'))
			return fail(400, {
				action: 'replace',
				success: false,
				error: 'Solo se permiten archivos PDF.'
			});

		try {
			const apiFormData = new FormData();
			apiFormData.append('file', file);

			const response = await fetch(`${API_URL}/files/${id}`, { method: 'PUT', body: apiFormData });

			if (!response.ok) {
				let msg = `Error ${response.status}`;
				try {
					const j = await response.json();
					msg = j.error || j.detail || msg;
				} catch {
					/* ignorar */
				}
				return fail(response.status, { action: 'replace', success: false, error: msg });
			}

			const result = await response.json();
			return {
				action: 'replace',
				success: true,
				fileId: result.Id,
				fileName: result.Name,
				link: result.WebViewLink
			};
		} catch (error) {
			return fail(500, {
				action: 'replace',
				success: false,
				error: error instanceof Error ? error.message : 'Error de conexión'
			});
		}
	},

	// ======================================================
	// ELIMINAR archivo
	// ======================================================
	delete: async ({ request, fetch }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		if (typeof id !== 'string' || !id)
			return fail(400, { action: 'delete', success: false, error: 'ID de archivo requerido.' });

		try {
			const response = await fetch(`${API_URL}/files/${id}`, { method: 'DELETE' });

			if (!response.ok) {
				let msg = `Error ${response.status}`;
				try {
					const j = await response.json();
					msg = j.error || j.detail || msg;
				} catch {
					/* ignorar */
				}
				return fail(response.status, { action: 'delete', success: false, error: msg });
			}

			return { action: 'delete', success: true, deletedId: id };
		} catch (error) {
			return fail(500, {
				action: 'delete',
				success: false,
				error: error instanceof Error ? error.message : 'Error de conexión'
			});
		}
	}
};
