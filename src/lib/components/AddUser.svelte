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
</script>

<div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
	<h2 class="mb-4 text-xl font-extrabold text-slate-800">👤 Agregar Nuevo Usuario</h2>
	<form
		method="POST"
		action="?/createUser"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				// Se actualiza la UI y se limpian los campos si fue exitoso
				await update();
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
				<option value="USER">Usuario (USER)</option>
				<option value="ADMIN">Administrador (ADMIN)</option>
			</select>
		</div>
		<div>
			<label for="zona" class="mb-1 block text-sm font-medium text-slate-700">Zona</label>
			<input
				type="text"
				name="zona"
				id="zona"
				class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
			/>
		</div>
		<div>
			<label for="tipoPersonero" class="mb-1 block text-sm font-medium text-slate-700"
				>Tipo de Personero</label
			>
			<select
				name="tipoPersonero"
				id="tipoPersonero"
				class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
			>
				<option value="">Seleccione un tipo...</option>
				<option value="DEPARTAMENTO">Departamento</option>
				<option value="PROVINCIA">Provincia</option>
				<option value="DISTRITO">Distrito</option>
				<option value="LOCAL">Local</option>
				<option value="MESA">Mesa</option>
			</select>
		</div>
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
