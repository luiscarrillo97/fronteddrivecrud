<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let uploading = $state(false);
</script>

<div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
	<h2 class="mb-4 text-lg font-semibold text-slate-700">Subir nuevo PDF</h2>
	<form
		method="POST"
		action="?/upload"
		enctype="multipart/form-data"
		use:enhance={() => {
			uploading = true;
			return async ({ update }) => {
				await update();
				await invalidateAll();
				uploading = false;
			};
		}}
		class="flex flex-col gap-3 sm:flex-row sm:items-end"
	>
		<div class="flex-1">
			<label for="file-upload" class="mb-1 block text-sm font-medium text-slate-600">
				Selecciona un PDF
			</label>
			<input
				id="file-upload"
				name="file"
				type="file"
				accept=".pdf"
				required
				class="block w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm
					   file:mr-3 file:rounded file:border-0 file:bg-blue-600 file:px-3 file:py-1
					   file:text-xs file:font-semibold file:text-white hover:file:bg-blue-700"
			/>
		</div>
		<button
			type="submit"
			disabled={uploading}
			class="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
		>
			{uploading ? 'Subiendo…' : 'Subir archivo'}
		</button>
	</form>
</div>
