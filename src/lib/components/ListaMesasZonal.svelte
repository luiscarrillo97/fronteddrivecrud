<script lang="ts">
	let {
		token,
		codUbigeo,
		onViewPdf
	}: {
		token: string;
		codUbigeo: string; // El ubigeo (distrito) que se le asignó al personero
		onViewPdf: (id: string, name: string) => void;
	} = $props();

	// ============================================
	// Estados para Locales de Votación (La Zona)
	// ============================================
	let locales = $state<any[]>([]);
	let selectedLocal = $state<string | number>('');
	let cargandoLocales = $state(false);

	// ============================================
	// Estados para las Mesas del Local Escogido
	// ============================================
	let mesas = $state<any[]>([]);
	let loadingMesas = $state(false);
	let errorMesas = $state('');

	// ============================================
	// Estados para Registrar Votos (Idéntico a ListaMesas)
	// ============================================
	let mesaSeleccionada = $state<any>(null);
	let showModalResultados = $state(false);
	let votosA = $state(0);
	let votosB = $state(0);
	let totalVotantes = $state(0);

	// ============================================
	// Estados para UX al subir archivos
	// ============================================
	let mesaSubiendo = $state<string | null>(null);
	let mensajeToast = $state<{ texto: string; tipo: 'exito' | 'error' } | null>(null);

	// 1. EFECTO: Buscar los locales usando el endpoint que proporcionaste
	$effect(() => {
		if (codUbigeo) {
			cargarLocales(codUbigeo);
		}
	});

	async function cargarLocales(ubigeo: string) {
		cargandoLocales = true;
		try {
			const response = await fetch(
				`https://drivecrud-269414280318.europe-west1.run.app/locales/${ubigeo}`
			);
			if (response.ok) {
				locales = await response.json();
			} else {
				locales = [];
			}
		} catch (err) {
			console.error('Error al cargar locales zonales:', err);
			locales = [];
		} finally {
			cargandoLocales = false;
		}
	}

	// 2. EFECTO: Cargar mesas cada vez que el personero seleccione un Local
	$effect(() => {
		if (selectedLocal && token) {
			fetchMesasPorLocal(selectedLocal, token);
		} else {
			mesas = [];
		}
	});

	async function fetchMesasPorLocal(idLocal: string | number, authToken: string) {
		loadingMesas = true;
		errorMesas = '';
		try {
			// NOTA: Ajusta esta URL al endpoint correcto de tu backend en C#
			// que te devuelva las mesas pertenecientes a un id_local.
			const response = await fetch(
				`https://drivecrud-269414280318.europe-west1.run.app/locales/${idLocal}/mesas`,
				{ headers: { Authorization: `Bearer ${authToken}` } }
			);

			if (response.ok) {
				mesas = await response.json();
			} else if (response.status === 404) {
				mesas = [];
			} else {
				errorMesas = 'Error al cargar las mesas del local seleccionado.';
			}
		} catch (err) {
			console.error('Error crítico:', err);
			errorMesas = 'Error de conexión al cargar las mesas zonales.';
		} finally {
			loadingMesas = false;
		}
	}

	// 3. LOGICA: Subir PDF y Registrar Votos (Reutilizada de ListaMesas)
	async function subirPdf(numeroMesa: string, file: File) {
		if (!token) return;
		mesaSubiendo = numeroMesa;

		const formData = new FormData();
		formData.append('file', file);
		formData.append('numeroMesa', numeroMesa);

		try {
			const response = await fetch(
				'https://drivecrud-269414280318.europe-west1.run.app/mesas/subir-pdf',
				{
					method: 'POST',
					headers: { Authorization: `Bearer ${token}` },
					body: formData
				}
			);

			if (response.ok) {
				const result = await response.json();
				mesas = mesas.map((m) =>
					m.numero_mesa === numeroMesa ? { ...m, archivo_drive_id: result.fileId } : m
				);
				mensajeToast = { texto: 'Guardado de acta exitoso', tipo: 'exito' };
			} else {
				mensajeToast = { texto: 'Error al subir el acta', tipo: 'error' };
			}
		} catch (error) {
			mensajeToast = { texto: 'Error de red al subir el acta', tipo: 'error' };
		} finally {
			mesaSubiendo = null;
			setTimeout(() => {
				mensajeToast = null;
			}, 3000);
		}
	}

	function abrirModalVotos(mesa: any) {
		mesaSeleccionada = mesa;
		votosA = mesa.candidato_a || 0;
		votosB = mesa.candidato_b || 0;
		totalVotantes = mesa.numero_votantes || 0;
		showModalResultados = true;
	}

	async function guardarResultados() {
		if (!token || !mesaSeleccionada) return;
		try {
			const response = await fetch(
				'https://drivecrud-269414280318.europe-west1.run.app/mesas/registrar-acta',
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
					body: JSON.stringify({
						numeroMesa: mesaSeleccionada.numero_mesa,
						candidatoA: votosA,
						candidatoB: votosB,
						numeroVotantes: totalVotantes
					})
				}
			);

			if (response.ok) {
				mesas = mesas.map((m) =>
					m.numero_mesa === mesaSeleccionada.numero_mesa
						? {
								...m,
								candidato_a: votosA,
								candidato_b: votosB,
								numero_votantes: totalVotantes,
								estado_mesa: 'PROCESADA'
							}
						: m
				);
				showModalResultados = false;
				mesaSeleccionada = null;
			}
		} catch (error) {
			console.error('Error al registrar votos:', error);
		}
	}
