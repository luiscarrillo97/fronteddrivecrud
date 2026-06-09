<script lang="ts">
	let {
		dni,
		token,
		onViewPdf
	}: {
		dni: string;
		token: string;
		onViewPdf: (id: string, name: string) => void;
	} = $props();

	// Estados para las mesas del personero
	let mesas = $state<any[]>([]);
	let loading = $state(true);
	let errorMesas = $state('');

	// Estados para Registrar Votos
	let mesaSeleccionada = $state<any>(null);
	let showModalResultados = $state(false);
	let votosA = $state(0);
	let votosB = $state(0);
	let totalVotantes = $state(0);

	// Estados para UX al subir archivos
	let mesaSubiendo = $state<string | null>(null);
	let mensajeToast = $state<{ texto: string; tipo: 'exito' | 'error' } | null>(null);

	// Efecto para buscar las mesas
	$effect(() => {
		if (dni && token) {
			fetchMesas(dni, token);
		}
	});

	async function fetchMesas(dniUser: string, authToken: string) {
		try {
			const response = await fetch(
				`https://drivecrud-269414280318.europe-west1.run.app/usuarios/${dniUser}/mesas`,
				{
					headers: { Authorization: `Bearer ${authToken}` }
				}
			);

			if (response.ok) {
				mesas = await response.json();
			} else if (response.status === 404) {
				mesas = [];
			} else {
				errorMesas = 'Error al cargar las mesas asignadas.';
			}
		} catch (err) {
			console.error('Error crítico:', err);
			errorMesas = 'Error de conexión al cargar las mesas.';
		} finally {
			loading = false;
		}
	}
	async function subirPdf(numeroMesa: string | number, file: File) {
		if (!token) return;
		const numMesaStr = String(numeroMesa);
		mesaSubiendo = numMesaStr;

		const formData = new FormData();
		formData.append('file', file);
		formData.append('numeroMesa', numMesaStr);

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

				// 🔥 SOLUCIÓN: Modificamos el estado local instantáneamente en memoria
				mesas = mesas.map((m) =>
					String(m.numero_mesa ?? m.numeroMesa) === numMesaStr
						? {
								...m,
								archivo_drive_id: result.fileId,
								archivoDriveId: result.fileId,
								estado_mesa: 'CERRADA', // 👈 Cierre instantáneo
								estadoMesa: 'CERRADA'
							}
						: m
				);

				mensajeToast = { texto: 'Acta subida y mesa cerrada con éxito', tipo: 'exito' };
			} else {
				// 🛡️ CAPTURAMOS EL ERROR DEL SERVIDOR (Si ya estaba cerrada)
				const errData = await response.json();
				mensajeToast = { texto: errData.error || 'Error al subir el acta', tipo: 'error' };

				if (errData.error && errData.error.includes('CERRADA')) {
					fetchMesas(dni, token); // 👈 Solo usamos fetchMesas aquí
				}
			}
		} catch (error) {
			mensajeToast = { texto: 'Error de red al subir el acta', tipo: 'error' };
		} finally {
			mesaSubiendo = null;
			setTimeout(() => {
				mensajeToast = null;
			}, 4000);
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
					String(m.numero_mesa) === String(mesaSeleccionada.numero_mesa)
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
				mensajeToast = { texto: 'Resultados registrados con éxito', tipo: 'exito' };
			} else {
				// 🛡️ CAPTURAMOS EL ERROR DEL SERVIDOR (Si está cerrada)
				const errData = await response.json();
				mensajeToast = { texto: errData.error || 'Error al guardar', tipo: 'error' };

				if (errData.error && errData.error.includes('CERRADA')) {
					showModalResultados = false;
					fetchMesas(dni, token); // Refresca para mostrar el candado
				}
			}
		} catch (error) {
			console.error('Error al registrar votos:', error);
			mensajeToast = { texto: 'Error de conexión', tipo: 'error' };
		} finally {
			setTimeout(() => {
				mensajeToast = null;
			}, 4000);
		}
	}
</script>

