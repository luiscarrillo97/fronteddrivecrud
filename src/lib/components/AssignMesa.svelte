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
	<h2 class="mb-2 text-xl font-extrabold text-slate-800">🪑 Asignar Mesa a Personero</h2>
	<p class="mb-4 text-sm text-slate-500">
		Asigna un número de mesa a un personero utilizando su DNI.
	</p>

	<form
		method="POST"
		action="?/assignMesa"
		use:enhance={() => {
			loading = true;
			return async ({ result, update }) => {
				await update({ reset: false });
				if (result.type === 'success') {
					// Limpiar formulario solo si hay éxito
					const formElement = document.querySelector('#form-assign-mesa') as HTMLFormElement;
					if (formElement) formElement.reset();
				}
				loading = false;
			};
		}}
		id="form-assign-mesa"
		class="grid gap-4 sm:grid-cols-2"
	>
		<div>
			<label for="dniPersonero" class="mb-1 block text-sm font-medium text-slate-700"
				>DNI del Personero *</label
			>
			<input
				type="text"
				name="dniPersonero"
				id="dniPersonero"
				required
				class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
			/>
		</div>
		<div>
			<label for="numeroMesa" class="mb-1 block text-sm font-medium text-slate-700"
				>Número de Mesa *</label
			>
			<input
				type="text"
				name="numeroMesa"
				id="numeroMesa"
				required
				class="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
			/>
		</div>

		<div class="pt-2 sm:col-span-2">
			<button
				type="submit"
				disabled={loading}
				class="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:opacity-60 sm:w-auto"
			>
				{loading ? 'Asignando...' : 'Asignar Mesa'}
			</button>
		</div>
	</form>

	{#if form?.action === 'assignMesa'}
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