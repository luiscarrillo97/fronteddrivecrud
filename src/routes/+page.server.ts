import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

const API_URL = 'https://drivecrud-269414280318.europe-west1.run.app';

// ======================================================
// LOAD — lista archivos al cargar la página
// ======================================================
export const load: PageServerLoad = async ({ fetch, cookies }) => {
	const token = cookies.get('token');
	const role = cookies.get('role');
	const dni = cookies.get('dni');

	if (!token) {
		return { files: [], error: null, loggedIn: false, role: null, token: null, dni: null };
	}

	try {
		let files = [];
		// Solo cargamos los archivos si el usuario es ADMIN (ahorro de peticiones para personeros)
		if (role === 'ADMIN') {
			const response = await fetch(`${API_URL}/files`, {
				headers: { Authorization: `Bearer ${token}` }
			});
			if (!response.ok)
				return {
					files: [],
					error: 'No se pudo cargar la lista de archivos.',
					loggedIn: true,
					role,
					token,
					dni
				};
			files = await response.json();
		}
		return { files, loggedIn: true, role: role || null, token, dni };
	} catch {
		return {
			files: [],
			error: 'Error de conexión al cargar archivos.',
			loggedIn: true,
			role: role || null,
			token,
			dni
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
				// Intentar extraer el mensaje de error de la API si existe
				let apiErrorMsg = result.error || 'Credenciales inválidas.';
				if (result.detail) apiErrorMsg += ` (${result.detail})`;

				return fail(response.status || 400, {
					action: 'login',
					success: false,
					error: apiErrorMsg
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

			// Guardar el DNI en una cookie para consultarlo en la UI
			cookies.set('dni', dni.toString(), {
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'strict',
				maxAge: 60 * 60 * 8
			});

			return { action: 'login', success: true, usuario: result.usuario };
		} catch (error) {
			return fail(500, {
				action: 'login',
				success: false,
				error: `Error al intentar conectar con el servidor: ${error instanceof Error ? error.message : 'Desconocido'}`
			});
		}
	},

	// ======================================================
	// LOGOUT DE USUARIO
	// ======================================================
	logout: async ({ cookies }) => {
		cookies.delete('token', { path: '/' });
		cookies.delete('role', { path: '/' });
		cookies.delete('dni', { path: '/' });
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
		const codUbigeo = formData.get('codUbigeo') as string;
		const tipoPersonero = formData.get('tipoPersonero') as string;
		const celular = formData.get('celular') as string;

		// 1. Validaciones más estrictas para evitar que la BD explote
		if (!dni || !contrasena) {
			return fail(400, {
				action: 'createUser',
				success: false,
				error: 'DNI y contraseña son requeridos.'
			});
		}
		if (!codUbigeo) {
			return fail(400, {
				action: 'createUser',
				success: false,
				error: 'Debes seleccionar una Ubicación válida (hasta el distrito).'
			});
		}
		if (!tipoPersonero) {
			return fail(400, {
				action: 'createUser',
				success: false,
				error: 'Debes seleccionar un Tipo de Personero.'
			});
		}

		try {
			const response = await fetch(`${API_URL}/users`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}` // ¡Esto estaba perfecto!
				},
				body: JSON.stringify({ dni, nombres, contrasena, rol, codUbigeo, tipoPersonero, celular })
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				// 👇 AHORA SÍ LEEMOS EL "DETAIL" QUE MANDA TU API DE C#
				const apiErrorMsg =
					errorData.error || errorData.detail || 'Error interno al crear usuario.';

				return fail(response.status, {
					action: 'createUser',
					success: false,
					error: apiErrorMsg
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
	// CAMBIAR CONTRASEÑA (SOLO ADMIN)
	// ======================================================
	resetPassword: async ({ request, fetch, cookies }) => {
		const token = cookies.get('token');
		const role = cookies.get('role');

		if (!token || role !== 'ADMIN') {
			return fail(401, {
				action: 'resetPassword',
				success: false,
				error: 'No autorizado. Solo los administradores pueden realizar esta acción.'
			});
		}

		const formData = await request.formData();
		const dni = formData.get('dni') as string;
		const nuevaContrasena = formData.get('nuevaContrasena') as string;

		if (!dni || !nuevaContrasena) {
			return fail(400, {
				action: 'resetPassword',
				success: false,
				error: 'El DNI y la nueva contraseña son requeridos.'
			});
		}

		try {
			const response = await fetch(`${API_URL}/users/${dni}/password`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ nuevaContrasena })
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return fail(response.status, {
					action: 'resetPassword',
					success: false,
					error: errorData.error || 'Error al cambiar la contraseña.'
				});
			}

			const data = await response.json();
			return {
				action: 'resetPassword',
				success: true,
				message: data.message
			};
		} catch (error) {
			return fail(500, {
				action: 'resetPassword',
				success: false,
				error: error instanceof Error ? error.message : 'Error de conexión con la API.'
			});
		}
	},

	// ======================================================
	// ASIGNAR MESA (SOLO ADMIN)
	// ======================================================
	assignMesa: async ({ request, fetch, cookies }) => {
		const token = cookies.get('token');
		const role = cookies.get('role');

		if (!token || role !== 'ADMIN') {
			return fail(401, {
				action: 'assignMesa',
				success: false,
				error: 'No autorizado. Solo los administradores pueden realizar esta acción.'
			});
		}

		const formData = await request.formData();
		const dniPersonero = formData.get('dniPersonero') as string;
		const numeroMesa = formData.get('numeroMesa') as string;

		if (!dniPersonero || !numeroMesa) {
			return fail(400, {
				action: 'assignMesa',
				success: false,
				error: 'El DNI del personero y el número de mesa son obligatorios.'
			});
		}

		try {
			const response = await fetch(`${API_URL}/asignar-mesa`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ dniPersonero, numeroMesa })
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				const apiErrorMsg = errorData.error || errorData.detail || 'Error al asignar la mesa.';
				return fail(response.status, {
					action: 'assignMesa',
					success: false,
					error: apiErrorMsg
				});
			}

			const data = await response.json();
			return { action: 'assignMesa', success: true, message: data.message };
		} catch (error) {
			return fail(500, {
				action: 'assignMesa',
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
