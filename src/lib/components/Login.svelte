<script lang="ts">
	let {
		form
	}: {
		form: any;
	} = $props();
</script>

<main class="flex min-h-screen items-center justify-center bg-slate-50 px-4 font-sans">
	<div class="w-full max-w-md rounded-xl border border-slate-100 bg-white p-8 shadow-md">
		<h2 class="mb-6 text-center text-2xl font-extrabold text-slate-800">Iniciar Sesión</h2>
		<form method="POST" action="?/login" class="space-y-4">
			<div>
				<label for="dni" class="block text-sm font-medium text-slate-700">DNI</label>
				<input
					type="text"
					id="dni"
					name="dni"
					placeholder="Tu número de DNI"
					class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
					required
				/>
			</div>
			<div>
				<label for="contrasena" class="block text-sm font-medium text-slate-700">Contraseña</label>
				<input
					type="password"
					id="contrasena"
					name="contrasena"
					placeholder="••••••••"
					class="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
					required
				/>
			</div>
			<button
				type="submit"
				class="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
			>
				Ingresar
			</button>
		</form>
		{#if form?.error && form?.action === 'login'}
			<p class="mt-4 text-center text-sm text-red-500">{form.error}</p>
		{/if}
	</div>
</main>
