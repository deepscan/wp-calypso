import { Component } from 'react';

const getRegExpFor = function ( type, textToHighlight ) {
	const expressions = {};
	expressions.username = '(^' + textToHighlight + ')(\\w*)\\s*';
	expressions.fullname = '(^.*?)(\\b' + textToHighlight + ')(.*)';

	return new RegExp( expressions[ type ], 'ig' );
};

const highlight = ( content, textToHighlight, type ) => {
	const lowerCaseSearch = textToHighlight.toLowerCase();
	const matcher = getRegExpFor( type, textToHighlight );
	const matches = matcher.exec( content );

	if ( ! matches ) {
		return [ { type: 'text', text: content } ];
	}

	return matches.slice( 1 ).reduce(
		( [ result, alreadyHighlighted ], text ) => {
			// skip the first "complete match" string
			const shouldHighlight = ! alreadyHighlighted && lowerCaseSearch === text.toLowerCase();
			// eslint-disable-next-line no-shadow
			const type = shouldHighlight ? 'strong' : 'text';

			return [ [ ...result, { type, text } ], shouldHighlight ];
		},
		[ [], false ]
	)[ 0 ];
};

export class Suggestion extends Component {
	render() {
		const username = highlight( this.props.username, this.props.suggestionsQuery, 'username' );
		username.unshift( { type: 'text', text: '@' } );

		const fullName = highlight( this.props.fullName, this.props.suggestionsQuery, 'fullname' );

		return (
			// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
			<li
				ref={ this.props.getElement }
				key={ this.props.username }
				className={ this.props.selected ? 'cur' : '' }
				onClick={ this.props.onClick }
				onMouseEnter={ this.props.onMouseEnter }
			>
				{ /* eslint-disable-next-line jsx-a11y/alt-text */ }
				<img src={ this.props.avatarUrl } />
				<span className="wpnc__username">
					{ username.map( ( { type, text }, index ) =>
						'strong' === type ? (
							<strong key={ index }>{ text }</strong>
						) : (
							<span key={ index }>{ text }</span>
						)
					) }
				</span>
				<small>
					{ fullName.map( ( { type, text }, index ) =>
						'strong' === type ? (
							<strong key={ index }>{ text }</strong>
						) : (
							<span key={ index }>{ text }</span>
						)
					) }
				</small>
			</li>
		);
	}
}

export default Suggestion;
