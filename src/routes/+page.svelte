<script lang="ts">
	import Toast from '$lib/components/Toast.svelte';
	import Login from '$lib/components/Login.svelte';
	import PanelOperativo from '$lib/components/PanelOperativo.svelte';
	import PanelGerencial from '$lib/components/PanelGerencial.svelte';

	let { data, form } = $props<{
		data: {
			files: any[];
			error?: string;
			loggedIn: boolean;
			role: string | null;
			token: string | null;
			dni: string | null;
		};
		form: any;
	}>();

	let rol = $derived(data.role);
	let isOperativo = $derived(rol === 'PERSONERO' || rol === 'LOCAL');
	let isGerencial = $derived(
		rol
			? ['DISTRITAL', 'PROVINCIAL', 'DEPARTAMENTAL', 'NACIONAL', 'ADMIN', 'SOPORTE'].includes(rol)
			: false
	);
</script>

{#if !data.loggedIn}
	<Login {form} />
{:else}
	<!-- ============================================== -->
	<!-- VISTA PRINCIPAL (CRUD DRIVE) -->
	<!-- ============================================== -->
	<main class="min-h-screen bg-slate-50 px-4 py-10 font-sans">
		<div class="mx-auto max-w-5xl space-y-8">
			<!-- Cabecera -->
			<div class="flex items-start justify-between">
				<div>
					<h1 class="text-3xl font-extrabold tracking-tight text-slate-800">
						📁 SISTEMA DE PERSONEROS v2
					</h1>
					<p class="mt-1 text-sm text-slate-500">
						Sube, visualiza, reemplaza y elimina archivos en Google Drive.
					</p>
				</div>
				<form method="POST" action="?/logout">
					<button
						type="submit"
						class="text-sm font-medium text-red-600 underline underline-offset-2 hover:text-red-800"
					>
						Cerrar Sesión
					</button>
				</form>
			</div>

			<!-- Toasts -->
			<Toast {form} dataError={data.error} />

			{#if isOperativo && data.token && data.dni && rol}
				<PanelOperativo rolUsuario={rol} dni={data.dni} token={data.token} />
			{:else if isGerencial && data.token && rol}
				<PanelGerencial rolUsuario={rol} token={data.token} />
			{:else}
				<div class="rounded-md bg-red-50 p-4 text-red-600">
					Rol no reconocido o sin permisos suficientes ({rol}).
				</div>
			{/if}
		</div>
	</main>
{/if}
