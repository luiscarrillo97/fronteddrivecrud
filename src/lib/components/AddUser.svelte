<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props<{
		form: {
			action?: string;
			success?: boolean;
			error?: string;
			message?: string;
		} | null;
	}>();

	let loading = $state(false);

	// --- Lógica de Ubigeo ---
	interface Ubigeo {
		cod_ubigeo?: string;
		codUbigeo?: string; // Si el API usa camelCase
		CodUbigeo?: string; // Si el API usa PascalCase (C#)
		COD_UBIGEO?: string; // Si el API usa MAYÚSCULAS
		departamento: string;
		provincia: string;
		distrito: string;
	}

	let ubigeos = $state<Ubigeo[]>([]);
	let selectedDepartamento = $state('');
	let selectedProvincia = $state('');
	let selectedCodUbigeo = $state('');

	// --- Lógica de Locales ---
	let selectedTipoPersonero = $state('');
	let locales = $state<any[]>([]);
	let localSeleccionado = $state<number | null>(null);

	// Derivamos las listas filtradas y únicas
	let departamentos = $derived([...new Set(ubigeos.map((u) => u.departamento))].sort());
	let provincias = $derived(
		selectedDepartamento
			? [
					...new Set(
						ubigeos.filter((u) => u.departamento === selectedDepartamento).map((u) => u.provincia)
					)
				].sort()
			: []
	);
	let distritos = $derived(
		selectedProvincia
			? ubigeos
					.filter(
						(u) => u.departamento === selectedDepartamento && u.provincia === selectedProvincia
					)
					.sort((a, b) => a.distrito.localeCompare(b.distrito))
			: []
	);

	$effect(() => {
		fetch('https://drivecrud-269414280318.europe-west1.run.app/ubigeo')
			.then((res) => res.json())
			.then((data) => {
				// 🐛 DEBUG: Veamos exactamente cómo se llama la columna que manda C#
				console.log('=== ESTRUCTURA DE UBIGEO DESDE LA API ===', data[0]);
				ubigeos = data;
			})
			.catch((err) => console.error('Error cargando ubigeos:', err));
	});

	// Cargar locales dinámicamente si el ubigeo (distrito) tiene 6 dígitos
	$effect(() => {
		if (selectedCodUbigeo && selectedCodUbigeo.length === 6) {
			fetch(`https://drivecrud-269414280318.europe-west1.run.app/locales/${selectedCodUbigeo}`)
				.then((res) => res.json())
				.then((data) => {
					locales = data;
				})
				.catch((err) => console.error('Error cargando locales:', err));
		} else {
			locales = [];
			localSeleccionado = null;
		}
	});
</script>

