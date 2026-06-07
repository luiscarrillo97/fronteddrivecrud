<script lang="ts">
	import BotonBloquearMesa from '$lib/components/BotonBloquearMesa.svelte';
	let { token } = $props<{ token: string }>();

	let mesasGlobales = $state<any[]>([]);
	let loading = $state(true);

	// Variable para el buscador
	let filtroUbicacion = $state('');

	// Magia de Svelte 5: Filtra la lista en tiempo real según lo que escribas
	let mesasFiltradas = $derived.by(() => {
		if (!filtroUbicacion.trim()) return []; // Si está vacío, no muestra nada

		const texto = filtroUbicacion.toLowerCase();
		return mesasGlobales.filter(
			(m) =>
				(m.departamento && m.departamento.toLowerCase().includes(texto)) ||
				(m.provincia && m.provincia.toLowerCase().includes(texto)) ||
				(m.distrito && m.distrito.toLowerCase().includes(texto)) ||
				(m.numero_mesa && m.numero_mesa.includes(texto))
		);
	});

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
			console.error('Error:', error);
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
	<div class="mb-6 border-b border-slate-100 pb-4">
		<h2 class="text-xl font-bold text-slate-800">Control Nacional de Mesas</h2>
		<p class="text-sm text-slate-500">
			Busque por departamento, provincia, distrito o número de mesa.
		</p>

		<div class="mt-4 flex gap-2">
			<input
				type="text"
				bind:value={filtroUbicacion}
				placeholder="Ej. Lima, Arequipa, Miraflores..."
				class="w-full max-w-md rounded-md border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
			/>
			<span
				class="inline-flex items-center rounded-md bg-blue-50 px-3 text-sm font-semibold text-blue-700"
			>
				Coincidencias: {mesasFiltradas.length}
			</span>
		</div>
	</div>

	{#if loading}
		<p class="text-slate-500">Cargando base de datos nacional...</p>
	{:else if filtroUbicacion.trim() === ''}
		<div class="rounded-md bg-slate-50 p-8 text-center text-slate-500">
			Escriba una ubicación en el buscador para mostrar las mesas correspondientes.
		</div>
	{:else if mesasFiltradas.length === 0}
		<div class="rounded-md bg-red-50 p-8 text-center text-red-500">
			No se encontraron mesas para "{filtroUbicacion}".
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm text-slate-600">
				<thead class="bg-slate-800 text-xs text-white uppercase">
					<tr>
						<th class="px-4 py-3">Mesa</th>
						<th class="px-4 py-3">Ubicación</th>
						<th class="px-4 py-3 text-center">Votos A</th>
						<th class="px-4 py-3 text-center">Votos B</th>
						<th class="px-4 py-3 text-center">Estado</th>
						<th class="px-4 py-3 text-center">Auditoría</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-200">
					{#each mesasFiltradas as mesa (mesa.numero_mesa)}
						<tr class="hover:bg-slate-50">
							<td class="px-4 py-3 font-medium text-slate-900">{mesa.numero_mesa}</td>
							<td class="px-4 py-3 text-xs">
								{mesa.departamento || ''} / {mesa.provincia || ''} / {mesa.distrito || ''}
							</td>
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
