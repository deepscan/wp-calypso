import interpolateComponents from '@automattic/interpolate-components';
import sprintf from '@tannin/sprintf';
import debugFactory from 'debug';
import sha1 from 'hash.js/lib/hash/sha/1';
import LRU from 'lru';
import Tannin from 'tannin';

/**
 * Module variables
 */
const debug = debugFactory( 'i18n-calypso' );

/**
 * Constants
 */
const domain_key = 'messages';

const translationLookup = [
	// By default don't modify the options when looking up translations.
	function ( options ) {
		return options;
	},
];

const hashCache = {};

// raise a console warning
function warn() {
	if ( ! I18N.throwErrors ) {
		return;
	}
	if ( 'undefined' !== typeof window && window.console && window.console.warn ) {
		window.console.warn.apply( window.console, arguments );
	}
}

// turns Function.arguments into an array
function simpleArguments( args ) {
	return Array.prototype.slice.call( args );
}

/**
 * Coerce the possible arguments and normalize to a single object.
 * @param   {any} args - arguments passed in from `translate()`
 * @returns {Object}         - a single object describing translation needs
 */
function normalizeTranslateArguments( args ) {
	const original = args[ 0 ];

	// warn about older deprecated syntax
	if (
		typeof original !== 'string' ||
		args.length > 3 ||
		( args.length > 2 && typeof args[ 1 ] === 'object' && typeof args[ 2 ] === 'object' )
	) {
		warn(
			'Deprecated Invocation: `translate()` accepts ( string, [string], [object] ). These arguments passed:',
			simpleArguments( args ),
			'. See https://github.com/Automattic/i18n-calypso#translate-method'
		);
	}
	if ( args.length === 2 && typeof original === 'string' && typeof args[ 1 ] === 'string' ) {
		warn(
			'Invalid Invocation: `translate()` requires an options object for plural translations, but passed:',
			simpleArguments( args )
		);
	}

	// options could be in position 0, 1, or 2
	// sending options as the first object is deprecated and will raise a warning
	let options = {};
	for ( let i = 0; i < args.length; i++ ) {
		if ( typeof args[ i ] === 'object' ) {
			options = args[ i ];
		}
	}

	// `original` can be passed as first parameter or as part of the options object
	// though passing original as part of the options is a deprecated approach and will be removed
	if ( typeof original === 'string' ) {
		options.original = original;
	} else if ( typeof options.original === 'object' ) {
		options.plural = options.original.plural;
		options.count = options.original.count;
		options.original = options.original.single;
	}
	if ( typeof args[ 1 ] === 'string' ) {
		options.plural = args[ 1 ];
	}

	if ( typeof options.original === 'undefined' ) {
		throw new Error( 'Translate called without a `string` value as first argument.' );
	}

	return options;
}

/**
 * Takes translate options object and coerces to a Tannin request to retrieve translation.
 * @param   {Object} tannin  - tannin data object
 * @param   {Object} options - object describing translation
 * @returns {string}         - the returned translation from Tannin
 */
function getTranslationFromTannin( tannin, options ) {
	return tannin.dcnpgettext(
		domain_key,
		options.context,
		options.original,
		options.plural,
		options.count
	);
}

function getTranslation( i18n, options ) {
	for ( let i = translationLookup.length - 1; i >= 0; i-- ) {
		const lookup = translationLookup[ i ]( Object.assign( {}, options ) );
		const key = lookup.context ? lookup.context + '\u0004' + lookup.original : lookup.original;

		// Only get the translation from tannin if it exists.
		if ( i18n.state.locale[ key ] ) {
			return getTranslationFromTannin( i18n.state.tannin, lookup );
		}
	}

	return null;
}

function I18N() {
	if ( ! ( this instanceof I18N ) ) {
		return new I18N();
	}
	this.defaultLocaleSlug = 'en';
	// Tannin always needs a plural form definition, or it fails when dealing with plurals.
	this.defaultPluralForms = ( n ) => ( n === 1 ? 0 : 1 );
	this.state = {
		tannin: undefined,
		locale: undefined,
		localeSlug: undefined,
		localeVariant: undefined,
		textDirection: undefined,
		translations: LRU( { max: 100 } ),
	};
	this.componentUpdateHooks = [];
	this.translateHooks = [];
	this.subscribers = new Set();
	// default configuration
	this.configure();
}

I18N.throwErrors = false;

I18N.prototype.subscribe = function ( callback ) {
	this.subscribers.add( callback );
	return () => this.subscribers.delete( callback );
};