<div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
	<h2 class="mb-4 text-xl font-extrabold text-slate-800">👤 Agregar Nuevo Usuario</h2>
	<form
		method="POST"
		action="?/createUser"
		use:enhance={({ formData }) => {
			// 🐛 MODO DEBUG: Imprimimos en la consola del navegador (F12) lo que se va a enviar
			console.log('=== DATOS ENVIADOS AL SERVIDOR ===');
			console.log('DNI:', formData.get('dni'));
			console.log('Nombres:', formData.get('nombres'));
			console.log('Rol:', formData.get('rol'));
			console.log('CodUbigeo (Oculto):', formData.get('codUbigeo'));
			console.log('Tipo Personero:', formData.get('tipoPersonero'));
			console.log('Id Local:', formData.get('idLocal'));
			console.log('Celular:', formData.get('celular'));
			console.log('==================================');

			loading = true;
			return async ({ result, update }) => {
				// update() procesa la respuesta del servidor (muestra mensajes de éxito/error)
				// Usamos { reset: false } para que SvelteKit no borre todo automáticamente
				await update({ reset: false });

				// ✨ MAGIA UX: Solo limpiamos los campos manualmente SI FUE EXITOSO
				if (result.type === 'success') {
					// Limpiamos los combos de Ubigeo
					selectedDepartamento = '';
					selectedProvincia = '';
					selectedCodUbigeo = '';
					selectedTipoPersonero = '';
					localSeleccionado = null;

					// Limpiamos los inputs normales (DNI, Nombres, etc.)
					const formElement = document.querySelector('form');
					if (formElement) formElement.reset();
				}

				loading = false;
			};
		}}
		class="grid gap-4 sm:grid-cols-2"
	>
		<div>
			<label for="dni" class="mb-1 block text-sm font-medium text-slate-700">DNI *</label>
			<input
				type="text"
				name="dni"
				id="dni"
				required
				class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
			/>
		</div>
		<div>
			<label for="nombres" class="mb-1 block text-sm font-medium text-slate-700">Nombres</label>
			<input
				type="text"
				name="nombres"
				id="nombres"
				class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
			/>
		</div>
		<div>
			<label for="contrasena" class="mb-1 block text-sm font-medium text-slate-700"
				>Contraseña *</label
			>
			<input
				type="password"
				name="contrasena"
				id="contrasena"
				required
				class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
			/>
		</div>
		<div>
			<label for="rol" class="mb-1 block text-sm font-medium text-slate-700">Rol</label>
			<select
				name="rol"
				id="rol"
				class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
			>
				<option value="PERSONERO">Personero (PERSONERO)</option>

				<option value="DEPARTAMENTAL">DEPARTAMENTAL (DEPARTAMENTAL)</option>
				<option value="PROVINCIAL">PROVINCIAL (PROVINCIA)</option>
				<option value="DISTRITAL">DISTRITAL (DISTRITAL)</option>
				<option value="LOCAL">LOCAL (LOCAL)</option>
				<option value="NACIONAL">NACIONAL (NACIONAL)</option>

				<option value="SOPORTE">SOPORTE TECNICO (SOPORTE)</option>
			</select>
		</div>

		<div
			class="grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:col-span-2 sm:grid-cols-3"
		>
			<div class="sm:col-span-3">
				<h3 class="text-sm font-semibold text-slate-700">Ubicación (Ubigeo)</h3>
			</div>
			<div>
				<label for="departamento" class="mb-1 block text-xs font-medium text-slate-600"
					>Departamento</label
				>
				<select
					id="departamento"
					bind:value={selectedDepartamento}
					onchange={() => {
						selectedProvincia = '';
						selectedCodUbigeo = '';
					}}
					class="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
				>
					<option value="">Seleccione...</option>
					{#each departamentos as depto (depto)}
						<option value={depto}>{depto}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="provincia" class="mb-1 block text-xs font-medium text-slate-600"
					>Provincia</label
				>
				<select
					id="provincia"
					bind:value={selectedProvincia}
					onchange={() => {
						selectedCodUbigeo = '';
					}}
					disabled={!selectedDepartamento}
					class="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:opacity-70"
				>
					<option value="">Seleccione...</option>
					{#each provincias as prov (prov)}
						<option value={prov}>{prov}</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="distrito" class="mb-1 block text-xs font-medium text-slate-600">Distrito</label>
				<select
					id="distrito"
					bind:value={selectedCodUbigeo}
					disabled={!selectedProvincia}
					class="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:opacity-70"
				>
					<option value="">Seleccione...</option>
					{#each distritos as dist (dist)}
						<option value={dist.cod_ubigeo || dist.codUbigeo || dist.CodUbigeo || dist.COD_UBIGEO}>
							{dist.distrito}
						</option>
					{/each}
				</select>
				<input type="hidden" name="codUbigeo" value={selectedCodUbigeo} required />
			</div>
		</div>
		<div>
			<label for="tipoPersonero" class="mb-1 block text-sm font-medium text-slate-700"
				>Tipo de Personero</label
			>
			<select
				name="tipoPersonero"
				id="tipoPersonero"
				bind:value={selectedTipoPersonero}
				class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
			>
				<option value="">Seleccione un tipo...</option>
				<option value="NACIONAL">Nacional</option>
				<option value="DEPARTAMENTO">Departamento</option>
				<option value="PROVINCIA">Provincia</option>
				<option value="DISTRITO">Distrito</option>
				<option value="LOCAL">Local</option>
				<option value="MESA">Mesa</option>
			</select>
		</div>

		{#if selectedTipoPersonero === 'LOCAL' && locales.length > 0}
			<div>
				<label for="idLocal" class="mb-1 block text-sm font-medium text-slate-700"
					>Local de Votación</label
				>
				<select
					name="idLocal"
					id="idLocal"
					bind:value={localSeleccionado}
					class="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
				>
					<option value="">Seleccione un local...</option>
					{#each locales as local (local.id_local)}
						<option value={local.id_local}>{local.nom_local}</option>
					{/each}
				</select>
			</div>
		{/if}

		<div>
			<label for="celular" class="mb-1 block text-sm font-medium text-slate-700">Celular</label>
			<input
				type="text"
				name="celular"
				id="celular"
				class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
			/>
		</div>

		<div class="pt-2 sm:col-span-2">
			<button
				type="submit"
				disabled={loading}
				class="flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:opacity-60 sm:w-auto"
			>
				{loading ? 'Guardando...' : 'Guardar Usuario'}
			</button>
		</div>
	</form>

	{#if form?.action === 'createUser'}
		{#if form.success}
			<div class="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700">
				✅ {form.message}
			</div>
		{:else if form.error}
			<div class="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
				❌ {form.error}
			</div>
		{/if}
	{/if}
</div>
