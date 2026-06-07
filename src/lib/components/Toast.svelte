<script lang="ts">
	let {
		form,
		dataError
	}: {
		form: {
			action?: string;
			success?: boolean;
			error?: string;
			fileName?: string;
		} | null;
		dataError?: string;
	} = $props();
</script>

{#if form?.success && form.action === 'upload'}
	<div class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
		✅ <strong>{form.fileName}</strong> subido correctamente.
	</div>
{/if}

{#if form?.success && form.action === 'replace'}
	<div class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
		🔄 <strong>{form.fileName}</strong> reemplazado correctamente.
	</div>
{/if}

{#if form?.success && form.action === 'delete'}
	<div class="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
		🗑️ Archivo eliminado correctamente.
	</div>
{/if}

{#if form?.error}
	<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
		❌ {form.error}
	</div>
{/if}

{#if dataError}
	<div class="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
		⚠️ {dataError}
	</div>
{/if}
