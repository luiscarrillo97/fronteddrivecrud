<script lang="ts">
	let { rolUsuario, dni, token } = $props<{ rolUsuario: string; dni: string; token: string }>();

	let mesas = $state<any[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	let tituloVista = $derived(rolUsuario === 'LOCAL' ? 'Mesas de mi Local' : 'Mis Mesas Asignadas');

	$effect(() => {
		let isCancelled = false;

		async function fetchMesas() {
			loading = true;
			error = null;

			let url = '';
			if (rolUsuario === 'PERSONERO') {
				url = `https://drivecrud-269414280318.europe-west1.run.app/usuarios/${dni}/mesas`;
			} else if (rolUsuario === 'LOCAL') {
				url = `https://drivecrud-269414280318.europe-west1.run.app/locales/mesas-operativas`;
			}

			try {
				const response = await fetch(url, {
					headers: { Authorization: `Bearer ${token}` }
				});

				if (!response.ok) throw new Error('Error al obtener la lista de mesas.');

				const data = await response.json();
				if (!isCancelled) {
					mesas = data;
				}
			} catch (err) {
				if (!isCancelled) error = err instanceof Error ? err.message : 'Error desconocido';
			} finally {
				if (!isCancelled) loading = false;
			}
		}

		if (rolUsuario && dni && token) {
			fetchMesas();
		}

		return () => {
			isCancelled = true;
		};
	});
</script>

<div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
	<h2 class="mb-4 text-xl font-bold text-slate-800">{tituloVista}</h2>

	{#if loading}
		<div class="flex justify-center p-8">
			<span class="text-sm font-medium text-slate-500">Cargando mesas...</span>
		</div>
	{:else if error}
		<div class="rounded-md bg-red-50 p-4 text-red-600">{error}</div>
	{:else if mesas.length === 0}
		<div class="rounded-md bg-blue-50 p-4 text-blue-700">
			No tienes mesas asignadas actualmente.
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm text-slate-600">
				<thead class="bg-slate-100 text-xs text-slate-700 uppercase">
					<tr>
						<th class="px-4 py-3">Local</th>
						<th class="px-4 py-3">Nº Mesa</th>
						<th class="px-4 py-3">Estado</th>
						<th class="px-4 py-3 text-center">Acciones</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-200">
					{#each mesas as mesa, i (mesa.numero_mesa || mesa.NumeroMesa || mesa.numeroMesa || i)}
						<tr class="hover:bg-slate-50">
							<td class="px-4 py-3 font-medium text-slate-900">{mesa.local || mesa.Local || '-'}</td
							>
							<td class="px-4 py-3"
								>{mesa.numero_mesa || mesa.NumeroMesa || mesa.numeroMesa || '-'}</td
							>
							<td class="px-4 py-3">
								<span
									class="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700"
								>
									{mesa.estado_mesa || mesa.Estado || mesa.estado || 'Pendiente'}
								</span>
							</td>
							<td class="px-4 py-3 text-center">
								<button
									class="inline-flex cursor-pointer items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
								>
									Subir PDF
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
