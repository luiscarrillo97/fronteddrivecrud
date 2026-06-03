<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let {
		file,
		onView
	}: {
		// 👇 Se eliminó 'link: string' de aquí
		file: { id: string; nombre: string; tamano: number | null; fecha: string | null };
		onView: (id: string, name: string) => void;
	} = $props();

	let replacingId = $state<string | null>(null);
	let replacingSubmit = $state(false);
	let deletingId = $state<string | null>(null);

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

<tr class="transition-colors hover:bg-slate-50">
	<!-- Nombre -->
	<td class="max-w-[200px] truncate px-6 py-4 font-medium text-slate-800" title={file.nombre}>
		📄 {file.nombre}
	</td>

	<!-- Tamaño -->
	<td class="px-6 py-4 text-slate-500">{formatSize(file.tamano)}</td>

	<!-- Fecha -->
	<td class="px-6 py-4 text-slate-500">{formatDate(file.fecha)}</td>

	<!-- VER -->
	<td class="px-6 py-4 text-center">
		<button
			type="button"
			onclick={() => onView(file.id, file.nombre)}
			class="inline-flex items-center justify-center rounded-md border border-slate-200
				   px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
		>
			👁 Ver
		</button>
	</td>

	<!-- REEMPLAZAR -->
	<td class="px-6 py-4 text-center">
		{#if replacingId === file.id}
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
					   px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
			>
				{deletingId === file.id ? '…' : '🗑 Eliminar'}
			</button>
		</form>
	</td>
</tr>
