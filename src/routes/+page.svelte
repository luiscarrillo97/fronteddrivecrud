<script lang="ts">
	import Toast from '$lib/components/Toast.svelte';
	import PdfModal from '$lib/components/PdfModal.svelte';
	import UploadForm from '$lib/components/UploadForm.svelte';
	import FileTable from '$lib/components/FileTable.svelte';
	import Login from '$lib/components/Login.svelte';
	import AddUser from '$lib/components/AddUser.svelte';
	import RecoverPassword from '$lib/components/RecoverPassword.svelte';
	import AssignMesa from '$lib/components/AssignMesa.svelte';

	let { data, form } = $props<{
		data: {
			files: {
				id: string;
				nombre: string;
				tamano: number | null;
				fecha: string | null;
				link: string;
			}[];
			error?: string;
			loggedIn: boolean;
			role: string | null;
			token: string | null;
			dni: string | null;
		};
		form: {
			action?: string;
			success?: boolean;
			error?: string;
			message?: string;
			fileName?: string;
			usuario?: any;
			nuevaContrasena?: string;
		} | null;
	}>();

	let viewingFileId = $state<string | null>(null);
	let modalName = $state('');

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

	// Al montar el componente, fetch de mesas si NO es admin
	$effect(() => {
		if (data.loggedIn && data.role !== 'ADMIN' && data.token && data.dni) {
			fetchMesas(data.dni, data.token);
		}
	});

	async function fetchMesas(dni: string, token: string) {
		console.log('🔥 1. Iniciando petición para DNI:', dni);
		// console.log("🔥 Token que se enviará:", token); // Descomenta esto solo si dudas del token

		try {
			const response = await fetch(
				`https://drivecrud-269414280318.europe-west1.run.app/usuarios/${dni}/mesas`,
				{
					headers: { Authorization: `Bearer ${token}` }
				}
			);

			console.log('🔥 2. Status de respuesta de la API:', response.status);

			if (response.ok) {
				mesas = await response.json();
				console.log('🔥 3. Éxito. Datos recibidos y guardados en Svelte:', mesas);
			} else if (response.status === 404) {
				console.log('🔥 3. La API dice 404 (No se encontraron mesas para este DNI).');
				mesas = []; // Usuario sin mesas asignadas
			} else {
				console.log('🔥 3. Error en la API:', response.statusText);
				errorMesas = 'Error al cargar las mesas asignadas.';
			}
		} catch (err) {
			console.error('🔥 Error crítico de red o de código:', err);
			errorMesas = 'Error de conexión al cargar las mesas.';
		} finally {
			loading = false;
			console.log('🔥 4. Proceso terminado. Loading en false.');
		}
	}

	// ======================================================
	// SUBIR PDF A DRIVE Y ENLAZAR A LA MESA (Personero)
	// ======================================================
	async function subirPdf(numeroMesa: string, file: File) {
		if (!data.token) return;

		mesaSubiendo = numeroMesa;

		const formData = new FormData();
		formData.append('file', file);
		formData.append('numeroMesa', numeroMesa);

		try {
			console.log(`📤 Subiendo PDF para la mesa ${numeroMesa}...`);
			const response = await fetch(
				'https://drivecrud-269414280318.europe-west1.run.app/mesas/subir-pdf',
				{
					method: 'POST',
					headers: { Authorization: `Bearer ${data.token}` }, // NO content-type
					body: formData
				}
			);

			if (response.ok) {
				const result = await response.json();
				console.log('✅ Subida exitosa:', result);
				// Actualización reactiva (se re-renderizará la fila de la tabla automáticamente)
				mesas = mesas.map((m) =>
					m.numero_mesa === numeroMesa ? { ...m, archivo_drive_id: result.fileId } : m
				);
				mensajeToast = { texto: 'Guardado de acta exitoso', tipo: 'exito' };
			} else {
				console.error('❌ Error al subir el PDF:', await response.text());
				mensajeToast = { texto: 'Error al subir el acta', tipo: 'error' };
			}
		} catch (error) {
			console.error('❌ Error de red al subir PDF:', error);
			mensajeToast = { texto: 'Error de red al subir el acta', tipo: 'error' };
		} finally {
			mesaSubiendo = null;
			// Ocultar el mensaje después de 3 segundos
			setTimeout(() => {
				mensajeToast = null;
			}, 3000);
		}
	}

	// ======================================================
	// REGISTRAR VOTOS DEL ACTA (Personero)
	// ======================================================
	function abrirModalVotos(mesa: any) {
		mesaSeleccionada = mesa;
		votosA = mesa.candidato_a || 0;
		votosB = mesa.candidato_b || 0;
		totalVotantes = mesa.numero_votantes || 0;
		showModalResultados = true;
	}

	async function guardarResultados() {
		if (!data.token || !mesaSeleccionada) return;

		try {
			const response = await fetch(
				'https://drivecrud-269414280318.europe-west1.run.app/mesas/registrar-acta',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${data.token}`
					},
					body: JSON.stringify({
						numeroMesa: mesaSeleccionada.numero_mesa,
						candidatoA: votosA,
						candidatoB: votosB,
						numeroVotantes: totalVotantes
					})
				}
			);

			if (response.ok) {
				// Actualizar reactivamente
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
			console.error('❌ Error al registrar votos:', error);
		}
	}
</script>

{#if !data.loggedIn}
	<Login {form} />
{:else}
	<!-- ============================================== -->
	<!-- VISTA PRINCIPAL (CRUD DRIVE) -->
	<!-- ============================================== -->
	<main class="min-h-screen bg-slate-50 px-4 py-10 font-sans">
		<div class="mx-auto max-w-4xl space-y-8">
			<!-- Cabecera -->
			<div class="flex items-start justify-between">
				<div>
					<h1 class="text-3xl font-extrabold tracking-tight text-slate-800">
						📁 SISTEMA DE PERSONEROS
					</h1>
					<p class="mt-1 text-sm text-slate-500">
						Sube, visualiza, reemplaza y elimina archivos en Google Drive.
					</p>
				</div>
				<form method="POST" action="?/logout">
					<button
						type="submit"
						class="text-sm font-medium text-red-600 underline underline-offset-2 hover:text-red-800"
					>
						Cerrar Sesión
					</button>
				</form>
			</div>

			<!-- Toasts -->
			<Toast {form} dataError={data.error} />

			{#if mensajeToast}
				<div
					class="fixed top-4 right-4 z-50 rounded-md px-4 py-3 font-semibold text-white shadow-lg transition-all duration-300"
					class:bg-emerald-500={mensajeToast.tipo === 'exito'}
					class:bg-red-500={mensajeToast.tipo === 'error'}
				>
					{mensajeToast.texto}
				</div>
			{/if}

			{#if data.role === 'ADMIN'}
				<!-- ============================================== -->
				<!-- VISTA DE ADMINISTRADOR -->
				<!-- ============================================== -->
				<AddUser {form} />
				<RecoverPassword {form} />
				<AssignMesa {form} />

				<!-- Subir -->
				<UploadForm />

				<!-- Tabla -->
				<FileTable
					files={data.files}
					onView={(id, name) => {
						viewingFileId = id;
						modalName = name;
					}}
				/>
			{:else}
				<!-- ============================================== -->
				<!-- VISTA DE PERSONERO -->
				<!-- ============================================== -->
				<div class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
					<h2 class="mb-4 text-xl font-bold text-slate-800">Mis Mesas Asignadas</h2>

					{#if loading}
						<div class="flex justify-center p-8">
							<span class="text-sm font-medium text-slate-500">Cargando mesas...</span>
						</div>
					{:else if errorMesas}
						<div class="rounded-md bg-red-50 p-4 text-red-600">
							{errorMesas}
						</div>
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
													class="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700"
												>
													{mesa.estado_mesa || 'Pendiente'}
												</span>
											</td>
											<td class="px-4 py-3 text-center">
												{#if mesaSubiendo === mesa.numero_mesa}
													<button
														disabled
														class="inline-flex cursor-wait items-center justify-center rounded-md bg-slate-400 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
													>
														Espere, cargando acta...
													</button>
												{:else if !mesa.archivo_drive_id}
													<label
														class="inline-flex cursor-pointer items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
													>
														Subir PDF
														<input
															type="file"
															accept=".pdf"
															class="hidden"
															onchange={(e) => {
																const input = e.currentTarget;
																const file = input.files?.[0];
																if (file) subirPdf(mesa.numero_mesa, file);
																input.value = ''; // Resetea para permitir subir el mismo archivo consecutivamente si fuese necesario
															}}
														/>
													</label>
												{:else}
													<div class="flex flex-wrap items-center justify-center gap-2">
														<button
															type="button"
															onclick={() => {
																viewingFileId = mesa.archivo_drive_id;
																modalName = 'Acta Mesa ' + mesa.numero_mesa;
															}}
															class="inline-flex cursor-pointer items-center justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
														>
															Ver PDF
														</button>
														<label
															class="inline-flex cursor-pointer items-center justify-center rounded-md bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-300"
														>
															Reemplazar
															<input
																type="file"
																accept=".pdf"
																class="hidden"
																onchange={(e) => {
																	const input = e.currentTarget;
																	const file = input.files?.[0];
																	if (file) subirPdf(mesa.numero_mesa, file);
																	input.value = '';
																}}
															/>
														</label>
													</div>
												{/if}
											</td>
											<td class="px-4 py-3 text-center">
												{#if mesa.estado_mesa === 'PROCESADA'}
													<button
														type="button"
														onclick={() => abrirModalVotos(mesa)}
														class="inline-flex cursor-pointer items-center justify-center rounded-md bg-green-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
													>
														Ver / Editar Votos
													</button>
												{:else}
													<button
														type="button"
														onclick={() => abrirModalVotos(mesa)}
														class="inline-flex cursor-pointer items-center justify-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
													>
														Registrar Votos
													</button>
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
		</div>
	</main>

	<!-- Modal PDF -->
	<PdfModal
		{viewingFileId}
		{modalName}
		onClose={() => {
			viewingFileId = null;
			modalName = '';
		}}
	/>

	<!-- Modal de Resultados -->
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
						>
						<input
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
						>
						<input
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
						>
						<input
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
					>
						Cancelar
					</button>
					<button
						type="button"
						onclick={guardarResultados}
						class="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
					>
						Guardar
					</button>
				</div>
			</div>
		</div>
	{/if}
{/if}
