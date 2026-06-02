<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

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
			fileId?: string;
			fileName?: string;
			link?: string;
			deletedId?: string;
		} | null;
	}>();

	// ID del archivo al que se le está haciendo replace (null = ninguno)
	let replacingId = $state<string | null>(null);

	// Mientras se procesa alguna acción
	let uploading = $state(false);
	let deletingId = $state<string | null>(null);
	let replacingSubmit = $state(false);

	function formatSize(bytes: number | null): string {
		if (!bytes) return '—';
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function formatDate(iso: string | null): string {
		if (!iso) return '—';
		return new Date(iso).toLocaleDateString('es-PE', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<main class="min-h-screen bg-slate-50 px-4 py-10 font-sans">
	<div class="mx-auto max-w-4xl space-y-8">
		<!-- ── CABECERA ── -->
		<div>
			<h1 class="text-3xl font-extrabold tracking-tight text-slate-800">📁 Gestor de PDFs</h1>
			<p class="mt-1 text-sm text-slate-500">
				Sube, visualiza, reemplaza y elimina archivos en Google Drive.
			</p>
		</div>

		<!-- ── TOAST GLOBAL ── -->
		{#if form?.success && form.action === 'upload'}
			<div class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
				✅ <strong>{form.fileName}</strong> subido correctamente.
				<a href={form.link} target="_blank" rel="noopener noreferrer" class="ml-2 underline">
					Ver en Drive
				</a>
			</div>
		{/if}
		{#if form?.success && form.action === 'replace'}
			<div class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
				🔄 <strong>{form.fileName}</strong> reemplazado correctamente.
			</div>
		{/if}
		{#if form?.success && form.action === 'delete'}
			<div
				class="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800"
			>
				🗑️ Archivo eliminado correctamente.
			</div>
		{/if}
		{#if form?.error}
			<div class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
				❌ {form.error}
			</div>
		{/if}
		{#if data.error}
			<div
				class="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800"
			>
				⚠️ {data.error}
			</div>
		{/if}

		<!-- ── CARD: SUBIR PDF ── -->
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
					class="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white
						   hover:bg-blue-700 disabled:opacity-60"
				>
					{uploading ? 'Subiendo…' : 'Subir archivo'}
				</button>
			</form>
		</div>

		<!-- ── CARD: TABLA DE ARCHIVOS ── -->
		<div class="rounded-xl border border-slate-200 bg-white shadow-sm">
			<div class="border-b border-slate-100 px-6 py-4">
				<h2 class="text-lg font-semibold text-slate-700">
					Archivos en Drive
					<span
						class="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500"
					>
						{data.files.length}
					</span>
				</h2>
			</div>

			{#if data.files.length === 0}
				<div class="px-6 py-12 text-center text-sm text-slate-400">
					No hay archivos todavía. ¡Sube el primero!
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead class="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
							<tr>
								<th class="px-6 py-3 text-left">Nombre</th>
								<th class="px-6 py-3 text-left">Tamaño</th>
								<th class="px-6 py-3 text-left">Fecha</th>
								<th class="px-6 py-3 text-center">Ver</th>
								<th class="px-6 py-3 text-center">Reemplazar</th>
								<th class="px-6 py-3 text-center">Eliminar</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100">
							{#each data.files as file (file.id)}
								<tr class="transition-colors hover:bg-slate-50">
									<!-- Nombre -->
									<td
										class="max-w-[220px] truncate px-6 py-4 font-medium text-slate-800"
										title={file.nombre}
									>
										📄 {file.nombre}
									</td>

									<!-- Tamaño -->
									<td class="px-6 py-4 text-slate-500">
										{formatSize(file.tamano)}
									</td>

									<!-- Fecha -->
									<td class="px-6 py-4 text-slate-500">
										{formatDate(file.fecha)}
									</td>

									<!-- VER -->
									<td class="px-6 py-4 text-center">
										<a
											href={file.link}
											target="_blank"
											rel="noopener noreferrer"
											class="inline-flex items-center justify-center rounded-md border border-slate-200
												   px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
											title="Ver en Drive"
										>
											👁 Ver
										</a>
									</td>

									<!-- REEMPLAZAR -->
									<td class="px-6 py-4 text-center">
										{#if replacingId === file.id}
											<!-- formulario inline de reemplazo -->
											<form
												method="POST"
												action="?/replace"
												enctype="multipart/form-data"
												use:enhance={() => {
													replacingSubmit = true;
													return async ({ update }) => {
														await update();
														await invalidateAll();
														replacingSubmit = false;
														replacingId = null;
													};
												}}
												class="flex flex-col items-center gap-1"
											>
												<input type="hidden" name="id" value={file.id} />
												<input
													name="file"
													type="file"
													accept=".pdf"
													required
													class="block w-full rounded border border-slate-300 px-2 py-1 text-xs
														   file:mr-2 file:rounded file:border-0 file:bg-blue-600
														   file:px-2 file:py-0.5 file:text-xs file:text-white"
												/>
												<div class="flex gap-1">
													<button
														type="submit"
														disabled={replacingSubmit}
														class="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-60"
													>
														{replacingSubmit ? '…' : 'Guardar'}
													</button>
													<button
														type="button"
														onclick={() => (replacingId = null)}
														class="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
													>
														Cancelar
													</button>
												</div>
											</form>
										{:else}
											<button
												type="button"
												onclick={() => (replacingId = file.id)}
												class="inline-flex items-center justify-center rounded-md border border-slate-200
													   px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
												title="Reemplazar PDF"
											>
												🔄 Reemplazar
											</button>
										{/if}
									</td>

									<!-- ELIMINAR -->
									<td class="px-6 py-4 text-center">
										<form
											method="POST"
											action="?/delete"
											use:enhance={() => {
												deletingId = file.id;
												return async ({ update }) => {
													await update();
													await invalidateAll();
													deletingId = null;
												};
											}}
										>
											<input type="hidden" name="id" value={file.id} />
											<button
												type="submit"
												disabled={deletingId === file.id}
												onclick={(e) => {
													if (!confirm(`¿Eliminar "${file.nombre}"?`)) e.preventDefault();
												}}
												class="inline-flex items-center justify-center rounded-md border border-red-200
													   px-3 py-1 text-xs font-medium text-red-600
													   hover:bg-red-50 disabled:opacity-60"
												title="Eliminar archivo"
											>
												{deletingId === file.id ? '…' : '🗑 Eliminar'}
											</button>
										</form>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</main>
