<script lang="ts">
	import Toast from '$lib/components/Toast.svelte';
	import PdfModal from '$lib/components/PdfModal.svelte';
	import Login from '$lib/components/Login.svelte';
	import ListaMesas from '$lib/components/ListaMesas.svelte';
	import PanelAdministrativo from '$lib/components/PanelAdministrativo.svelte';
	// 🌟 IMPORTAMOS EL NUEVO COMPONENTE ZONAL 🌟
	import ListaMesasZonal from '$lib/components/ListaMesasZonal.svelte';

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

	let viewingFileId = $state<string | null>(null);
	let modalName = $state('');

	// 🌟 LECTOR DE TOKEN ANTIBALAS 🌟
	// Extrae el codUbigeo y el idLocal ocultos dentro del Token de forma segura
	let datosUsuario = $derived.by(() => {
		if (!data.token) return {};
		try {
			const base64Url = data.token.split('.')[1];
			const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
			return JSON.parse(atob(base64));
		} catch (e) {
			return {};
		}
	});

	// 🚨 EL DETECTOR DE MENTIRAS (Revisa F12 -> Consola) 🚨
	$effect(() => {
		if (data.loggedIn) {
			console.log('=== ENRUTADOR PRINCIPAL ===');
			console.log('1. Rol Principal:', data.role);
			console.log('2. DNI:', data.dni);
			console.log('3. CodUbigeo (Del Token):', datosUsuario?.CodUbigeo);
			console.log('4. IdLocal (Del Token):', datosUsuario?.IdLocal);
			console.log('===========================');
		}
	});
</script>

{#if !data.loggedIn}
	<Login {form} />
{:else}
	<main class="min-h-screen bg-slate-50 px-4 py-10 font-sans">
		<div class="mx-auto max-w-4xl space-y-8">
			<div class="flex items-start justify-between">
				<div>
					<h1 class="text-3xl font-extrabold tracking-tight text-slate-800">
						📁 SISTEMA DE PERSONEROS
					</h1>
					<p class="mt-1 text-sm text-slate-500">Plataforma de Control y Gestión Electoral</p>
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

			<Toast {form} dataError={data.error} />

			{#if data.role === 'ADMIN' || data.role === 'NACIONAL' || data.role === 'SOPORTE'}
				<PanelAdministrativo
					{form}
					files={data.files}
					onViewPdf={(id, name) => {
						viewingFileId = id;
						modalName = name;
					}}
				/>
			{:else if ['DEPARTAMENTAL', 'PROVINCIAL', 'DISTRITAL', 'LOCAL'].includes(data.role || '')}
				{#if data.token}
					<ListaMesasZonal
						token={data.token}
						codUbigeo={datosUsuario?.CodUbigeo || ''}
						onViewPdf={(id, name) => {
							viewingFileId = id;
							modalName = name;
						}}
					/>
				{/if}
			{:else if data.role === 'PERSONERO'}
				{#if data.dni && data.token}
					<ListaMesas
						dni={data.dni}
						token={data.token}
						onViewPdf={(id, name) => {
							viewingFileId = id;
							modalName = name;
						}}
					/>
				{/if}
			{:else}
				<div class="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-600">
					<h2 class="text-lg font-bold">Acceso Restringido</h2>
					<p>Su usuario no tiene un rol válido asignado. Contacte a soporte.</p>
				</div>
			{/if}
		</div>
	</main>

	<PdfModal
		{viewingFileId}
		{modalName}
		onClose={() => {
			viewingFileId = null;
			modalName = '';
		}}
	/>
{/if}
