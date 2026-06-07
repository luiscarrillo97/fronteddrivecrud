<script lang="ts">
	let {
		token,
		codUbigeo,
		rolUsuario = '',
		idLocalUsuario = null,
		onViewPdf
	}: {
		token: string;
		codUbigeo: string;
		rolUsuario?: string;
		idLocalUsuario?: string | number | null;
		onViewPdf: (id: string, name: string) => void;
	} = $props();

	// 🌟 ESTADOS PARA EL FILTRO INTELIGENTE
	let localesRaw = $state<any[]>([]); // Guarda TODOS los locales que devuelve la API
	let selectedDistrito = $state<string>(''); // Distrito seleccionado en el nuevo filtro
	let selectedLocal = $state<string | number>(''); // Colegio seleccionado
	let cargandoLocales = $state(false);

	// 🌟 MAGIA REACTIVA: Extrae distritos únicos automáticamente
	let distritosDisponibles = $derived.by(() => {
		const distritos = localesRaw.map((l) => l.distrito || l.Distrito).filter(Boolean);
		return [...new Set(distritos)].sort(); // Quita duplicados y ordena alfabéticamente
	});

	// 🌟 MAGIA REACTIVA: Filtra locales según el distrito
	let localesFiltrados = $derived.by(() => {
		if (!selectedDistrito) return localesRaw;
		return localesRaw.filter((l) => (l.distrito || l.Distrito) === selectedDistrito);
	});

	let mesas = $state<any[]>([]);
	let loadingMesas = $state(false);
	let errorMesas = $state('');

	let mesaSeleccionada = $state<any>(null);
	let showModalResultados = $state(false);
	let votosA = $state(0);
	let votosB = $state(0);
	let totalVotantes = $state(0);
	let mesaSubiendo = $state<string | null>(null);
	let mensajeToast = $state<{ texto: string; tipo: 'exito' | 'error' } | null>(null);

	// 1. INICIO Y FILTRO DE UBIGEO
	$effect(() => {
		if (rolUsuario === 'LOCAL' && idLocalUsuario) {
			selectedLocal = idLocalUsuario;
		} else if (codUbigeo) {
			cargarLocales(codUbigeo);
		}
	});

	async function cargarLocales(ubigeoRaw: string) {
		cargandoLocales = true;
		try {
			let prefijoUbigeo = ubigeoRaw; // Por defecto usa los 6 (Distrital)

			// Cortamos el ubigeo según el nivel de acceso
			if (rolUsuario === 'DEPARTAMENTAL' && ubigeoRaw.length >= 2) {
				prefijoUbigeo = ubigeoRaw.substring(0, 2);
			} else if (rolUsuario === 'PROVINCIAL' && ubigeoRaw.length >= 4) {
				prefijoUbigeo = ubigeoRaw.substring(0, 4);
			}

			const response = await fetch(
				`https://drivecrud-269414280318.europe-west1.run.app/locales/${prefijoUbigeo}`
			);
			if (response.ok) {
				localesRaw = await response.json(); // Guardamos en localesRaw
			} else {
				localesRaw = [];
			}
		} catch (err) {
			localesRaw = [];
		} finally {
			cargandoLocales = false;
		}
	}

	// 2. CARGAR MESAS POR LOCAL
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
			const response = await fetch(
				`https://drivecrud-269414280318.europe-west1.run.app/locales/${idLocal}/mesas`,
				{ headers: { Authorization: `Bearer ${authToken}` } }
			);
			if (response.ok) {
				mesas = await response.json();
			} else if (response.status === 404) {
				mesas = [];
			} else {
				errorMesas = `Error del servidor: código ${response.status}`;
			}
		} catch (err) {
			errorMesas = 'Error de conexión al cargar las mesas.';
		} finally {
			loadingMesas = false;
		}
	}

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
					m.numeroMesa === numeroMesa ? { ...m, archivoDriveId: result.fileId } : m
				);
				mensajeToast = { texto: 'Guardado de acta exitoso', tipo: 'exito' };
			} else {
				mensajeToast = { texto: 'Error al subir el acta', tipo: 'error' };
			}
		} catch (error) {
			mensajeToast = { texto: 'Error de red al subir el acta', tipo: 'error' };
		} finally {
			mesaSubiendo = null;
			setTimeout(() => (mensajeToast = null), 3000);
		}
	}

	function abrirModalVotos(mesa: any) {
		mesaSeleccionada = mesa;
		votosA = mesa.candidatoA || mesa.candidato_a || 0;
		votosB = mesa.candidatoB || mesa.candidato_b || 0;
		totalVotantes = mesa.numeroVotantes || mesa.numero_votantes || 0;
		showModalResultados = true;
	}

	async function guardarResultados() {
		if (!token || !mesaSeleccionada) return;

		try {
			const response = await fetch(
				'https://drivecrud-269414280318.europe-west1.run.app/mesas/registrar-acta',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`
					},
					body: JSON.stringify({
						numeroMesa: mesaSeleccionada.numeroMesa ?? mesaSeleccionada.numero_mesa,
						candidatoA: votosA,
						candidatoB: votosB,
						numeroVotantes: totalVotantes
					})
				}
			);

			if (response.ok) {
				mesas = mesas.map((m) =>
					(m.numeroMesa ?? m.numero_mesa) ===
					(mesaSeleccionada.numeroMesa ?? mesaSeleccionada.numero_mesa)
						? {
								...m,
								candidatoA: votosA,
								candidatoB: votosB,
								numeroVotantes: totalVotantes,
								estadoMesa: 'PROCESADA'
							}
						: m
				);

				showModalResultados = false;
				mesaSeleccionada = null;
				mensajeToast = { texto: 'Resultados registrados con éxito', tipo: 'exito' };
			} else {
				throw new Error('Error en el servidor al guardar.');
			}
		} catch (error) {
			console.error('Error al registrar votos:', error);
			mensajeToast = { texto: 'Error al registrar votos', tipo: 'error' };
		} finally {
			setTimeout(() => (mensajeToast = null), 3000);
		}
	}
</script>

{#if mensajeToast}
	<div
		class="fixed top-4 right-4 z-50 rounded-md px-4 py-3 font-semibold text-white shadow-lg transition-all"
		class:bg-emerald-500={mensajeToast.tipo === 'exito'}
		class:bg-red-500={mensajeToast.tipo === 'error'}
	>
		{mensajeToast.texto}
	</div>
{/if}

{#if rolUsuario !== 'LOCAL'}
	<div class="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-xl font-bold text-slate-800">Panel Operativo Zonal</h2>

		<div class="grid gap-4 md:grid-cols-2">
			{#if distritosDisponibles.length > 1}
				<div>
					<label for="distritoSelect" class="mb-1 block text-sm font-medium text-slate-700">
						1. Filtrar por Distrito
					</label>
					<select
						id="distritoSelect"
						bind:value={selectedDistrito}
						disabled={cargandoLocales}
						onchange={() => (selectedLocal = '')}
						class="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
					>
						<option value="">-- Todos los distritos --</option>
						{#each distritosDisponibles as distrito, i (distrito || i)}
							<option value={distrito}>{distrito}</option>
						{/each}
					</select>
				</div>
			{/if}

			<div>
				<label for="localSelect" class="mb-1 block text-sm font-medium text-slate-700">
					{distritosDisponibles.length > 1
						? '2. Seleccione un Local'
						: 'Seleccione un Local de Votación'}
				</label>
				<select
					id="localSelect"
					bind:value={selectedLocal}
					disabled={cargandoLocales || localesFiltrados.length === 0}
					class="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
				>
					<option value="">-- Elija un colegio --</option>

					{#each localesFiltrados as local, i (local.id_local || local.idLocal || local.IdLocal || i)}
						<option value={local.id_local || local.idLocal || local.IdLocal}>
							{local.nom_local || local.nomLocal || local.NomLocal}
						</option>
					{/each}
				</select>
			</div>
		</div>
	</div>
{/if}

{#if selectedLocal}
	<div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-xl font-bold text-slate-800">
			{#if rolUsuario === 'LOCAL' && mesas.length > 0}
				Mi Local Asignado: {mesas[0].LocalVotacion ??
					mesas[0].localVotacion ??
					mesas[0].local_votacion ??
					'Colegio'}
			{:else if rolUsuario === 'LOCAL'}
				Mesas de Mi Local Asignado
			{:else}
				Mesas Operativas del Local
			{/if}
		</h2>

		{#if loadingMesas}
			<div class="flex justify-center p-8">
				<span class="animate-pulse text-sm font-medium text-slate-500"
					>Consultando mesas con la base de datos...</span
				>
			</div>
		{:else if errorMesas}
			<div class="rounded-md bg-red-50 p-4 text-red-600">{errorMesas}</div>
		{:else if mesas.length === 0}
			<div class="rounded-md border border-amber-200 bg-amber-50 p-4 font-medium text-amber-700">
				No hay mesas registradas en este local de votación.
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-left text-sm text-slate-600">
					<thead class="bg-slate-100 text-xs text-slate-700 uppercase">
						<tr>
							<th class="px-4 py-3">Mesa</th>
							<th class="px-4 py-3 text-center">Votantes</th>
							<th class="px-4 py-3">Estado</th>
							<th class="px-4 py-3 text-center">ACTA / PDF</th>
							<th class="px-4 py-3 text-center">RESULTADOS</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-200">
						{#each mesas as mesa (mesa.numeroMesa ?? mesa.numero_mesa)}
							<tr class="hover:bg-slate-50">
								<td class="px-4 py-3 font-bold whitespace-nowrap text-slate-900"
									>{mesa.numeroMesa ?? mesa.numero_mesa}</td
								>
								<td class="px-4 py-3 text-center"
									>{mesa.numeroVotantes ?? mesa.numero_votantes ?? 0}</td
								>
								<td class="px-4 py-3">
									<span
										class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
										class:bg-red-100={(mesa.estadoMesa ?? mesa.estado_mesa) === 'BLOQUEADA'}
										class:text-red-800={(mesa.estadoMesa ?? mesa.estado_mesa) === 'BLOQUEADA'}
										class:bg-slate-200={(mesa.estadoMesa ?? mesa.estado_mesa) !== 'BLOQUEADA'}
										class:text-slate-700={(mesa.estadoMesa ?? mesa.estado_mesa) !== 'BLOQUEADA'}
									>
										{mesa.estadoMesa ?? mesa.estado_mesa ?? 'Pendiente'}
									</span>
								</td>

								<td class="px-4 py-3 text-center">
									<div class="flex flex-wrap items-center justify-center gap-2">
										{#if mesa.archivoDriveId ?? mesa.archivo_drive_id}
											<button
												type="button"
												onclick={() =>
													onViewPdf(
														mesa.archivoDriveId ?? mesa.archivo_drive_id,
														'Acta Mesa ' + (mesa.numeroMesa ?? mesa.numero_mesa)
													)}
												class="inline-flex cursor-pointer items-center rounded-md bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
												>Ver PDF</button
											>
										{/if}

										{#if (mesa.estadoMesa ?? mesa.estado_mesa) !== 'BLOQUEADA'}
											{#if mesaSubiendo === (mesa.numeroMesa ?? mesa.numero_mesa)}
												<button
													disabled
													class="inline-flex cursor-wait items-center rounded-md bg-slate-400 px-3 py-1 text-xs font-semibold text-white"
													>Espere...</button
												>
											{:else}
												<label
													class="hover:bg-opacity-80 inline-flex cursor-pointer items-center rounded-md px-3 py-1 text-xs font-semibold {(mesa.archivoDriveId ??
													mesa.archivo_drive_id)
														? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
														: 'bg-blue-600 text-white hover:bg-blue-700'}"
												>
													{(mesa.archivoDriveId ?? mesa.archivo_drive_id)
														? 'Reemplazar'
														: 'Subir PDF'}
													<input
														type="file"
														accept=".pdf"
														class="hidden"
														onchange={(e) => {
															const f = e.currentTarget.files?.[0];
															if (f) subirPdf(mesa.numeroMesa ?? mesa.numero_mesa, f);
															e.currentTarget.value = '';
														}}
													/>
												</label>
											{/if}
										{/if}
									</div>
								</td>

								<td class="px-4 py-3 text-center">
									{#if (mesa.estadoMesa ?? mesa.estado_mesa) === 'BLOQUEADA'}
										<span class="text-xs font-bold text-slate-400">🔒 Solo Lectura</span>
									{:else if (mesa.estadoMesa ?? mesa.estado_mesa) === 'PROCESADA'}
										<button
											type="button"
											onclick={() => abrirModalVotos(mesa)}
											class="inline-flex cursor-pointer items-center rounded-md bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
											>Ver / Editar Votos</button
										>
									{:else}
										<button
											type="button"
											onclick={() => abrirModalVotos(mesa)}
											class="inline-flex cursor-pointer items-center rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700"
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

{#if showModalResultados && mesaSeleccionada}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
	>
		<div class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
			<h3 class="mb-4 text-lg font-bold text-slate-800">
				Resultados Mesa {mesaSeleccionada.numeroMesa ?? mesaSeleccionada.numero_mesa}
			</h3>
			<div class="space-y-4">
				<div>
					<label class="mb-1 block text-sm font-medium">Votos Candidato A</label>
					<input
						type="number"
						bind:value={votosA}
						class="block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium">Votos Candidato B</label>
					<input
						type="number"
						bind:value={votosB}
						class="block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm font-medium">Total de Votantes</label>
					<input
						type="number"
						bind:value={totalVotantes}
						class="block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
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
					class="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
					>Cancelar</button
				>
				<button
					type="button"
					onclick={guardarResultados}
					class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
					>Guardar</button
				>
			</div>
		</div>
	</div>
{/if}
