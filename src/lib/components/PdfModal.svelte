<script lang="ts">
	import { fade, scale } from 'svelte/transition';

	let { viewingFileId, modalName, onClose } = $props<{
		viewingFileId: string | null;
		modalName: string;
		onClose: () => void;
	}>();

	// Estado para saber si estamos en celular
	let isMobile = $state(false);

	// 1. Detectamos el tamaño de la pantalla
	$effect(() => {
		if (typeof window !== 'undefined') {
			// Si el ancho es menor a 768px, asumimos que es un dispositivo móvil
			isMobile = window.innerWidth < 768;

			const handleResize = () => {
				isMobile = window.innerWidth < 768;
			};
			window.addEventListener('resize', handleResize);
			return () => window.removeEventListener('resize', handleResize);
		}
	});

	// 2. Lógica Inteligente para la URL del Iframe
	let iframeUrl = $derived.by(() => {
		if (!viewingFileId) return '';

		if (isMobile) {
			// MODO CELULAR: Usamos el visor nativo de Google Docs (transforma el PDF a web)
			const directDownloadLink = `https://drive.google.com/uc?export=download&id=${viewingFileId}`;
			return `https://docs.google.com/gview?url=${encodeURIComponent(directDownloadLink)}&embedded=true`;
		} else {
			// MODO PC: Usamos el preview clásico de Google Drive (el de la barra negra)
			return `https://drive.google.com/file/d/${viewingFileId}/preview`;
		}
	});
</script>

{#if viewingFileId}
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 p-2 backdrop-blur-sm sm:p-4"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="flex h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<div
				class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3"
			>
				<div class="flex items-center gap-2">
					<span class="text-lg">📄</span>
					<h3 class="line-clamp-1 font-bold text-slate-800">{modalName}</h3>
				</div>
				<button
					type="button"
					onclick={onClose}
					class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-100"
				>
					✕ Cerrar
				</button>
			</div>

			<div class="relative h-full w-full flex-1 bg-slate-200">
				<iframe
					src={iframeUrl}
					title="Visor de PDF"
					class="absolute inset-0 h-full w-full border-none"
					allow="autoplay"
				></iframe>
			</div>
		</div>
	</div>
{/if}
