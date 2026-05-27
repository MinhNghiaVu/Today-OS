/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />
/// <reference types="@sveltejs/kit" />

import { base, build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const cacheName = `today-os-${version}`;
const offlinePath = `${base}/offline.html`;
const assetPaths = new Set([...build, ...files]);

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(cacheName).then((cache) => {
			return cache.addAll([...assetPaths]);
		})
	);
	sw.skipWaiting();
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		Promise.all([
			caches.keys().then((keys) => {
				return Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key)));
			}),
			sw.clients.claim()
		])
	);
});

sw.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);
	if (url.origin !== sw.location.origin) return;

	if (assetPaths.has(url.pathname)) {
		event.respondWith(cacheAsset(event.request, url.pathname));
		return;
	}

	if (event.request.mode === 'navigate') {
		event.respondWith(networkOrOffline(event.request));
	}
});

async function cacheAsset(request: Request, pathname: string): Promise<Response> {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(pathname);
	return cached ?? fetch(request);
}

async function networkOrOffline(request: Request): Promise<Response> {
	try {
		return await fetch(request);
	} catch {
		const cached = await caches.match(offlinePath);
		return (
			cached ??
			new Response('Today OS is offline. Reconnect and try again.', {
				status: 503,
				headers: { 'content-type': 'text/plain; charset=utf-8' }
			})
		);
	}
}
