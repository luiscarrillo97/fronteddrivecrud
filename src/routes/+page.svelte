<script lang="ts">
	let { form } = $props<{
		form: {
			success?: boolean;
			error?: string;
			fileId?: string;
			fileName?: string;
			link?: string;
			size?: number;
			createdAt?: string;
		} | null;
	}>();
</script>

<main class="mx-auto mt-10 max-w-lg rounded-lg bg-white p-6 shadow">
	<h1 class="mb-6 text-2xl font-bold">Subir PDF a Google Drive</h1>

	<form method="POST" enctype="multipart/form-data">
		<div class="mb-4">
			<label for="file" class="mb-2 block text-sm font-medium"> Seleccione un PDF </label>

			<input
				id="file"
				name="file"
				type="file"
				accept=".pdf"
				required
				class="block w-full rounded border p-2"
			/>
		</div>

		<button type="submit" class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
			Subir archivo
		</button>
	</form>

	{#if form?.success}
		<div class="mt-6 rounded bg-green-100 p-4 text-green-800">
			<p class="font-bold">Archivo subido correctamente</p>

			<p class="mt-2">
				<strong>Nombre:</strong>
				{form.fileName}
			</p>

			<p>
				<strong>ID:</strong>
				{form.fileId}
			</p>

			<p>
				<strong>Tamaño:</strong>
				{form.size} bytes
			</p>

			<a href={form.link} target="_blank" rel="noopener noreferrer" class="mt-3 block underline">
				Abrir en Google Drive
			</a>
		</div>
	{/if}

	{#if form?.error}
		<div class="mt-6 rounded bg-red-100 p-4 text-red-800">
			{form.error}
		</div>
	{/if}
</main>
