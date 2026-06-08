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

	// 🌟 ESTADOS PARA EL FILTRO EN CASCADA (MODO NACIONAL INCLUIDO)
	let localesRaw = $state<any[]>([]);
	let selectedDepartamento = $state<string>('');
	let selectedProvincia = $state<string>('');
	let selectedDistrito = $state<string>('');
	let selectedLocal = $state<string | number>('');
	let cargandoLocales = $state(false);

	// 🌟 MAGIA 0: Extrae Departamentos Únicos
	let departamentosDisponibles = $derived.by(() => {
		const deptos = localesRaw
			.map((l) => {
				const d = l.departamento || l.Departamento || l.DEPARTAMENTO;
				return d ? d.toString().trim().toUpperCase() : null;
			})
			.filter(Boolean);
		return [...new Set(deptos)].sort();
	});

	// 🌟 MAGIA 1: Extrae Provincias (Filtradas por Departamento)
	let provinciasDisponibles = $derived.by(() => {
		let filtrados = localesRaw;
		if (selectedDepartamento) {
			filtrados = filtrados.filter((l) => {
				const d = l.departamento || l.Departamento || l.DEPARTAMENTO || '';
				return d.toString().trim().toUpperCase() === selectedDepartamento;
			});
		}
		const provincias = filtrados
			.map((l) => {
				const p = l.provincia || l.Provincia || l.PROVINCIA;
				return p ? p.toString().trim().toUpperCase() : null;
			})
			.filter(Boolean);
		return [...new Set(provincias)].sort();
	});

	// 🌟 MAGIA 2: Extrae Distritos (Filtrados por Depto y Provincia)
	let distritosDisponibles = $derived.by(() => {
		let filtrados = localesRaw;
		if (selectedDepartamento) {
			filtrados = filtrados.filter(
				(l) =>
					(l.departamento || l.Departamento || l.DEPARTAMENTO || '')
						.toString()
						.trim()
						.toUpperCase() === selectedDepartamento
			);
		}
		if (selectedProvincia) {
			filtrados = filtrados.filter(
				(l) =>
					(l.provincia || l.Provincia || l.PROVINCIA || '').toString().trim().toUpperCase() ===
					selectedProvincia
			);
		}

		const distritos = filtrados
			.map((l) => {
				const d = l.distrito || l.Distrito || l.DISTRITO;
				return d ? d.toString().trim().toUpperCase() : null;
			})
			.filter(Boolean);
		return [...new Set(distritos)].sort();
	});

	// 🌟 MAGIA 3: Filtra Locales
	let localesFiltrados = $derived.by(() => {
		let filtrados = localesRaw;
		if (selectedDepartamento) {
			filtrados = filtrados.filter(
				(l) =>
					(l.departamento || l.Departamento || l.DEPARTAMENTO || '')
						.toString()
						.trim()
						.toUpperCase() === selectedDepartamento
			);
		}
		if (selectedProvincia) {
			filtrados = filtrados.filter(
				(l) =>
					(l.provincia || l.Provincia || l.PROVINCIA || '').toString().trim().toUpperCase() ===
					selectedProvincia
			);
		}
		if (selectedDistrito) {
			filtrados = filtrados.filter(
				(l) =>
					(l.distrito || l.Distrito || l.DISTRITO || '').toString().trim().toUpperCase() ===
					selectedDistrito
			);
		}
		return filtrados;
	});

	// 🌟 NUEVO EFECTO: Limpia el colegio al cambiar de distrito de forma segura
	$effect(() => {
		if (selectedDistrito !== undefined) {
			selectedLocal = '';
		}
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

	// 🌟 ESTADOS PARA EL MODAL DEL OJITO (PERSONEROS)
	let showModalPersoneros = $state(false);
	let personerosAsignados = $state<any[]>([]);
	let loadingPersoneros = $state(false);
	let mesaPersonerosSeleccionada = $state<string>('');

	// 1. INICIO Y FILTRO DE UBIGEO
	$effect(() => {
		if (rolUsuario === 'LOCAL' && idLocalUsuario) {
			selectedLocal = idLocalUsuario;
		} else if (codUbigeo || rolUsuario === 'NACIONAL' || rolUsuario === 'ADMIN') {
			cargarLocales(codUbigeo || '');
		}
	});

	async function cargarLocales(ubigeoRaw: string) {
		cargandoLocales = true;
		try {
			let prefijoUbigeo = ubigeoRaw;

			// 🌟 LÓGICA DE ROLES (INCLUYE NACIONAL = TODOS)
			if (rolUsuario === 'NACIONAL' || rolUsuario === 'ADMIN') {
				prefijoUbigeo = 'TODOS';
			} else if (rolUsuario === 'DEPARTAMENTAL' && ubigeoRaw.length >= 2) {
				prefijoUbigeo = ubigeoRaw.substring(0, 2);
			} else if (rolUsuario === 'PROVINCIAL' && ubigeoRaw.length >= 4) {
				prefijoUbigeo = ubigeoRaw.substring(0, 4);
			} else if (!prefijoUbigeo) {
				prefijoUbigeo = 'TODOS';
			}

			const response = await fetch(
				`https://drivecrud-269414280318.europe-west1.run.app/locales/zonal/${prefijoUbigeo}`
			);
			if (response.ok) {
				localesRaw = await response.json();
			} else {
				localesRaw = [];
			}
		} catch (err) {
			localesRaw = [];
		} finally {
			cargandoLocales = false;
		}
	}

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
			if (response.ok) mesas = await response.json();
			else if (response.status === 404) mesas = [];
			else errorMesas = `Error del servidor: código ${response.status}`;
		} catch (err) {
			errorMesas = 'Error de conexión al cargar las mesas.';
		} finally {
			loadingMesas = false;
		}
	}

	// 🌟 FUNCIÓN PARA ABRIR EL OJITO Y BUSCAR AL PERSONERO
	async function verPersoneros(numeroMesa: string | number) {
		if (!token) return;
		mesaPersonerosSeleccionada = String(numeroMesa);
		showModalPersoneros = true;
		loadingPersoneros = true;
		personerosAsignados = [];

		try {
			const response = await fetch(
				`https://drivecrud-269414280318.europe-west1.run.app/mesas/${mesaPersonerosSeleccionada}/personeros`,
				{ headers: { Authorization: `Bearer ${token}` } }
			);
			if (response.ok) {
				personerosAsignados = await response.json();
			}
		} catch (error) {
			console.error('Error al cargar personeros:', error);
		} finally {
			loadingPersoneros = false;
		}
	}

	// 🌟 FIX: Forzamos numeroMesa como string para igualdades perfectas
	async function subirPdf(numeroMesa: string | number, file: File) {
		if (!token) return;
		const numMesaStr = String(numeroMesa); // Blindaje de tipo
		mesaSubiendo = numMesaStr;

		const formData = new FormData();
		formData.append('file', file);
		formData.append('numeroMesa', numMesaStr);

		try {
			const response = await fetch(
				'https://drivecrud-269414280318.europe-west1.run.app/mesas/subir-pdf',
				{ method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData }
			);

			if (response.ok) {
				const result = await response.json();

				// 🌟 CORRECCIÓN AQUÍ: String() en ambos lados asegura que la mesa se encuentre
				mesas = mesas.map((m) =>
					String(m.numeroMesa ?? m.numero_mesa) === numMesaStr
						? {
								...m,
								archivoDriveId: result.fileId,
								archivo_drive_id: result.fileId
							}
						: m
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
		votosA = mesa.candidatoA ?? mesa.candidato_a ?? 0;
		votosB = mesa.candidatoB ?? mesa.candidato_b ?? 0;
		totalVotantes = mesa.numeroVotantes ?? mesa.numero_votantes ?? 0;
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
				// 🌟 FIX: String() para blindar el mapeo de resultados
				mesas = mesas.map((m) =>
					String(m.numeroMesa ?? m.numero_mesa) ===
					String(mesaSeleccionada.numeroMesa ?? mesaSeleccionada.numero_mesa)
						? {
								...m,
								candidatoA: votosA,
								candidato_a: votosA,
								candidatoB: votosB,
								candidato_b: votosB,
								numeroVotantes: totalVotantes,
								numero_votantes: totalVotantes,
								estadoMesa: 'PROCESADA',
								estado_mesa: 'PROCESADA'
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
	// 🌟 FUNCIÓN ADMIN: BLOQUEAR / DESBLOQUEAR MESA
	async function toggleBloqueo(mesa: any) {
		if (!token) return;

		const numMesaStr = String(mesa.numeroMesa ?? mesa.numero_mesa);
		const estaBloqueada = (mesa.estadoMesa ?? mesa.estado_mesa) === 'BLOQUEADA';
		const endpoint = estaBloqueada ? 'desbloquear' : 'bloquear';
		const nuevoEstado = estaBloqueada ? 'PENDIENTE' : 'BLOQUEADA';

		// Opcional: Confirmación antes de bloquear
		if (
			!estaBloqueada &&
			!confirm(
				`¿Estás seguro de que deseas BLOQUEAR la mesa ${numMesaStr}? Ningún personero podrá subir actas ni registrar votos.`
			)
		) {
			return;
		}

		try {
			const response = await fetch(
				`https://drivecrud-269414280318.europe-west1.run.app/mesas/${endpoint}`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`
					},
					body: JSON.stringify({ numeroMesa: numMesaStr })
				}
			);

			if (response.ok) {
				// Actualizamos la memoria al instante
				mesas = mesas.map((m) =>
					String(m.numeroMesa ?? m.numero_mesa) === numMesaStr
						? {
								...m,
								estadoMesa: nuevoEstado,
								estado_mesa: nuevoEstado
							}
						: m
				);

				mensajeToast = {
					texto: `Mesa ${estaBloqueada ? 'desbloqueada' : 'bloqueada'} con éxito`,
					tipo: 'exito'
				};
			} else {
				mensajeToast = { texto: 'Error al cambiar el estado de la mesa', tipo: 'error' };
			}
		} catch (error) {
			mensajeToast = { texto: 'Error de conexión', tipo: 'error' };
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

		<div
			class="grid gap-4 {departamentosDisponibles.length > 1
				? 'md:grid-cols-2 lg:grid-cols-4'
				: provinciasDisponibles.length > 1
					? 'md:grid-cols-3'
					: 'md:grid-cols-2'}"
		>
			{#if departamentosDisponibles.length > 1}
				<div>
					<label for="deptoSelect" class="mb-1 block text-sm font-medium text-slate-700">
						1. Departamento
					</label>
					<select
						id="deptoSelect"
						bind:value={selectedDepartamento}
						disabled={cargandoLocales}
						onchange={() => {
							selectedProvincia = '';
							selectedDistrito = '';
							selectedLocal = '';
						}}
						class="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
					>
						<option value="">-- Todos --</option>
						{#each departamentosDisponibles as depto, i (i)}
							<option value={depto}>{depto}</option>
						{/each}
					</select>
				</div>
			{/if}

			{#if provinciasDisponibles.length > 1}
				<div>
					<label for="provinciaSelect" class="mb-1 block text-sm font-medium text-slate-700">
						{departamentosDisponibles.length > 1 ? '2. Provincia' : '1. Provincia'}
					</label>
					<select
						id="provinciaSelect"
						bind:value={selectedProvincia}
						disabled={cargandoLocales ||
							(departamentosDisponibles.length > 1 && !selectedDepartamento)}
						onchange={() => {
							selectedDistrito = '';
							selectedLocal = '';
						}}
						class="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
					>
						<option value="">-- Todas --</option>
						{#each provinciasDisponibles as provincia, i (i)}
							<option value={provincia}>{provincia}</option>
						{/each}
					</select>
				</div>
			{/if}

			{#if distritosDisponibles.length > 1}
				<div>
					<label for="distritoSelect" class="mb-1 block text-sm font-medium text-slate-700">
						{departamentosDisponibles.length > 1
							? '3. Distrito'
							: provinciasDisponibles.length > 1
								? '2. Distrito'
								: '1. Distrito'}
					</label>
					<select
						id="distritoSelect"
						bind:value={selectedDistrito}
						disabled={cargandoLocales || (provinciasDisponibles.length > 1 && !selectedProvincia)}
						onchange={() => (selectedLocal = '')}
						class="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
					>
						<option value="">-- Todos --</option>
						{#each distritosDisponibles as distrito, i (i)}
							<option value={distrito}>{distrito}</option>
						{/each}
					</select>
				</div>
			{/if}

			<div>
				<label for="localSelect" class="mb-1 block text-sm font-medium text-slate-700">
					Local de Votación
				</label>
				<select
					id="localSelect"
					bind:value={selectedLocal}
					disabled={cargandoLocales || localesFiltrados.length === 0}
					class="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
				>
					<option value="">-- Elija un colegio --</option>
					{#each localesFiltrados as local, i (i)}
						<option value={local.id_local || local.idLocal || local.IdLocal || local.ID_LOCAL}>
							{local.nom_local ||
								local.nomLocal ||
								local.NomLocal ||
								local.NOM_LOCAL ||
								'Colegio sin nombre'}
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
							<th class="px-4 py-3 text-center">Personeros</th>
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

								<td class="px-4 py-3 text-center">
									{#if (mesa.cantidad_personeros ?? mesa.cantidadPersoneros ?? 0) > 0}
										<div class="flex items-center justify-center gap-2">
											<span
												class="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800"
											>
												1 Asignado
											</span>
											<button
												type="button"
												onclick={() => verPersoneros(mesa.numeroMesa ?? mesa.numero_mesa)}
												class="rounded-full bg-blue-50 p-1.5 text-blue-600 transition-colors hover:bg-blue-100 hover:text-blue-800"
												title="Ver datos del personero"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													stroke-width="2"
													stroke="currentColor"
													class="h-4 w-4"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
													/>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
													/>
												</svg>
											</button>
										</div>
									{:else}
										<span
											class="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800"
										>
											0 Asignados
										</span>
									{/if}
								</td>

								<td class="px-4 py-3">
									<div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
										<span
											class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
											class:bg-red-100={(mesa.estadoMesa ?? mesa.estado_mesa) === 'BLOQUEADA'}
											class:text-red-800={(mesa.estadoMesa ?? mesa.estado_mesa) === 'BLOQUEADA'}
											class:bg-slate-200={(mesa.estadoMesa ?? mesa.estado_mesa) !== 'BLOQUEADA'}
											class:text-slate-700={(mesa.estadoMesa ?? mesa.estado_mesa) !== 'BLOQUEADA'}
										>
											{mesa.estadoMesa ?? mesa.estado_mesa ?? 'Pendiente'}
										</span>

										{#if (mesa.estadoMesa ?? mesa.estado_mesa) === 'BLOQUEADA'}
											<button
												type="button"
												onclick={() => toggleBloqueo(mesa)}
												class="inline-flex cursor-pointer items-center rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-100"
												title="Desbloquear mesa"
											>
												🔓 Desbloquear
											</button>
										{:else}
											<button
												type="button"
												onclick={() => toggleBloqueo(mesa)}
												class="inline-flex cursor-pointer items-center rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
												title="Bloquear mesa"
											>
												🔒 Bloquear
											</button>
										{/if}
									</div>
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
											{#if mesaSubiendo === String(mesa.numeroMesa ?? mesa.numero_mesa)}
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

{#if showModalPersoneros}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-all"
	>
		<div class="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
			<div class="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
				<h3 class="text-lg font-bold text-slate-800">
					👤 Personero Mesa {mesaPersonerosSeleccionada}
				</h3>
			</div>

			<div class="min-h-[80px]">
				{#if loadingPersoneros}
					<div class="flex items-center justify-center py-4">
						<span class="animate-pulse text-sm font-medium text-slate-500">Buscando datos...</span>
					</div>
				{:else if personerosAsignados.length === 0}
					<div class="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
						No se encontraron los datos de este personero.
					</div>
				{:else}
					<ul class="divide-y divide-slate-100">
						{#each personerosAsignados as personero (personero.Dni ?? personero.dni)}
							<li class="py-3">
								<p class="text-sm font-semibold text-slate-800">
									{personero.Nombres ?? personero.nombres}
								</p>
								<p class="text-xs text-slate-500">
									DNI: {personero.Dni ?? personero.dni}
								</p>
							</li>
						{/each}
					</ul>
				{/if}
			</div>

			<div class="mt-4 flex justify-end pt-2">
				<button
					type="button"
					onclick={() => (showModalPersoneros = false)}
					class="rounded-md bg-slate-800 px-5 py-2 text-sm font-medium text-white hover:bg-slate-700"
				>
					Cerrar
				</button>
			</div>
		</div>
	</div>
{/if}
