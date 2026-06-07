<script lang="ts">
	import AddUser from '$lib/components/AddUser.svelte';
	import RecoverPassword from '$lib/components/RecoverPassword.svelte';
	import AssignMesa from '$lib/components/AssignMesa.svelte';
	import UploadForm from '$lib/components/UploadForm.svelte';
	import FileTable from '$lib/components/FileTable.svelte';

	let {
		form,
		files,
		onViewPdf
	}: {
		form: any;
		files: any[];
		onViewPdf: (id: string, name: string) => void;
	} = $props();
</script>

<!-- ============================================== -->
<!-- VISTA DE ADMINISTRADOR -->
<!-- ============================================== -->
<AddUser {form} />
<RecoverPassword {form} />
<AssignMesa {form} />

<!-- Subir y Tabla de Archivos -->
<UploadForm />

<FileTable {files} onView={onViewPdf} />
