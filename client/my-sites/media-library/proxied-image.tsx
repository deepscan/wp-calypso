import debugFactory from 'debug';
import { useEffect, useState } from 'react';
import { getAtomicSiteMediaViaProxyRetry } from 'calypso/lib/get-atomic-site-media';
import type { ComponentType, FC, ReactElement, ReactNode } from 'react';

const debug = debugFactory( 'calypso:my-sites:media-library:proxied-image' );

type RenderedComponentProps = {
	src: string;
	[ key: string ]: any;
};
export type RenderedComponent = string | ComponentType< RenderedComponentProps >;

export interface ProxiedImageProps {
	query: string;
	filePath: string;
	siteId: number | string;
	placeholder?: ReactNode;
	component: RenderedComponent;
	maxSize: number | null;
	onError?: ( err: Error ) => any;

	[ key: string ]: any;
}

const cache: { [ key: string ]: Blob } = {};
const cacheResponse = ( requestId: string, blob: Blob, freshness = 60000 ) => {
	// Cache at most 100 items
	const cacheKeys = Object.keys( cache );
	if ( cacheKeys.length > 100 ) {
		delete cache[ cacheKeys[ 0 ] ];
	}

	cache[ requestId ] = blob;

	// Self-remove this entry after `freshness` ms
	setTimeout( () => {
		delete cache[ requestId ];
	}, freshness );
};

const ProxiedImage: FC< ProxiedImageProps > = function ProxiedImage( {
	siteId,
	filePath,
	query,
	placeholder = null,
	maxSize,
	onError,
	component: Component,
	...rest
} ) {
	const [ imageObjectUrl, setImageObjectUrl ] = useState< string >( '' );

	useEffect( () => {
		const requestId = `media-library-proxied-image-${ siteId }${ filePath }${ query }`;

		if ( cache[ requestId ] ) {
			const url = URL.createObjectURL( cache[ requestId ] );
			setImageObjectUrl( url );
			debug( 'set image from cache', { url } );
		} else {
			debug( 'requesting image from API', { requestId, imageObjectUrl } );
			const options = { query, ...( maxSize !== null ? { maxSize } : {} ) };
			getAtomicSiteMediaViaProxyRetry( siteId, filePath, options )
				.then( ( data: Blob ) => {
					cacheResponse( requestId, data );
					setImageObjectUrl( URL.createObjectURL( data ) );
					debug( 'got image from API', { requestId, imageObjectUrl, data } );
				} )
				.catch( onError );
		}

		return () => {
			if ( imageObjectUrl ) {
				debug( 'Cleared blob from memory on dismount: ' + imageObjectUrl );
				URL.revokeObjectURL( imageObjectUrl );
			}
		};
	}, [ siteId, filePath, query ] );

	if ( ! imageObjectUrl ) {
		return placeholder as ReactElement;
	}

	/* eslint-disable-next-line jsx-a11y/alt-text */
	return <Component src={ imageObjectUrl } { ...rest } />;
};

export default ProxiedImage;
