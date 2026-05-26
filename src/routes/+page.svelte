<script lang="ts">
	import type { PageData } from './$types';

	// En Svelte 5 usamos la rune $props() para cachar los datos que vienen del servidor
	let { data }: { data: PageData } = $props();
</script>

<main class="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-4 text-white">
	<div
		class="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-950 p-8 text-center shadow-2xl"
	>
		<h1
			class="mb-2 bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent"
		>
			¡API Conectada!
		</h1>

		<p
			class="my-6 inline-block rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xl font-medium text-emerald-400"
		>
			{data.mensajeBackend}
		</p>

		<div class="mt-2 block">
			<div
				class="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-orange-400"
			>
				<span class="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
				SvelteKit 5 + .NET 10 API
			</div>
		</div>
	</div>
</main>
