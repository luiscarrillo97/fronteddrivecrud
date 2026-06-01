<script lang="ts">
	// Recibimos la respuesta del servidor (form) usando la nueva sintaxis de Svelte 5
	let { form } = $props<{
		form: {
			success?: boolean;
			link?: string;
			error?: string;
		} | null;
	}>();
</script>

<main class="mx-auto mt-10 max-w-md rounded-lg bg-white p-6 shadow">
	<h2 class="mb-4 text-xl font-bold">Subir Documento PDF a Drive</h2>

	<form method="POST" enctype="multipart/form-data" class="space-y-4">
		<div>
			<label for="pdfFile" class="mb-2 block text-sm font-medium text-gray-700">
				Selecciona tu archivo PDF:
			</label>
			<input
				type="file"
				id="pdfFile"
				name="pdfFile"
				accept=".pdf"
				required
				class="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
			/>
		</div>

		<button
			type="submit"
			class="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
		>
			Subir a Drive
		</button>
	</form>

	{#if form}
		{#if form.success}
			<div class="mt-4 rounded bg-green-100 p-3 text-green-800">
				¡Archivo subido con éxito!
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
				<a href={form.link} target="_blank" class="mt-1 block font-bold text-green-900 underline">
					Ver en Google Drive
				</a>
			</div>
		{/if}

		{#if form.error}
			<div class="mt-4 rounded bg-red-100 p-3 text-red-800">
				Error: {form.error}
			</div>
		{/if}
	{/if}
</main>
