<script lang="ts">
	import { fade, scale } from 'svelte/transition';

	let { viewingFileId, modalName, token, onClose } = $props<{
		viewingFileId: string | null;
		modalName: string;
		token: string | null;
		onClose: () => void;
	}>();

	let canvasElement = $state<HTMLCanvasElement | null>(null);
	let cargando = $state(false);
	let errorMsg = $state('');

	// Función que carga el motor de PDF.js desde CDN solo cuando es necesario
	async function cargarPdfJsLib() {
		if ((window as any).pdfjsLib) return (window as any).pdfjsLib;

		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
			script.onload = () => {
				const lib = (window as any).pdfjsLib;
				lib.GlobalWorkerOptions.workerSrc =
					'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
				resolve(lib);
			};
			script.onerror = () => reject('No se pudo cargar el motor del visor.');
			document.head.appendChild(script);
		});
	}

	// Efecto: Cuando el modal se abre y tenemos el token, renderiza
	$effect(() => {
		if (viewingFileId && token && canvasElement) {
			// Usamos setTimeout para asegurar que el DOM esté listo y el canvasElement exista
			setTimeout(() => renderizarPdfSeguro(viewingFileId!, token!), 100);
		}
	});

	async function renderizarPdfSeguro(fileId: string, authToken: string) {
		cargando = true;
		errorMsg = '';

		try {
			const pdfjsLib = await cargarPdfJsLib();

			const response = await fetch(
				`https://drivecrud-269414280318.europe-west1.run.app/mesas/pdf/${fileId}`,
				{
					headers: { Authorization: `Bearer ${authToken}` }
				}
			);

			if (!response.ok) throw new Error('No tiene permisos para ver este archivo o no existe.');

			const blob = await response.blob();
			const objectUrl = URL.createObjectURL(blob);

			const loadingTask = pdfjsLib.getDocument(objectUrl);
			const pdf = await loadingTask.promise;

			const page = await pdf.getPage(1);

			if (!canvasElement) return;

			const contenedorAncho = canvasElement.parentElement?.clientWidth || 350;
			const viewportOriginal = page.getViewport({ scale: 1 });
			const escalaOptima = contenedorAncho / viewportOriginal.width;
			const viewport = page.getViewport({ scale: escalaOptima * 0.95 });

			const context = canvasElement.getContext('2d');
			if (context) {
				canvasElement.height = viewport.height;
				canvasElement.width = viewport.width;

				const renderContext = {
					canvasContext: context,
					viewport: viewport
				};
				await page.render(renderContext).promise;
			}

			URL.revokeObjectURL(objectUrl);
		} catch (err: any) {
			console.error('Error al procesar el acta segura:', err);
			errorMsg = err.message || 'Error crítico al renderizar el documento.';
		} finally {
			cargando = false;
		}
	}
</script>

{#if viewingFileId}
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 p-2 backdrop-blur-sm sm:p-4"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
			transition:scale={{ duration: 200, start: 0.95 }}
		>
			<div
				class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3"
			>
				<div class="flex items-center gap-2">
					<span class="text-lg">🛡️</span>
					<h3 class="line-clamp-1 font-bold text-slate-800">{modalName} (Vista Protegida)</h3>
				</div>
				<button
					type="button"
					onclick={onClose}
					class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-100"
				>
					✕ Cerrar
				</button>
			</div>

			<div class="relative flex flex-1 items-start justify-center overflow-y-auto bg-slate-700 p-4">
				{#if cargando}
					<div
						class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-800 text-white"
					>
						<div
							class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
						></div>
						<span class="text-sm font-medium">Validando credenciales y descargando acta...</span>
					</div>
				{/if}

				{#if errorMsg}
					<div
						class="m-auto max-w-md rounded-md border border-red-500 bg-red-900/50 p-4 text-center text-red-200"
					>
						<p class="font-bold">Error de Acceso</p>
						<p class="mt-1 text-sm">{errorMsg}</p>
					</div>
				{/if}

				<canvas
					bind:this={canvasElement}
					class="rounded-sm bg-white shadow-lg"
					class:hidden={cargando || errorMsg}
				></canvas>
			</div>
		</div>
	</div>
{/if}
