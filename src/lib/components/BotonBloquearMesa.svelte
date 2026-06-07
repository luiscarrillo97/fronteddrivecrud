<script lang="ts">
	let {
		numeroMesa,
		token,
		estadoActual,
		onSuccess
	}: {
		numeroMesa: string;
		token: string;
		estadoActual: string;
		onSuccess: (numMesa: string) => void;
	} = $props();

	let procesando = $state(false);

	async function bloquearMesa() {
		// Validación de seguridad para evitar clics accidentales
		if (
			!confirm(
				`¿Estás seguro de BLOQUEAR la mesa ${numeroMesa}? Una vez bloqueada, ningún personero podrá editar sus votos ni subir actas.`
			)
		) {
			return;
		}

		procesando = true;

		try {
			const response = await fetch(
				'https://drivecrud-269414280318.europe-west1.run.app/mesas/bloquear',
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`
					},
					body: JSON.stringify({ numeroMesa: numeroMesa })
				}
			);

			if (response.ok) {
				// Notificamos al componente padre que la tabla debe actualizarse
				onSuccess(numeroMesa);
			} else {
				const data = await response.json().catch(() => ({}));
				alert(`Error al bloquear: ${data.error || 'Operación no permitida'}`);
			}
		} catch (error) {
			console.error('Error al bloquear la mesa:', error);
			alert('Error de conexión con el servidor.');
		} finally {
			procesando = false;
		}
	}
</script>

{#if estadoActual === 'BLOQUEADA'}
	<span
		class="inline-flex cursor-not-allowed items-center gap-1 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 shadow-sm"
	>
		🔒 Bloqueada
	</span>
{:else}
	<button
		type="button"
		onclick={bloquearMesa}
		disabled={procesando}
		class="inline-flex cursor-pointer items-center justify-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:cursor-wait disabled:bg-red-400"
	>
		{#if procesando}
			Procesando...
		{:else}
			🔒 Bloquear Mesa
		{/if}
	</button>
{/if}
