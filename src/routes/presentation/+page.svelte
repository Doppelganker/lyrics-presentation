<script lang="ts">
	import { onMount } from 'svelte';

	let displayText = $state('');
	let fontSize = $state(64);
	const channel = new BroadcastChannel('presentation');

	onMount(() => {
		channel.onmessage = (e) => {
			console.log(e);
			const { type, extra } = e.data;

			if (type === 'text') {
				displayText = extra;
			} else if (type === 'size') {
				if (extra) {
					if (fontSize < 100) fontSize++;
				} else {
					if (fontSize > 8) fontSize--;
				}
			}
		};
	});
</script>

<div class="flex h-screen items-center justify-center">
	<p class={['text-center', 'whitespace-pre-wrap']} style={`font-size: ${fontSize}px`}>
		{displayText}
	</p>
</div>

<svelte:window
	on:keydown|preventDefault={(e) => channel.postMessage({ type: 'key', extra: e.key })}
/>
