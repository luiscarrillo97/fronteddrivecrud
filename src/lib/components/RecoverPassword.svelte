<script lang="ts">
	import { enhance } from '$app/forms';

	let { form } = $props<{
		form: {
			action?: string;
			success?: boolean;
			error?: string;
			message?: string;
			nuevaContrasena?: string;
		} | null;
	}>();

	let loading = $state(false);
</script>

<div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
	<h2 class="mb-2 text-xl font-extrabold text-slate-800">🔑 Generar Contraseña Temporal</h2>
	<p class="mb-4 text-sm text-slate-500">
		Restablece la contraseña de un usuario validando su DNI y su número de celular.
	</p>

	<form
		method="POST"
		action="?/recoverPassword"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				await update();
				loading = false;
			};
		}}
		class="grid gap-4 sm:grid-cols-2"
	>
		<div>
			<label for="recover-dni" class="mb-1 block text-sm font-medium text-slate-700"
				>DNI del Usuario *</label
			>
			<input
				type="text"
				name="dni"
				id="recover-dni"
				required
				class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-amber-500 focus:outline-none"
			/>
		</div>
		<div>
			<label for="recover-celular" class="mb-1 block text-sm font-medium text-slate-700"
				>Celular Registrado *</label
			>
			<input
				type="text"
				name="celular"
				id="recover-celular"
				required
				class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-amber-500 focus:outline-none"
			/>
		</div>

		<div class="pt-2 sm:col-span-2">
			<button
				type="submit"
				disabled={loading}
				class="flex w-full justify-center rounded-md border border-transparent bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:outline-none disabled:opacity-60 sm:w-auto"
			>
				{loading ? 'Generando...' : 'Generar Contraseña'}
			</button>
		</div>
	</form>

	{#if form?.action === 'recoverPassword'}
		{#if form.success}
			<div class="mt-4 rounded-md border border-green-200 bg-green-50 p-4 text-green-800">
				<p class="text-sm font-bold">✅ {form.message}</p>
				<div class="mt-3 flex items-center gap-2">
					<span class="text-sm">Nueva contraseña temporal:</span>
					<span
						class="rounded border border-green-300 bg-white px-3 py-1 font-mono text-lg font-bold tracking-widest select-all"
						>{form.nuevaContrasena}</span
					>
				</div>
				<p class="mt-2 text-xs opacity-80">
					Copia y entrega esta contraseña al usuario. Deberá cambiarla al iniciar sesión.
				</p>
			</div>
		{:else if form.error}
			<div class="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
				❌ {form.error}
			</div>
		{/if}
	{/if}
</div>
