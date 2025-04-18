import { TextControl } from '@wordpress/components';
import { useMemo, useState } from 'react';
import Suggestions from '..';

export default function SuggestionsExample() {
	const [ query, setQuery ] = useState( '' );

	const suggestions = useMemo( () => {
		if ( ! query ) {
			return [];
		}
		const allSuggestions = [ 'Foo', 'Bar', 'Baz' ].map( ( s ) => ( { label: s } ) );
		const r = new RegExp( query, 'i' );
		return allSuggestions.filter( ( { label } ) => r.test( label ) );
	}, [ query ] );

	return (
		<div className="docs__suggestions-container">
			<div>
				<TextControl
					value={ query }
					onChange={ setQuery }
					autoComplete="off"
					autoCorrect="off"
					autoCapitalize="off"
					spellCheck={ false }
					placeholder="Type Foo, Bar or Baz…"
					__nextHasNoMarginBottom
					__next40pxDefaultSize
				/>
				<p>
					<span role="img" aria-label="Warning">
						⚠️
					</span>
					The above input is for demonstration. It is not part of the{ ' ' }
					<code>{ '<Suggestions />' }</code> component.
				</p>
				<p>
					<span role="img" aria-label="Tip">
						💡
					</span>
					Check your browser console to observe the `suggest` callback.
				</p>
			</div>
			<Suggestions
				query={ query }
				suggestions={ suggestions }
				suggest={ ( ...args ) => {
					// eslint-disable-next-line no-console
					console.log( 'Suggest callback invoked with args: %o', args );
				} }
			/>
		</div>
	);
}
SuggestionsExample.displayName = 'SuggestionsExample';