I18N.prototype.emitChange = function () {
	this.subscribers.forEach( ( callback ) => callback() );
};

/**
 * Returns a browser-safe locale string that can be used with `Intl.NumberFormat`.
 * @returns {string} The locale string
 */
I18N.prototype.getBrowserSafeLocale = function () {
	/**
	 * The `Intl.NumberFormat` constructor fails only when there is a variant, divided by `_`.
	 * These suffixes should be removed. `localeVariant` values like `de-at` or `es-mx`
	 * should all be valid inputs for the constructor.
	 */
	return this.getLocaleVariant()?.split( '_' )[ 0 ] ?? this.getLocaleSlug();
};

I18N.prototype.configure = function ( options ) {
	Object.assign( this, options || {} );
	this.setLocale();
};

I18N.prototype.setLocale = function ( localeData ) {
	if ( localeData && localeData[ '' ] && localeData[ '' ][ 'key-hash' ] ) {
		const keyHash = localeData[ '' ][ 'key-hash' ];

		const transform = function ( string, hashLength ) {
			const lookupPrefix = hashLength === false ? '' : String( hashLength );
			if ( typeof hashCache[ lookupPrefix + string ] !== 'undefined' ) {
				return hashCache[ lookupPrefix + string ];
			}
			const hash = sha1().update( string ).digest( 'hex' );

			if ( hashLength ) {
				return ( hashCache[ lookupPrefix + string ] = hash.substr( 0, hashLength ) );
			}

			return ( hashCache[ lookupPrefix + string ] = hash );
		};

		const generateLookup = function ( hashLength ) {
			return function ( options ) {
				if ( options.context ) {
					options.original = transform(
						options.context + String.fromCharCode( 4 ) + options.original,
						hashLength
					);
					delete options.context;
				} else {
					options.original = transform( options.original, hashLength );
				}

				return options;
			};
		};

		if ( keyHash.substr( 0, 4 ) === 'sha1' ) {
			if ( keyHash.length === 4 ) {
				translationLookup.push( generateLookup( false ) );
			} else {
				const variableHashLengthPos = keyHash.substr( 5 ).indexOf( '-' );
				if ( variableHashLengthPos < 0 ) {
					const hashLength = Number( keyHash.substr( 5 ) );
					translationLookup.push( generateLookup( hashLength ) );
				} else {
					const minHashLength = Number( keyHash.substr( 5, variableHashLengthPos ) );
					const maxHashLength = Number( keyHash.substr( 6 + variableHashLengthPos ) );

					for ( let hashLength = minHashLength; hashLength <= maxHashLength; hashLength++ ) {
						translationLookup.push( generateLookup( hashLength ) );
					}
				}
			}
		}
	}

	// if localeData is not given, assumes default locale and reset
	if ( ! localeData || ! localeData[ '' ].localeSlug ) {
		this.state.locale = {
			'': { localeSlug: this.defaultLocaleSlug, plural_forms: this.defaultPluralForms },
		};
	} else if ( localeData[ '' ].localeSlug === this.state.localeSlug ) {
		// Exit if same data as current (comparing references only)
		if ( localeData === this.state.locale ) {
			return;
		}

		// merge new data into existing one
		Object.assign( this.state.locale, localeData );
	} else {
		this.state.locale = Object.assign( {}, localeData );
	}

	this.state.localeSlug = this.state.locale[ '' ].localeSlug;
	this.state.localeVariant = this.state.locale[ '' ].localeVariant;

	// extract the `textDirection` info (LTR or RTL) from either:
	// - the translation for the special string "ltr" (standard in Core, not present in Calypso)
	// - or the `momentjs_locale.textDirection` property present in Calypso translation files
	this.state.textDirection =
		this.state.locale[ 'text direction\u0004ltr' ]?.[ 0 ] ||
		this.state.locale[ '' ]?.momentjs_locale?.textDirection;

	this.state.tannin = new Tannin( { [ domain_key ]: this.state.locale } );

	this.emitChange();
};

I18N.prototype.getLocale = function () {
	return this.state.locale;
};

/**
 * Get the current locale slug.
 * @returns {string} The string representing the currently loaded locale
 */
I18N.prototype.getLocaleSlug = function () {
	return this.state.localeSlug;
};

/**
 * Get the current locale variant. That's set for some special locales that don't have a
 * standard ISO code, like `de_formal` or `sr_latin`.
 * @returns {string|undefined} The string representing the currently loaded locale's variant
 */
