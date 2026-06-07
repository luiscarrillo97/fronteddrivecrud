<script lang="ts">
	import BotonBloquearMesa from '$lib/components/BotonBloquearMesa.svelte';
	let { token } = $props<{ token: string }>();

	let mesasGlobales = $state<any[]>([]);
	let loading = $state(true);

	$effect(() => {
		if (token) fetchTodasLasMesas();
	});

	async function fetchTodasLasMesas() {
		try {
			const response = await fetch(
				'https://drivecrud-269414280318.europe-west1.run.app/mesas/todas',
				{
					headers: { Authorization: `Bearer ${token}` }
				}
			);
			if (response.ok) {
				mesasGlobales = await response.json();
			}
		} catch (error) {
			console.error('Error cargando la vista global:', error);
		} finally {
			loading = false;
		}
	}

	function marcarComoBloqueada(numMesa: string) {
		mesasGlobales = mesasGlobales.map((m) =>
			m.numero_mesa === numMesa ? { ...m, estado_mesa: 'BLOQUEADA' } : m
		);
	}
</script>

<div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
	<div class="mb-4 flex items-center justify-between">
		<h2 class="text-xl font-bold text-slate-800">Control Nacional de Mesas (Modo Administrador)</h2>
		<span class="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
			Total: {mesasGlobales.length} mesas
		</span>
	</div>

	{#if loading}
		<p class="text-slate-500">Cargando base de datos nacional...</p>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm text-slate-600">
				<thead class="bg-slate-800 text-xs text-white uppercase">
					<tr>
						<th class="px-4 py-3">Mesa</th>
						<th class="px-4 py-3 text-center">Votos A</th>
						<th class="px-4 py-3 text-center">Votos B</th>
						<th class="px-4 py-3 text-center">Estado</th>
						<th class="px-4 py-3 text-center">Auditoría / Bloqueo</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-200">
					{#each mesasGlobales as mesa (mesa.numero_mesa)}
						<tr class="hover:bg-slate-50">
							<td class="px-4 py-3 font-medium text-slate-900">{mesa.numero_mesa}</td>
							<td class="px-4 py-3 text-center">{mesa.candidato_a || 0}</td>
							<td class="px-4 py-3 text-center">{mesa.candidato_b || 0}</td>
							<td class="px-4 py-3 text-center">
								<span class="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold">
									{mesa.estado_mesa || 'PENDIENTE'}
								</span>
							</td>
							<td class="px-4 py-3 text-center">
								<BotonBloquearMesa
									numeroMesa={mesa.numero_mesa}
									{token}
									estadoActual={mesa.estado_mesa}
									onSuccess={marcarComoBloqueada}
								/>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
