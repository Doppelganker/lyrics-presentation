import { writable } from 'svelte/store';

export type Song = {
	title: string;
	id: number;
	number: number | undefined;
	tags: string[];
	verses: string[];
};

export function emptySong(): Song {
	return {
		title: 'empty',
		id: 0,
		number: undefined,
		tags: [],
		verses: []
	};
}

export const slides = writable<Song[]>([]);

export async function loadSlides() {
	const res = await fetch(
		'https://opensheet.elk.sh/1qHf0cKXCIM3eUZMZsoGmXTIT2NWQ8KztYaC_YFNst2o/Besedila'
	);
	const data = await res.json();
	const x = data as Array<{ [key: string]: string }>;

	let i = 1;
	const parsed = x.map((row) => {
		const verses = Object.keys(row)
			.filter((k) => /^\d+$/.test(k))
			.sort((a, b) => +a - +b)
			.map((k) => row[k]);

		return {
			id: i++,
			title: row['Naslov'] || 'Untitled',
			number: parseInt(row['Številka']) || undefined,
			tags: ['song'],
			verses: ['', ...verses]
		};
	});

	slides.set(parsed);
}
