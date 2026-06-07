<script lang="ts">
	import Toast from '$lib/components/Toast.svelte';
	import PdfModal from '$lib/components/PdfModal.svelte';
	import Login from '$lib/components/Login.svelte';
	import ListaMesas from '$lib/components/ListaMesas.svelte';
	import PanelAdministrativo from '$lib/components/PanelAdministrativo.svelte';

	let { data, form } = $props<{
		data: {
			files: {
				id: string;
				nombre: string;
				tamano: number | null;
				fecha: string | null;
				link: string;
			}[];
			error?: string;
			loggedIn: boolean;
			role: string | null;
			token: string | null;
			dni: string | null;
		};
		form: {
			action?: string;
			success?: boolean;
			error?: string;
			message?: string;
			fileName?: string;
			usuario?: any;
			nuevaContrasena?: string;
		} | null;
	}>();

	let viewingFileId = $state<string | null>(null);
	let modalName = $state('');
</script>

{#if !data.loggedIn}
	<Login {form} />
{:else}
	<!-- ============================================== -->
	<!-- VISTA PRINCIPAL (CRUD DRIVE) -->
	<!-- ============================================== -->
	<main class="min-h-screen bg-slate-50 px-4 py-10 font-sans">
		<div class="mx-auto max-w-4xl space-y-8">
			<!-- Cabecera -->
			<div class="flex items-start justify-between">
				<div>
					<h1 class="text-3xl font-extrabold tracking-tight text-slate-800">
						📁 SISTEMA DE PERSONEROS
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

			<!-- Toasts Globales: Muestra mensajes de éxito o error que vienen del servidor -->
			<Toast {form} dataError={data.error} />

			<!-- ENRUTAMIENTO POR ROLES: Decide qué componente cargar -->
			{#if data.role === 'ADMIN'}
				<PanelAdministrativo
					{form}
					files={data.files}
					onViewPdf={(id, name) => {
						// Abre el modal de PDF a pedido del Administrador
						viewingFileId = id;
						modalName = name;
					}}
				/>
			{:else}
				<!-- ============================================== -->
				<!-- VISTA DE PERSONERO -->
				<!-- ============================================== -->
				{#if data.dni && data.token}
					<ListaMesas
						dni={data.dni}
						token={data.token}
						onViewPdf={(id, name) => {
							// Abre el modal de PDF a pedido del Personero
							viewingFileId = id;
							modalName = name;
						}}
					/>
				{/if}
			{/if}
		</div>
	</main>

	<!-- Modal PDF Compartido: Se deja aquí en la raíz para que ambos componentes (Admin/Personero) puedan usarlo sin duplicar código -->
	<PdfModal
		{viewingFileId}
		{modalName}
		onClose={() => {
			viewingFileId = null;
			modalName = '';
		}}
	/>
{/if}
