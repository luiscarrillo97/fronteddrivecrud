import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

const API_URL = 'https://drivecrud-269414280318.europe-west1.run.app';

// ======================================================
// LOAD — lista archivos al cargar la página
// ======================================================
export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const token = cookies.get('token');
	const role = cookies.get('role');

	if (!token) {
		return { files: [], error: null, loggedIn: false, role: null };
	}

	try {
		const response = await fetch(`${API_URL}/files`, {
			headers: { Authorization: `Bearer ${token}` }
		});
		if (!response.ok) return { files: [], error: 'No se pudo cargar la lista de archivos.' };
		const files = await response.json();
		return { files, loggedIn: true, role: role || null };
	} catch {
		return {
			files: [],
			error: 'Error de conexión al cargar archivos.',
			loggedIn: true,
			role: role || null
		};
	}
};

export const actions: Actions = {
	// ======================================================
	// LOGIN DE USUARIO
	// ======================================================
	login: async ({ request, fetch, cookies }) => {
		const formData = await request.formData();
		const dni = formData.get('dni');
		const contrasena = formData.get('contrasena');

		if (!dni || !contrasena) {
			return fail(400, {
				action: 'login',
				success: false,
				error: 'DNI y contraseña son requeridos.'
			});
		}

		try {
			const response = await fetch(`${API_URL}/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ dni, contrasena })
			});

			const result = await response.json();

			if (!response.ok || !result.success) {
				return fail(response.status || 400, {
					action: 'login',
					success: false,
					error: result.error || 'Credenciales inválidas.'
				});
			}

			// Guardar token en una cookie segura (HttpOnly)
			cookies.set('token', result.token, {
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'strict',
				maxAge: 60 * 60 * 8 // 8 horas, coincidiendo con la API
			});

			// Guardar el rol en una cookie para saber si es ADMIN en la UI
			const userRole = result.usuario?.rol || result.usuario?.Rol || 'USER';
			cookies.set('role', userRole, {
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'strict',
				maxAge: 60 * 60 * 8
			});

			return { action: 'login', success: true, usuario: result.usuario };
		} catch {
			return fail(500, {
				action: 'login',
				success: false,
				error: 'Error al intentar conectar con el servidor.'
			});
		}
	},

	// ======================================================
	// LOGOUT DE USUARIO
	// ======================================================
	logout: async ({ cookies }) => {
		cookies.delete('token', { path: '/' });
		cookies.delete('role', { path: '/' });
		return { action: 'logout', success: true };
	},

	// ======================================================
	// CREAR NUEVO USUARIO (SOLO ADMIN)
	// ======================================================
	createUser: async ({ request, fetch, cookies }) => {
		const token = cookies.get('token');
		if (!token)
			return fail(401, {
				action: 'createUser',
				success: false,
				error: 'No autorizado. Inicia sesión.'
			});

		const formData = await request.formData();
		const dni = formData.get('dni') as string;
		const nombres = formData.get('nombres') as string;
		const contrasena = formData.get('contrasena') as string;
		const rol = formData.get('rol') as string;
		const zona = formData.get('zona') as string;
		const celular = formData.get('celular') as string;

		if (!dni || !contrasena) {
			return fail(400, {
				action: 'createUser',
				success: false,
				error: 'DNI y contraseña son requeridos.'
			});
		}

		try {
			const response = await fetch(`${API_URL}/users`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ dni, nombres, contrasena, rol, zona, celular })
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return fail(response.status, {
					action: 'createUser',
					success: false,
					error: errorData.error || 'Error al crear usuario. Verifica que seas ADMIN.'
				});
			}

			return { action: 'createUser', success: true, message: 'Usuario creado exitosamente.' };
		} catch (error) {
			return fail(500, {
				action: 'createUser',
				success: false,
				error: error instanceof Error ? error.message : 'Error de conexión con la API.'
			});
		}
	},

	// ======================================================
	// RECUPERAR CONTRASEÑA (SOLO ADMIN)
	// ======================================================
	recoverPassword: async ({ request, fetch, cookies }) => {
		const token = cookies.get('token');
		const role = cookies.get('role');

		if (!token || role !== 'ADMIN') {
			return fail(401, {
				action: 'recoverPassword',
				success: false,
				error: 'No autorizado. Solo los administradores pueden realizar esta acción.'
			});
		}

		const formData = await request.formData();
		const dni = formData.get('dni') as string;
		const celular = formData.get('celular') as string;

		if (!dni || !celular) {
			return fail(400, {
				action: 'recoverPassword',
				success: false,
				error: 'El DNI y el celular son requeridos.'
			});
		}

		try {
			const response = await fetch(`${API_URL}/recover-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ dni, celular })
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return fail(response.status, {
					action: 'recoverPassword',
					success: false,
					error: errorData.error || 'Error al recuperar contraseña.'
				});
			}

			const data = await response.json();
			return {
				action: 'recoverPassword',
				success: true,
				message: data.message,
				nuevaContrasena: data.nuevaContrasena
			};
		} catch (error) {
			return fail(500, {
				action: 'recoverPassword',
				success: false,
				error: error instanceof Error ? error.message : 'Error de conexión con la API.'
			});
		}
	},

	// ======================================================
	// SUBIR archivo nuevo
	// ======================================================
	upload: async ({ request, fetch, cookies }) => {
		const token = cookies.get('token');
		if (!token)
			return fail(401, {
				action: 'upload',
				success: false,
				error: 'No autorizado. Inicia sesión.'
			});

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

			const response = await fetch(`${API_URL}/upload`, {
				method: 'POST',
				body: apiFormData,
				headers: { Authorization: `Bearer ${token}` }
			});

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
	replace: async ({ request, fetch, cookies }) => {
		const token = cookies.get('token');
		if (!token)
			return fail(401, {
				action: 'replace',
				success: false,
				error: 'No autorizado. Inicia sesión.'
			});

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

			const response = await fetch(`${API_URL}/files/${id}`, {
				method: 'PUT',
				body: apiFormData,
				headers: { Authorization: `Bearer ${token}` }
			});

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
	delete: async ({ request, fetch, cookies }) => {
		const token = cookies.get('token');
		if (!token)
			return fail(401, {
				action: 'delete',
				success: false,
				error: 'No autorizado. Inicia sesión.'
			});

		const formData = await request.formData();
		const id = formData.get('id');

		if (typeof id !== 'string' || !id)
			return fail(400, { action: 'delete', success: false, error: 'ID de archivo requerido.' });

		try {
			const response = await fetch(`${API_URL}/files/${id}`, {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` }
			});

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
