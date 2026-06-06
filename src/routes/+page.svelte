<script lang="ts">
	import Toast from '$lib/components/Toast.svelte';
	import PdfModal from '$lib/components/PdfModal.svelte';
	import UploadForm from '$lib/components/UploadForm.svelte';
	import FileTable from '$lib/components/FileTable.svelte';
	import Login from '$lib/components/Login.svelte';
	import AddUser from '$lib/components/AddUser.svelte';
	import RecoverPassword from '$lib/components/RecoverPassword.svelte';
	import AssignMesa from '$lib/components/AssignMesa.svelte';

	let { data, form } = $props<{
		data: {
			files: {
				id: string;
				nombre: string;
				tamano: number | null;
				fecha: string | null;
				link: string;
			}[];
			error?: string;
			loggedIn: boolean;
			role: string | null;
			token: string | null;
			dni: string | null;
		};
		form: {
			action?: string;
			success?: boolean;
			error?: string;
			message?: string;
			fileName?: string;
			usuario?: any;
			nuevaContrasena?: string;
		} | null;
	}>();

	let viewingFileId = $state<string | null>(null);
	let modalName = $state('');

	// Estados para las mesas del personero
	let mesas = $state<any[]>([]);
	let loading = $state(true);
	let errorMesas = $state('');

	// Al montar el componente, fetch de mesas si NO es admin
	$effect(() => {
		if (data.loggedIn && data.role !== 'ADMIN' && data.token && data.dni) {
			fetchMesas(data.dni, data.token);
		}
	});

	async function fetchMesas(dni: string, token: string) {
		try {
			const response = await fetch(
				`https://drivecrud-269414280318.europe-west1.run.app/usuarios/${dni}/mesas`,
				{
					headers: { Authorization: `Bearer ${token}` }
				}
			);
			if (response.ok) {
				mesas = await response.json();
			} else if (response.status === 404) {
				mesas = []; // Usuario sin mesas asignadas
			} else {
				errorMesas = 'Error al cargar las mesas asignadas.';
			}
		} catch {
			errorMesas = 'Error de conexión al cargar las mesas.';
		} finally {
			loading = false;
		}
	}
</script>

{#if !data.loggedIn}
	<Login {form} />
{:else}
	<!-- ============================================== -->
	<!-- VISTA PRINCIPAL (CRUD DRIVE) -->
	<!-- ============================================== -->
	<main class="min-h-screen bg-slate-50 px-4 py-10 font-sans">
		<div class="mx-auto max-w-4xl space-y-8">
			<!-- Cabecera -->
			<div class="flex items-start justify-between">
				<div>
					<h1 class="text-3xl font-extrabold tracking-tight text-slate-800">📁 Gestor de PDFs</h1>
					<p class="mt-1 text-sm text-slate-500">
						Sube, visualiza, reemplaza y elimina archivos en Google Drive.
					</p>
				</div>
				<form method="POST" action="?/logout">
					<button
						type="submit"
						class="text-sm font-medium text-red-600 underline underline-offset-2 hover:text-red-800"
					>
						Cerrar Sesión
					</button>
				</form>
			</div>

			<!-- Toasts -->
			<Toast {form} dataError={data.error} />

			{#if data.role === 'ADMIN'}
				<!-- ============================================== -->
				<!-- VISTA DE ADMINISTRADOR -->
				<!-- ============================================== -->
				<AddUser {form} />
				<RecoverPassword {form} />
				<AssignMesa {form} />

				<!-- Subir -->
				<UploadForm />

				<!-- Tabla -->
				<FileTable
					files={data.files}
					onView={(id, name) => {
						viewingFileId = id;
						modalName = name;
					}}
				/>
			{:else}
				<!-- ============================================== -->
				<!-- VISTA DE PERSONERO -->
				<!-- ============================================== -->
				<div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-xl font-bold text-slate-800">Mis Mesas Asignadas</h2>

					{#if loading}
						<div class="flex justify-center p-8">
							<span class="text-sm font-medium text-slate-500">Cargando mesas...</span>
						</div>
					{:else if errorMesas}
						<div class="rounded-md bg-red-50 p-4 text-red-600">
							{errorMesas}
						</div>
					{:else if mesas.length === 0}
						<div class="rounded-md bg-blue-50 p-4 text-blue-700">
							Usted todavía no tiene mesas asignadas.
						</div>
					{:else}
						<div class="overflow-x-auto">
							<table class="w-full text-left text-sm text-slate-600">
								<thead class="bg-slate-100 text-xs text-slate-700 uppercase">
									<tr>
										<th class="px-4 py-3">Mesa</th>
										<th class="px-4 py-3">Local de Votación</th>
										<th class="px-4 py-3">Distrito</th>
										<th class="px-4 py-3 text-center">Votantes</th>
										<th class="px-4 py-3">Estado</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-200">
									{#each mesas as mesa (mesa.numero_mesa)}
										<tr class="hover:bg-slate-50">
											<td class="px-4 py-3 font-medium whitespace-nowrap text-slate-900"
												>{mesa.numero_mesa}</td
											>
											<td class="px-4 py-3">{mesa.local_votacion}</td>
											<td class="px-4 py-3">{mesa.distrito}</td>
											<td class="px-4 py-3 text-center">{mesa.numero_votantes}</td>
											<td class="px-4 py-3">
												<span
													class="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700"
												>
													{mesa.estado_mesa || 'Pendiente'}
												</span>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</main>

	<!-- Modal PDF -->
	<PdfModal
		{viewingFileId}
		{modalName}
		onClose={() => {
			viewingFileId = null;
			modalName = '';
		}}
	/>
{/if}