</script>

<!-- TOAST NOTIFICATIONS -->
{#if mensajeToast}
	<div
		class="fixed top-4 right-4 z-50 rounded-md px-4 py-3 font-semibold text-white shadow-lg transition-all duration-300"
		class:bg-emerald-500={mensajeToast.tipo === 'exito'}
		class:bg-red-500={mensajeToast.tipo === 'error'}
	>
		{mensajeToast.texto}
	</div>
{/if}

<!-- SECCIÓN ZONAL: SELECTOR DE LOCAL -->
<div class="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
	<h2 class="mb-4 text-xl font-bold text-slate-800">Mi Zona Asignada</h2>
	<div class="max-w-md">
		<label for="localSelect" class="mb-1 block text-sm font-medium text-slate-700"
			>Seleccione un Local de Votación</label
		>
		<select
			id="localSelect"
			bind:value={selectedLocal}
			disabled={cargandoLocales}
			class="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:opacity-70"
		>
			<option value="">-- Seleccione un local --</option>
			<!-- Usamos nullish coalescing (??) por si la API envía idLocal en camelCase o IdLocal en PascalCase -->
			{#each locales as local (local.IdLocal ?? local.idLocal)}
				<option value={local.IdLocal ?? local.idLocal}>{local.NomLocal ?? local.nomLocal}</option>
			{/each}
		</select>
	</div>
</div>

<!-- SECCIÓN DE MESAS: SE MUESTRA SOLO CUANDO HAY UN LOCAL SELECCIONADO -->
{#if selectedLocal}
	<div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-xl font-bold text-slate-800">Mesas del Local</h2>

		{#if loadingMesas}
			<div class="flex justify-center p-8">
				<span class="text-sm font-medium text-slate-500">Cargando mesas...</span>
			</div>
		{:else if errorMesas}
			<div class="rounded-md bg-red-50 p-4 text-red-600">{errorMesas}</div>
		{:else if mesas.length === 0}
			<div class="rounded-md bg-blue-50 p-4 text-blue-700">
				No se encontraron mesas para este local de votación.
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm text-slate-600">
					<thead class="bg-slate-100 text-xs text-slate-700 uppercase">
						<tr
							><th class="px-4 py-3">Mesa</th><th class="px-4 py-3 text-center">Votantes</th><th
								class="px-4 py-3">Estado</th
							><th class="px-4 py-3 text-center">ACTA / PDF</th><th class="px-4 py-3 text-center"
								>RESULTADOS</th
							></tr
						>
					</thead>
					<tbody class="divide-y divide-slate-200">
						{#each mesas as mesa (mesa.numero_mesa)}
							<tr class="hover:bg-slate-50">
								<td class="px-4 py-3 font-medium whitespace-nowrap text-slate-900"
									>{mesa.numero_mesa}</td
								>
								<td class="px-4 py-3 text-center">{mesa.numero_votantes}</td>
								<td class="px-4 py-3"
									><span
										class="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700"
										>{mesa.estado_mesa || 'Pendiente'}</span
									></td
								>
								<td class="px-4 py-3 text-center">
									{#if mesaSubiendo === mesa.numero_mesa}
										<button
											disabled
											class="inline-flex cursor-wait items-center justify-center rounded-md bg-slate-400 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
											>Espere...</button
										>
									{:else if !mesa.archivo_drive_id}
										<label
											class="inline-flex cursor-pointer items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
											>Subir PDF<input
												type="file"
												accept=".pdf"
												class="hidden"
												onchange={(e) => {
													const file = e.currentTarget.files?.[0];
													if (file) subirPdf(mesa.numero_mesa, file);
													e.currentTarget.value = '';
												}}
											/></label
										>
									{:else}
										<div class="flex flex-wrap items-center justify-center gap-2">
											<button
												type="button"
												onclick={() =>
													onViewPdf(mesa.archivo_drive_id, 'Acta Mesa ' + mesa.numero_mesa)}
												class="inline-flex cursor-pointer items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
												>Ver PDF</button
											>
											<label
												class="inline-flex cursor-pointer items-center justify-center rounded-md bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-300"
												>Reemplazar<input
													type="file"
													accept=".pdf"
													class="hidden"
													onchange={(e) => {
														const file = e.currentTarget.files?.[0];
														if (file) subirPdf(mesa.numero_mesa, file);
														e.currentTarget.value = '';
													}}
												/></label
											>
										</div>
									{/if}
								</td>
								<td class="px-4 py-3 text-center">
									{#if mesa.estado_mesa === 'PROCESADA'}
										<button
											type="button"
											onclick={() => abrirModalVotos(mesa)}
											class="inline-flex cursor-pointer items-center justify-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
											>Ver / Editar Votos</button
										>
									{:else}
										<button
											type="button"
											onclick={() => abrirModalVotos(mesa)}
											class="inline-flex cursor-pointer items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
											>Registrar Votos</button
										>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
{/if}

<!-- MODAL DE RESULTADOS (IDÉNTICO A LISTAMESAS) -->
{#if showModalResultados && mesaSeleccionada}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
	>
		<div class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
			<h3 class="mb-4 text-lg font-bold text-slate-800">
				Resultados Mesa {mesaSeleccionada.numero_mesa}
			</h3>
			<div class="space-y-4">
				<div>
					<label for="candidatoA" class="mb-1 block text-sm font-medium text-slate-700"
						>Votos Candidato A</label
					><input
						type="number"
						id="candidatoA"
						min="0"
						bind:value={votosA}
						class="block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm"
					/>
				</div>
				<div>
					<label for="candidatoB" class="mb-1 block text-sm font-medium text-slate-700"
						>Votos Candidato B</label
					><input
						type="number"
						id="candidatoB"
						min="0"
						bind:value={votosB}
						class="block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm"
					/>
				</div>
				<div>
					<label for="totalVotantes" class="mb-1 block text-sm font-medium text-slate-700"
						>Total de Votantes</label
					><input
						type="number"
						id="totalVotantes"
						min="0"
						bind:value={totalVotantes}
						class="block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm"
					/>
				</div>
			</div>
			<div class="mt-6 flex justify-end gap-3">
				<button
					type="button"
					onclick={() => {
						showModalResultados = false;
						mesaSeleccionada = null;
					}}
					class="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
					>Cancelar</button
				>
				<button
					type="button"
					onclick={guardarResultados}
					class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
					>Guardar</button
				>
			</div>
		</div>
	</div>
{/if}