{#if mensajeToast}
	<div
		class="fixed top-4 right-4 z-50 rounded-md px-4 py-3 font-semibold text-white shadow-lg transition-all duration-300"
		class:bg-emerald-500={mensajeToast.tipo === 'exito'}
		class:bg-red-500={mensajeToast.tipo === 'error'}
	>
		{mensajeToast.texto}
	</div>
{/if}

<div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
	<h2 class="mb-4 text-xl font-bold text-slate-800">Mis Mesas Asignadas</h2>

	{#if loading}
		<div class="flex justify-center p-8">
			<span class="text-sm font-medium text-slate-500">Cargando mesas...</span>
		</div>
	{:else if errorMesas}
		<div class="rounded-md bg-red-50 p-4 text-red-600">{errorMesas}</div>
	{:else if mesas.length === 0}
		<div class="rounded-md bg-blue-50 p-4 text-blue-700">
			Usted todavía no tiene mesas asignadas.
		</div>
	{:else}
		<div class="overflow-x-auto">
			<table class="w-full text-left text-sm text-slate-600">
				<thead class="bg-slate-100 text-xs text-slate-700 uppercase">
					<tr>
						<th class="px-4 py-3">Mesa</th>
						<th class="px-4 py-3">Local de Votación</th>
						<th class="px-4 py-3">Distrito</th>
						<th class="px-4 py-3 text-center">Votantes</th>
						<th class="px-4 py-3">Estado</th>
						<th class="px-4 py-3 text-center">ACTA / PDF</th>
						<th class="px-4 py-3 text-center">RESULTADOS</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-slate-200">
					{#each mesas as mesa (mesa.numero_mesa)}
						<tr class="hover:bg-slate-50">
							<td class="px-4 py-3 font-medium whitespace-nowrap text-slate-900"
								>{mesa.numero_mesa}</td
							>
							<td class="px-4 py-3">{mesa.local_votacion}</td>
							<td class="px-4 py-3">{mesa.distrito}</td>
							<td class="px-4 py-3 text-center">{mesa.numero_votantes}</td>

							<td class="px-4 py-3">
								<span
									class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
									class:bg-red-100={mesa.estado_mesa === 'CERRADA' ||
										mesa.estado_mesa === 'BLOQUEADA'}
									class:text-red-800={mesa.estado_mesa === 'CERRADA' ||
										mesa.estado_mesa === 'BLOQUEADA'}
									class:bg-slate-100={mesa.estado_mesa !== 'CERRADA' &&
										mesa.estado_mesa !== 'BLOQUEADA'}
									class:text-slate-700={mesa.estado_mesa !== 'CERRADA' &&
										mesa.estado_mesa !== 'BLOQUEADA'}
								>
									{mesa.estado_mesa || 'Pendiente'}
								</span>
							</td>

							<td class="px-4 py-3 text-center">
								<div class="flex flex-wrap items-center justify-center gap-2">
									{#if mesa.archivo_drive_id}
										<button
											type="button"
											onclick={() =>
												onViewPdf(mesa.archivo_drive_id, 'Acta Mesa ' + mesa.numero_mesa)}
											class="inline-flex cursor-pointer items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
											>Ver PDF</button
										>
									{/if}

									{#if mesa.estado_mesa !== 'CERRADA' && mesa.estado_mesa !== 'BLOQUEADA'}
										{#if mesaSubiendo === String(mesa.numero_mesa)}
											<button
												disabled
												class="inline-flex cursor-wait items-center justify-center rounded-md bg-slate-400 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
												>Espere...</button
											>
										{:else}
											<label
												class="inline-flex cursor-pointer items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 {mesa.archivo_drive_id
													? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
													: ''}"
											>
												{mesa.archivo_drive_id ? 'Reemplazar' : 'Subir PDF'}
												<input
													type="file"
													accept=".pdf"
													class="hidden"
													onchange={(e) => {
														const file = e.currentTarget.files?.[0];
														if (file) subirPdf(mesa.numero_mesa, file);
														e.currentTarget.value = '';
													}}
												/>
											</label>
										{/if}
									{/if}
								</div>
							</td>

							<td class="px-4 py-3 text-center">
								{#if mesa.estado_mesa === 'CERRADA' || mesa.estado_mesa === 'BLOQUEADA'}
									<span
										class="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600"
									>
										🔒 Cerrada
									</span>
								{:else if mesa.estado_mesa === 'PROCESADA'}
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
