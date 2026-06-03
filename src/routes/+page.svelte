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
		};
		form: {
			action?: string;
			success?: boolean;
			error?: string;
			fileName?: string;
		} | null;
	}>();

	let viewingFileId = $state<string | null>(null);
	let modalName = $state('');
</script>

<main class="min-h-screen bg-slate-50 px-4 py-10 font-sans">
	<div class="mx-auto max-w-4xl space-y-8">
		<!-- Cabecera -->
		<div>
			<h1 class="text-3xl font-extrabold tracking-tight text-slate-800">📁 Gestor de PDFs</h1>
			<p class="mt-1 text-sm text-slate-500">
				Sube, visualiza, reemplaza y elimina archivos en Google Drive.
			</p>
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
