<script lang="ts">
	import Toast from '$lib/components/Toast.svelte';
	import PdfModal from '$lib/components/PdfModal.svelte';
	import UploadForm from '$lib/components/UploadForm.svelte';
	import FileTable from '$lib/components/FileTable.svelte';

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
		};
		form: {
			action?: string;
			success?: boolean;
			error?: string;
			fileName?: string;
			usuario?: any;
		} | null;
	}>();

	let viewingFileId = $state<string | null>(null);
	let modalName = $state('');
</script>

{#if !data.loggedIn}
	<!-- ============================================== -->
	<!-- VISTA DE LOGIN -->
	<!-- ============================================== -->
	<main class="flex min-h-screen items-center justify-center bg-slate-50 px-4 font-sans">
		<div class="w-full max-w-md rounded-xl border border-slate-100 bg-white p-8 shadow-md">
			<h2 class="mb-6 text-center text-2xl font-extrabold text-slate-800">Iniciar Sesión</h2>
			<form method="POST" action="?/login" class="space-y-4">
				<div>
					<label for="dni" class="block text-sm font-medium text-slate-700">DNI</label>
					<input
						type="text"
						id="dni"
						name="dni"
						placeholder="Tu número de DNI"
						class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
						required
					/>
				</div>
				<div>
					<label for="contrasena" class="block text-sm font-medium text-slate-700">Contraseña</label
					>
					<input
						type="password"
						id="contrasena"
						name="contrasena"
						placeholder="••••••••"
						class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
						required
					/>
				</div>
				<button
					type="submit"
					class="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
				>
					Ingresar
				</button>
			</form>
			{#if form?.error && form?.action === 'login'}
				<p class="mt-4 text-center text-sm text-red-500">{form.error}</p>
			{/if}
		</div>
	</main>
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
