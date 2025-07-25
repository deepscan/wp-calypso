import photon from 'photon';
import { getUrlParts, getUrlFromParts } from '../url-parts';

/**
 * Pattern matching URLs to be left unmodified.
 */
let REGEX_EXEMPT_URL: RegExp;

if ( typeof globalThis.location === 'object' ) {
	REGEX_EXEMPT_URL = new RegExp(
		`^(/(?!/)|data:image/[^;]+;|blob:${ globalThis.location.origin }/)`
	);
} else {
	REGEX_EXEMPT_URL = /^(\/(?!\/)|data:image\/[^;]+;)/;
}
/**
 * Pattern matching Automattic-controlled hostnames
 */
const REGEXP_A8C_HOST = /^([-a-zA-Z0-9_]+\.)*(gravatar\.com|wordpress\.com|wp\.com|a8c\.com)$/;

/**
 * Query parameters to be treated as image dimensions
 */
const SIZE_PARAMS = [ 'w', 'h', 'resize', 'fit', 's' ];

/**
 * Generate a safe version of the provided URL
 *
 * Images that Calypso uses have to be provided by a trusted TLS host. To do
 * this, we check the host of the URL against a list of allowed hosts, and run the image
 * through photon if the host name does not match.
 *
 * NOTE: This function will return `null` for external URLs with query strings,
 * because Photon itself does not support this!
 * @param  url The URL to secure
 * @returns The secured URL, or `null` if we couldn't make it safe
 */
export function safeImageUrl( url?: string | null ) {
	if ( typeof url !== 'string' ) {
		return null;
	}

	if ( url.length < 1 ) {
		return null;
	}

	if ( REGEX_EXEMPT_URL.test( url ) ) {
		return url;
	}

	const parsedUrl = getUrlParts( url );

	if ( REGEXP_A8C_HOST.test( parsedUrl.hostname ) ) {
		// Safely promote Automattic domains to HTTPS
		parsedUrl.protocol = 'https';
		return getUrlFromParts( parsedUrl ).toString();
	}

	// If there's a query string, bail out because Photon doesn't support them on external URLs
	if ( parsedUrl.search && ( parsedUrl.host || parsedUrl.hostname || parsedUrl.origin ) ) {
		// If it's just size parameters, let's remove them
		SIZE_PARAMS.forEach( ( param ) => parsedUrl.searchParams.delete( param ) );

		// Ditch authuser=0 if we find it - we see this on googleusercontent.com URLs and it doesn't affect the image output
		if ( parsedUrl.searchParams.get( 'authuser' ) === '0' ) {
			parsedUrl.searchParams.delete( 'authuser' );
		}

		// There are still parameters left, since they might be needed to retrieve the image, bail out
		if ( Array.from( parsedUrl.searchParams ).length ) {
			return null;
		}

		// Ensure we're creating a new URL without the size parameters
		parsedUrl.search = '';

		// Force https since if there's a missing protocol it'll throw an error
		if ( ! parsedUrl?.protocol ) {
			parsedUrl.protocol = 'https';
		}

		url = getUrlFromParts( parsedUrl ).toString();
	}

	// Photon doesn't support SVGs or AVIF
	if ( parsedUrl.pathname.endsWith( '.svg' ) || parsedUrl.pathname.endsWith( '.avif' ) ) {
		return null;
	}

	return photon( url );
}
