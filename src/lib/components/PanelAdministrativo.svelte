<script lang="ts">
	import AddUser from '$lib/components/AddUser.svelte';
	import RecoverPassword from '$lib/components/RecoverPassword.svelte';
	import AssignMesa from '$lib/components/AssignMesa.svelte';
	import UploadForm from '$lib/components/UploadForm.svelte';
	import FileTable from '$lib/components/FileTable.svelte';
	import PanelAdminMesas from '$lib/components/PanelAdminMesas.svelte';

	let {
		form,
		files,
		token,
		onViewPdf
	}: {
		form: any;
		files: any[];
		token: string;
		onViewPdf: (id: string, name: string) => void;
	} = $props();
</script>

<AddUser {form} />
<RecoverPassword {form} />
<AssignMesa {form} />

<div class="my-6">
	<PanelAdminMesas {token} />
</div>

<UploadForm />

<FileTable {files} onView={onViewPdf} />
