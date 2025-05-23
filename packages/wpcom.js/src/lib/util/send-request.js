import debugFactory from 'debug';
import qs from 'qs';

const debug = debugFactory( 'wpcom:send-request' );
const debug_res = debugFactory( 'wpcom:send-request:res' );

/**
 * Request to WordPress REST API
 * @param {string | Object} params - params object
 * @param {Object} query - query object parameter
 * @param {Object} body - body object parameter
 * @param {Function} fn - callback function
 * @returns {Function} request handler
 */
export default function sendRequest( params, query, body, fn ) {
	// `params` can be just the path ( String )
	params = 'string' === typeof params ? { path: params } : params;

	debug( 'sendRequest(%o )', params.path );

	// set `method` request param
	params.method = ( params.method || 'get' ).toUpperCase();

	// query could be `null`
	query = query || {};

	// Handle special query parameters
	// - `apiVersion`
	if ( query.apiVersion ) {
		params.apiVersion = query.apiVersion;
		debug( 'apiVersion: %o', params.apiVersion );
		delete query.apiVersion;
	}

	// Set default value of `params.apiVersion` if it wasn't specified. This WPCOM client uses `1.1` as the default,
	// while the REST proxy itself will default to `1` if the client doesn't specify an explicit `apiVersion`.
	if ( ! params.apiVersion ) {
		params.apiVersion = this.apiVersion;
	}

	// - `apiNamespace`
	if ( query.apiNamespace ) {
		params.apiNamespace = query.apiNamespace;
		debug( 'apiNamespace: %o', params.apiNamespace );
		delete query.apiNamespace;
	}

	// - `proxyOrigin`
	if ( query.proxyOrigin ) {
		params.proxyOrigin = query.proxyOrigin;
		debug( 'proxyOrigin: %o', params.proxyOrigin );
		delete query.proxyOrigin;
	}

	// Stringify query object before to send
	params.query = qs.stringify( query, { arrayFormat: 'brackets' } );

	if ( body ) {
		params.body = body;
	}

	// OAuth token
	if ( this.token ) {
		params.token = this.token;
	}

	debug( 'params: %o', params );

	// if callback is provided, behave traditionally
	if ( 'function' === typeof fn ) {
		// request method
		return this.request( params, function ( err, res, headers ) {
			debug_res( res );
			fn( err, res, headers );
		} );
	}

	// but if not, return a Promise
	return new Promise( ( resolve, reject ) => {
		this.request( params, ( err, res ) => {
			debug_res( res );
			err ? reject( err ) : resolve( res );
		} );
	} );
}