I18N.prototype.getLocaleVariant = function () {
	return this.state.localeVariant;
};

/**
 * Get the current text direction, left-to-right (LTR) or right-to-left (RTL).
 * @returns {boolean} `true` in case the current locale has RTL text direction
 */
I18N.prototype.isRtl = function () {
	return this.state.textDirection === 'rtl';
};

/**
 * Adds new translations to the locale data, overwriting any existing translations with a matching key.
 * @param {Object} localeData Locale data
 */
I18N.prototype.addTranslations = function ( localeData ) {
	for ( const prop in localeData ) {
		if ( prop !== '' ) {
			this.state.tannin.data.messages[ prop ] = localeData[ prop ];
		}
	}

	this.emitChange();
};

/**
 * Checks whether the given original has a translation.
 * @returns {boolean} whether a translation exists
 */
I18N.prototype.hasTranslation = function () {
	return !! getTranslation( this, normalizeTranslateArguments( arguments ) );
};

/**
 * Returns `newCopy` if given `text` is translated or locale is English, otherwise returns the `oldCopy`.
 * ------------------
 * Important - Usage:
 * ------------------
 * `newCopy` prop should be an actual `i18n.translate()` call from the consuming end.
 * This is the only way currently to ensure that it is picked up by our string extraction mechanism
 * and propagate into GlotPress for translation.
 * ------------------
 * @param {Object} options
 * @param {string} options.text - The text to check for translation.
 * @param {string | Object} options.newCopy - The translation to return if the text is translated.
 * @param {string | Object | undefined } options.oldCopy - The fallback to return if the text is not translated.
 * @param {Object} options.translationOptions - The options to pass to the `hasTranslation` method, e.g. translation context.
 */
I18N.prototype.fixMe = function ( { text, newCopy, oldCopy, translationOptions = {} } ) {
	if ( typeof text !== 'string' ) {
		warn( 'fixMe() requires an object with a proper text property (string)' );
		return null;
	}

	if (
		[ 'en', 'en-gb' ].includes( this.getLocaleSlug() ) ||
		this.hasTranslation( text, translationOptions )
	) {
		return newCopy;
	}

	return oldCopy;
};

/**
 * Exposes single translation method.
 * See sibling README
 * @returns {string | Object | undefined} translated text or an object containing React children that can be inserted into a parent component
 */
I18N.prototype.translate = function () {
	const options = normalizeTranslateArguments( arguments );

	let translation = getTranslation( this, options );
	if ( ! translation ) {
		// This purposefully calls tannin for a case where there is no translation,
		// so that tannin gives us the expected object with English text.
		translation = getTranslationFromTannin( this.state.tannin, options );
	}

	// handle any string substitution
	if ( options.args ) {
		const sprintfArgs = Array.isArray( options.args ) ? options.args.slice( 0 ) : [ options.args ];
		sprintfArgs.unshift( translation );
		try {
			translation = sprintf( ...sprintfArgs );
		} catch ( error ) {
			if ( ! window || ! window.console ) {
				return;
			}
			const errorMethod = this.throwErrors ? 'error' : 'warn';
			if ( typeof error !== 'string' ) {
				window.console[ errorMethod ]( error );
			} else {
				window.console[ errorMethod ]( 'i18n sprintf error:', sprintfArgs );
			}
		}
	}

	// interpolate any components
	if ( options.components ) {
		translation = interpolateComponents( {
			mixedString: translation,
			components: options.components,
			throwErrors: this.throwErrors,
		} );
	}

	// run any necessary hooks
	this.translateHooks.forEach( function ( hook ) {
		translation = hook( translation, options );
	} );

	return translation;
};

/**
 * Causes i18n to re-render all translations.
 *
 * This can be necessary if an extension makes changes that i18n is unaware of
 * and needs those changes manifested immediately (e.g. adding an important
 * translation hook, or modifying the behaviour of an existing hook).
 *
 * If at all possible, react components should try to use the more local
 * updateTranslation() function inherited from the mixin.
 */
I18N.prototype.reRenderTranslations = function () {
	debug( 'Re-rendering all translations due to external request' );
	this.emitChange();
};

I18N.prototype.registerComponentUpdateHook = function ( callback ) {
	this.componentUpdateHooks.push( callback );
};

I18N.prototype.registerTranslateHook = function ( callback ) {
	this.translateHooks.push( callback );
};

export default I18N;
