import debugFactory from 'debug';
import Comment from './site.comment';

/**
 * Module vars
 */
const debug = debugFactory( 'wpcom:post' );
const root = '/sites';

/**
 * SitePost class
 */
class SitePost {
	/**
	 * SitePost methods
	 * @param {string} id - post id
	 * @param {string} sid site id
	 * @param {WPCOM} wpcom - wpcom instance
	 * @returns {null} null
	 */
	constructor( id, sid, wpcom ) {
		if ( ! ( this instanceof SitePost ) ) {
			return new SitePost( id, sid, wpcom );
		}

		this.wpcom = wpcom;
		this._sid = sid;
		this.path = `${ root }/${ this._sid }/posts`;

		// set `id` and/or `slug` properties
		id = id || {};
		if ( 'object' !== typeof id ) {
			this._id = id;
		} else {
			this._id = id.id;
			this._slug = id.slug;
		}
	}

	/**
	 * Set post `id`
	 * @param {string} id - site id
	 */
	id( id ) {
		this._id = id;
	}

	/**
	 * Set post `slug`
	 * @param {string} slug - site slug
	 */
	slug( slug ) {
		this._slug = slug;
	}

	/**
	 * Get post url path
	 * @returns {string} post path
	 */

	getPostPath() {
		return `${ this.path }/${ this._id }`;
	}

	/**
	 * Get post
	 * @param {Object} [query] - query object parameter
	 * @param {Function} fn - callback function
	 * @returns {Function} request handler
	 */
	get( query, fn ) {
		if ( ! this._id && this._slug ) {
			return this.getBySlug( query, fn );
		}

		return this.wpcom.req.get( this.getPostPath(), query, fn );
	}

	/**
	 * Get post by slug
	 * @param {Object} [query] - query object parameter
	 * @param {Function} fn - callback function
	 * @returns {Function} request handler
	 */
	getBySlug( query, fn ) {
		return this.wpcom.req.get( `${ this.path }/slug:${ this._slug }`, query, fn );
	}

	/**
	 * Add post
	 * @param {Object} [query] - query object parameter
	 * @param {Object} body - body object parameter
	 * @param {Function} fn - callback function
	 * @returns {Function} request handler
	 */
	add( query, body, fn ) {
		if ( undefined === fn ) {
			if ( undefined === body ) {
				body = query;
				query = {};
			} else if ( 'function' === typeof body ) {
				fn = body;
				body = query;
				query = {};
			}
		}

		return this.wpcom.req
			.post( `${ this.path }/new`, query, body )
			.then( ( data ) => {
				// update POST object
				this._id = data.ID;
				debug( 'Set post _id: %s', this._id );

				this._slug = data.slug;
				debug( 'Set post _slug: %s', this._slug );

				if ( 'function' === typeof fn ) {
					fn( null, data );
				} else {
					return Promise.resolve( data );
				}
			} )
			.catch( ( err ) => {
				if ( 'function' === typeof fn ) {
					fn( err );
				} else {
					return Promise.reject( err );
				}
			} );
	}

	/**
	 * Edit post
	 * @param {Object} [query] - query object parameter
	 * @param {Object} body - body object parameter
	 * @param {Function} fn - callback function
	 * @returns {Function} request handler
	 */
	update( query, body, fn ) {
		return this.wpcom.req.put( this.getPostPath(), query, body, fn );
	}

	/**
	 * Delete post
	 * @param {Object} [query] - query object parameter
	 * @param {Function} fn - callback function
	 * @returns {Promise} Promise
	 */
	delete( query, fn ) {
		const path = `${ this.getPostPath() }/delete`;
		return this.wpcom.req.del( path, query, fn );
	}

	/**
	 * Del post, alias of Delete
	 * @param {Object} [query] - query object parameter
	 * @param {Function} fn - callback function
	 * @returns {Promise} Promise
	 */
	del( query, fn ) {
		return this.delete( query, fn );
	}

	/**
	 * Restore post
	 * @param {Object} [query] - query object parameter
	 * @param {Function} fn - callback function
	 * @returns {Function} request handler
	 */
	restore( query, fn ) {
		return this.wpcom.req.put( `${ this.getPostPath() }/restore`, query, null, fn );
	}

	/**
	 * Create a `Comment` instance
	 * @param {string} [cid] - comment id
	 * @returns {Comment} Comment instance
	 */
	comment( cid ) {
		return new Comment( cid, this._id, this._sid, this.wpcom );
	}

	/**
	 * Return recent comments
	 * @param {Object} [query] - query object parameter
	 * @param {Function} fn - callback function
	 * @returns {Function} request handler
	 */
	comments( query, fn ) {
		const comment = new Comment( null, this._id, this._sid, this.wpcom );
		return comment.replies( query, fn );
	}
}

export default SitePost;
