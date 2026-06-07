<script lang="ts">
	let { rolUsuario, token } = $props<{ rolUsuario: string; token: string }>();

	let paginaActual = $state(1);
	let mesas = $state<any[]>([]);
	let infoPaginacion = $state({
		paginaActual: 1,
		totalPaginas: 1,
		totalRegistros: 0
	});

	let loading = $state(false);
	let error = $state<string | null>(null);

	let esAdminOSoporte = $derived(rolUsuario === 'ADMIN' || rolUsuario === 'SOPORTE');

	$effect(() => {
		let isCancelled = false;

		async function fetchDatosGerenciales() {
			loading = true;
			error = null;

			try {
				const url = `https://drivecrud-269414280318.europe-west1.run.app/admin/mesas-region?page=${paginaActual}&pageSize=50`;
				const response = await fetch(url, {
					headers: { Authorization: `Bearer ${token}` }
				});

				if (!response.ok) throw new Error('Error al cargar datos gerenciales.');

				const result = await response.json();

				if (!isCancelled) {
					mesas = result.data || [];
					infoPaginacion = result.paginacion || {
						paginaActual,
						totalPaginas: 1,
						totalRegistros: 0
					};
				}
			} catch (err) {
				if (!isCancelled) error = err instanceof Error ? err.message : 'Error desconocido';
			} finally {
				if (!isCancelled) loading = false;
			}
		}

		if (token) {
			fetchDatosGerenciales();
		}

		return () => {
			isCancelled = true;
		};
	});

	function prevPage() {
		if (paginaActual > 1) paginaActual--;
	}

	function nextPage() {
		if (paginaActual < infoPaginacion.totalPaginas) paginaActual++;
	}
</script>

<div class="space-y-6">
	<div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-bold text-slate-800">Panel de Supervisión (Reporte Paginado)</h2>

			{#if esAdminOSoporte}
				<div class="flex gap-2">
					<button
						class="rounded-md bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700"
						>Crear Usuario</button
					>
					<button
						class="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
						>Asignar Mesa</button
					>
					<button
						class="rounded-md bg-purple-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-purple-700"
						>Cambiar Contraseña</button
					>
				</div>
			{/if}
		</div>

		{#if error}
			<div class="mb-4 rounded-md bg-red-50 p-4 text-red-600">{error}</div>
		{/if}

		<div class="relative overflow-x-auto">
			<table class="w-full text-left text-sm text-slate-600">
				<thead class="bg-slate-100 text-xs text-slate-700 uppercase">
					<tr>
						<th class="px-4 py-3">Distrito</th>
						<th class="px-4 py-3">Local</th>
						<th class="px-4 py-3">Nº Mesa</th>
						<th class="px-4 py-3 text-center">Cant. Personeros</th>
						<th class="px-4 py-3 text-center">Acciones</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-200 {loading ? 'pointer-events-none opacity-50' : ''}">
					{#each mesas as mesa, i (mesa.numeroMesa || mesa.NumeroMesa || mesa.numero_mesa || i)}
						{@const cantPersoneros = mesa.cantidadPersoneros || mesa.CantidadPersoneros || 0}
						<tr class="hover:bg-slate-50">
							<td class="px-4 py-3">{mesa.distrito || mesa.Distrito || '-'}</td>
							<td class="px-4 py-3">{mesa.local || mesa.Local || '-'}</td>
							<td class="px-4 py-3 font-medium text-slate-900"
								>{mesa.numeroMesa || mesa.NumeroMesa || mesa.numero_mesa || '-'}</td
							>
							<td class="px-4 py-3 text-center">
								<span
									class="inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold {cantPersoneros >
									0
										? 'bg-green-100 text-green-800'
										: 'bg-slate-100 text-slate-800'}"
								>
									{cantPersoneros}
								</span>
							</td>
							<td class="px-4 py-3 text-center">
								{#if cantPersoneros > 0}
									<button
										class="inline-flex cursor-pointer items-center justify-center rounded-md bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-900"
									>
										Ver Detalle
									</button>
								{:else}
									<span class="text-xs text-slate-400 italic">Sin asignar</span>
								{/if}
							</td>
						</tr>
					{:else}
						{#if !loading}
							<tr>
								<td colspan="5" class="py-6 text-center text-slate-500"
									>No hay mesas para mostrar.</td
								>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		</div>

		<div class="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
			<span class="text-sm text-slate-600">
				Mostrando registros de la página <span class="font-bold">{infoPaginacion.paginaActual}</span
				>
				de <span class="font-bold">{infoPaginacion.totalPaginas}</span>
				(Total: {infoPaginacion.totalRegistros})
			</span>

			<div class="flex gap-2">
				<button
					onclick={prevPage}
					disabled={paginaActual === 1 || loading}
					class="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
				>
					Anterior
				</button>
				<button
					onclick={nextPage}
					disabled={paginaActual >= infoPaginacion.totalPaginas || loading}
					class="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
				>
					Siguiente
				</button>
			</div>
		</div>
	</div>
</div>
