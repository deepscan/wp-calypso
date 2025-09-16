import config from '@automattic/calypso-config';
import {
	type MountDescriptor,
	type PlaygroundClient,
	startPlaygroundWeb,
} from '@wp-playground/client';
import { logToLogstash } from 'calypso/lib/logstash';
import { getBlueprint } from './blueprint';

const OPFS_PATH_PREFIX = '/wpcom-onboarding';

export async function initializeWordPressPlayground(
	iframe: HTMLIFrameElement,
	recommendedPhpVersion: string,
	setSearchParams: ( callback: ( prev: URLSearchParams ) => URLSearchParams ) => void
): Promise< PlaygroundClient > {
	let isWordPressInstalled = false;

	const url = new URL( window.location.href );
	let playgroundId: string | null = url.searchParams.get( 'playground' );
	if ( ! playgroundId ) {
		// Create a new playground ID if none exists
		playgroundId = crypto.randomUUID();
		// update url in browser history
		url.searchParams.set( 'playground', playgroundId );
		window.history.replaceState( {}, '', url.toString() );
		// update search params through react router
		setSearchParams( ( prev ) => {
			prev.set( 'playground', playgroundId as string );
			return prev;
		} );
	} else {
		// Assume we have WP installed, we will attempt to boot and capture the error when boot fails
		isWordPressInstalled = true;
	}

	try {
		const mountDescriptor: MountDescriptor = {
			device: {
				type: 'opfs',
				path: `${ OPFS_PATH_PREFIX }/${ playgroundId }/`,
			},
			mountpoint: '/wordpress',
			initialSyncDirection: isWordPressInstalled ? 'opfs-to-memfs' : 'memfs-to-opfs',
		};

		const client = await startPlaygroundWeb( {
			iframe,
			remoteUrl: 'https://playground.wordpress.net/remote.html',
			blueprint: await getBlueprint( isWordPressInstalled, recommendedPhpVersion ),
			shouldInstallWordPress: ! isWordPressInstalled,
			mounts: isWordPressInstalled ? [ mountDescriptor ] : [],
		} );

		if ( ! isWordPressInstalled ) {
			await client.mountOpfs( mountDescriptor );
		}

		await client.isReady();
		return client;
	} catch ( error ) {
		logToLogstash( {
			feature: 'calypso_client',
			tags: [ 'playground-setup' ],
			message: ( error as Error ).message,
			site_id: undefined,
			properties: {
				env: config( 'env_id' ),
			},
		} );
		throw error;
	}
}
