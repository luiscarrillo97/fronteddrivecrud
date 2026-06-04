<script lang="ts">
	import Toast from '$lib/components/Toast.svelte';
	import PdfModal from '$lib/components/PdfModal.svelte';
	import UploadForm from '$lib/components/UploadForm.svelte';
	import FileTable from '$lib/components/FileTable.svelte';
	import Login from '$lib/components/Login.svelte';
	import AdminPanel from '$lib/components/AdminPanel.svelte';

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

			<!-- Panel de Administración (Solo visible para Admin) -->
			{#if data.role === 'ADMIN'}
				<AdminPanel {form} />
			{/if}

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
