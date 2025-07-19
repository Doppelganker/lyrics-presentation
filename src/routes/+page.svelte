<script lang="ts">
	import { emptySong, loadSlides, slides, type Song } from '$lib/slides.js';
	import { Search } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import { dndzone } from 'svelte-dnd-action';

	let songList: Song[] = $state([]);
	let playList: Song[] = $state([]);
	let currentSong: Song = $state(emptySong());
	let currentIndex: number = $state(0);
	const channel = new BroadcastChannel('presentation');
	let search: string = $state('');

	const filteredList = $derived(
		search?.length > 0
			? songList.filter((s: Song) => s.title.toUpperCase().includes(search.toUpperCase()))
			: songList
	);

	onMount(async () => {
		await loadSlides();
		slides.subscribe((value) => (songList = value));
		channel.onmessage = (e) => {
			const { type, extra } = e.data;

			if (type === 'key') {
				onKeyDown(extra);
			}
		};
	});

	function showSlide(song: Song, index: number) {
		if (index < 0) {
			let i = playList.indexOf(song);
			if (i > 0) {
				currentSong = playList[i - 1];
				currentIndex = currentSong.verses.length - 1;
			}
		} else if (song.verses.length > index) {
			currentSong = song;
			currentIndex = index;
		} else {
			let i = playList.indexOf(song);
			if (i < playList.length - 1) {
				currentSong = playList[i + 1];
				currentIndex = 0;
			}
		}
		channel.postMessage({ type: 'text', extra: currentSong.verses[currentIndex] });
	}

	function addSong(song: Song) {
		if (!playList.includes(song)) {
			playList.push(song);
		}
	}

	function onKeyDown(e: string) {
		switch (e) {
			case 'ArrowLeft':
				showSlide(currentSong, currentIndex - 1);
				break;
			case '+':
				channel.postMessage({ type: 'size', extra: true });
				break;
			case '-':
				channel.postMessage({ type: 'size', extra: false });
				break;
			case 'ArrowRight':
				showSlide(currentSong, currentIndex + 1);
				break;
		}
	}

	function openOnSecondScreen() {
		// Try to find a secondary screen (if available)
		const screenX = window.screenX;
		const screenY = window.screenY;

		const width = window.screen.availWidth;
		const height = window.screen.availHeight;

		const options = `left=${screenX},top=${screenY},width=${width},height=${height}`;

		const win = window.open('/presentation', 'presentationWindow', options);

		// todo https://github.com/mdn/dom-examples/blob/main/window-management-api/index.js

		// Focus and optionally fullscreen once loaded
		// const tryFullscreen = () => {
		// 	if (win && win.document) {
		// 		win.focus();
		// 		win.document.addEventListener('DOMContentLoaded', () => {
		// 			const el = win.document.documentElement;
		// 			if (el.requestFullscreen) {
		// 				el.requestFullscreen();
		// 			}
		// 			console.log('DOM Loaded');
		// 		});
		// 	}
		// };

		// // Run it soon after window opens
		// setTimeout(tryFullscreen, 100);
	}
</script>

<header>
	<h1>Control Panel</h1>
</header>
<section><button onclick={openOnSecondScreen}>Open presentation Screen</button></section>

<section class="flex max-h-96 py-4">
	<article class="w-full overflow-scroll">
		<div class="input-group grid-cols-[auto_1fr_auto]">
			<div class="ig-cell preset-tonal"><Search size={16} /></div>
			<input class="ig-input" type="search" bind:value={search} />
		</div>
		<div class="table-wrap">
			<table class="table">
				<tbody class="[&>tr]:hover:preset-tonal-primary">
					{#each filteredList as song, i (i)}
						<tr
							ondblclick={() => {
								addSong(song);
							}}
						>
							<td>{song.id > 0 ? song.id : ''}</td>
							<td>{song.title}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</article>
	<article class="w-full overflow-scroll">
		<div class="table-wrap">
			<table class="table">
				<tbody
					class="[&>tr]:hover:preset-tonal-primary"
					use:dndzone={{ items: playList, flipDurationMs: 150 }}
					onconsider={(e) => (playList = e.detail.items)}
					onfinalize={(e) => (playList = e.detail.items)}
				>
					{#each playList as song (song.id)}
						<tr
							class={song === currentSong ? 'preset-tonal-secondary' : ''}
							ondblclick={() => {
								showSlide(song, 0);
							}}
						>
							<td>{song.title}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</article>
</section>

<section>Preview</section>

<footer>Footer</footer>

<svelte:window on:keydown={(e) => onKeyDown(e.key)} />
