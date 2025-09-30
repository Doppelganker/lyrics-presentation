<script lang="ts">
	import { onMount } from 'svelte';

	let displayText = $state('');
	let previewUrl = $state('');
	let fontSize = $state(64);
	const channel = new BroadcastChannel('presentation');

	onMount(() => {
		channel.onmessage = (e) => {
			console.log(e);
			const { type, extra } = e.data;

			if (type === 'text') {
				displayText = extra;
				previewUrl = '';
			} else if (type === 'size') {
				if (extra) {
					if (fontSize < 100) fontSize++;
				} else {
					if (fontSize > 8) fontSize--;
				}
			} else if (type === 'image') {
				previewUrl = extra;
			}
		};
	});
</script>

<div class="flex h-screen items-center justify-center">
	{#if previewUrl}
		<img
			src={previewUrl}
			alt="Uploaded preview"
			class="h-auto max-h-full w-auto max-w-full portrait:w-full landscape:h-full"
		/>
	{:else}
		<p class={['text-center', 'whitespace-pre-wrap']} style={`font-size: ${fontSize}px`}>
			{displayText}
		</p>
	{/if}
</div>

<svelte:window
	on:keydown|preventDefault={(e) => channel.postMessage({ type: 'key', extra: e.key })}
/>
