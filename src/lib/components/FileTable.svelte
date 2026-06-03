<script lang="ts">
	import FileRow from './FileRow.svelte';

	let {
		files,
		onView
	}: {
		files: {
			id: string;
			nombre: string;
			tamano: number | null;
			fecha: string | null;
			link: string;
		}[];
		onView: (id: string, name: string) => void;
	} = $props();
</script>

<div class="rounded-xl border border-slate-200 bg-white shadow-sm">
	<div class="border-b border-slate-100 px-6 py-4">
		<h2 class="text-lg font-semibold text-slate-700">
			Archivos en Drive
			<span class="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">
				{files.length}
			</span>
		</h2>
	</div>

	{#if files.length === 0}
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
					{#each files as file (file.id)}
						<FileRow {file} {onView} />
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
