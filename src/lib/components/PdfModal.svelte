<script lang="ts">
	let {
		viewingFileId,
		modalName,
		onClose
	}: {
		viewingFileId: string | null;
		modalName: string;
		onClose: () => void;
	} = $props();
</script>

{#if viewingFileId}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
		role="dialog"
		aria-modal="true"
		aria-label="Visor de PDF"
	>
		<div class="flex h-[90vh] w-full max-w-5xl flex-col rounded-xl bg-white shadow-2xl">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-slate-200 px-5 py-3">
				<span class="truncate text-sm font-semibold text-slate-700">
					📄 {modalName}
				</span>
				<button
					onclick={onClose}
					class="rounded-lg px-3 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100"
				>
					✕ Cerrar
				</button>
			</div>

			<!-- Visor streaming directo -->
			<div class="flex-1 overflow-hidden rounded-b-xl">
				<iframe src="/api/{viewingFileId}" title={modalName} class="h-full w-full"></iframe>
			</div>
		</div>
	</div>
{/if}
