<script lang="ts">
	import { emptySong, loadSlides, slides, type Song } from '$lib/slides.js';
	import { Search } from '@lucide/svelte';
	import { onDestroy, onMount } from 'svelte';
	import { dndzone } from 'svelte-dnd-action';

	let songList: Song[] = $state([]);
	let playList: Song[] = $state([]);
	let currentSong: Song = $state(emptySong());
	let currentIndex: number = $state(0);
	let numberBuffer: string = $state('');
	let numberTimeout: number;
	const channel = new BroadcastChannel('presentation');
	let search: string = $state('');
	let previewUrl: string = $state('');

	const filteredList = $derived(
		search?.length > 0
			? songList.filter(
					(s: Song) =>
						s.title.toUpperCase().includes(search.toUpperCase()) ||
						(s.number != undefined &&
							s.number.toString().toUpperCase().includes(search.toUpperCase()))
				)
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

	onDestroy(() => {
		clearTimeout(numberTimeout);
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

	function showImage() {
		if (previewUrl != null && previewUrl.length > 0) {
			channel.postMessage({ type: 'image', extra: previewUrl });
		} else {
			console.warn('Picture was not uploaded');
		}
	}

	function addSong(song: Song) {
		if (!playList.includes(song)) {
			playList.push(song);
		}
	}

	function removeSong(song: Song) {
		if (playList.includes(song)) {
			playList.splice(playList.indexOf(song), 1);
		}
	}

	function resetTimer() {
		clearTimeout(numberTimeout);
		numberTimeout = setTimeout(() => {
			numberBuffer = '';
		}, 5000);
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
			case '0':
			case '1':
			case '2':
			case '3':
			case '4':
			case '5':
			case '6':
			case '7':
			case '8':
			case '9':
				numberBuffer += e;
				resetTimer();
				break;
			case 'Enter':
				if (numberBuffer === '') {
					channel.postMessage({ type: 'text', extra: '' });
				} else {
					currentSong =
						songList.find((item) => item.number === parseInt(numberBuffer)) ?? currentSong;
					showSlide(currentSong, 0);
				}
				numberBuffer = '';
				clearTimeout(numberTimeout);
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
		const tryFullscreen = () => {
			if (win && win.document) {
				win.focus();
				win.document.addEventListener('DOMContentLoaded', () => {
					const el = win.document.documentElement;
					if (el.requestFullscreen) {
						el.requestFullscreen();
					}
					console.log('DOM Loaded');
				});
			}
		};

		// // Run it soon after window opens
		//setTimeout(tryFullscreen, 100);
	}

	function onFileChange(event: Event) {
		const input = event.target as HTMLInputElement | null;
		if (!input || !input.files || input.files.length === 0) return;

		const f = input.files[0];
		const reader = new FileReader();

		reader.onload = () => {
			previewUrl = reader.result as string;
		};
		reader.readAsDataURL(f);
	}
</script>

<header class="flex justify-between">
	<h1>Control Panel</h1>
	<input type="file" accept="image/*" onchange={onFileChange} />
	<button onclick={showImage}>Show image</button>
	<h2>{numberBuffer}</h2>
</header>
<section><button onclick={openOnSecondScreen}>Open presentation Screen</button></section>
<main class="h-screen">
	<section class="flex max-h-2/3 py-4">
		<article class="w-full overflow-y-scroll">
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
								<td>{song.number != undefined ? song.number : ''}</td>
								<td>{song.title}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</article>
		<article class="w-full overflow-y-scroll">
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
								oncontextmenu={(e) => {
									e.preventDefault();
									removeSong(song);
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

	<section>
		Preview
		<div class="flex items-center justify-center gap-8">
			<p
				class="flex h-56 w-128 items-center justify-center border-2 border-white text-center whitespace-pre-wrap"
				style="font-size: 16px"
				ondblclick={() => showSlide(currentSong, currentIndex - 1)}
			>
				{currentSong.verses[currentIndex]}
			</p>
			<p
				class="flex h-56 w-128 items-center justify-center border-2 border-white text-center whitespace-pre-wrap"
				style="font-size: 16px"
				ondblclick={() => showSlide(currentSong, currentIndex + 1)}
			>
				{currentSong.verses[currentIndex + 1]}
			</p>
			<aside class="flex flex-col gap-2 overflow-scroll">
				{#each currentSong.verses as verse, i (i)}
					<p
						class="flex min-h-4 items-center justify-center border-2 p-2 text-center whitespace-pre-wrap {i ===
						currentIndex
							? 'border-yellow-400'
							: 'border-white'}"
						style="font-size: 8px;"
						ondblclick={() => showSlide(currentSong, i)}
					>
						{verse}
					</p>
				{/each}
			</aside>
		</div>
	</section>
</main>

<footer>Footer</footer>
<svelte:window on:keydown={(e) => onKeyDown(e.key)} />
