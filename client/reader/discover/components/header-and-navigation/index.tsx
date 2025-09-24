import page from '@automattic/calypso-router';
import { addLocaleToPathLocaleInFront, useLocale } from '@automattic/i18n-utils';
import clsx from 'clsx';
import { useTranslate, fixMe } from 'i18n-calypso';
import NavigationHeader from 'calypso/components/navigation-header';
import { addQueryArgs } from 'calypso/lib/url';
import DiscoverNavigation from 'calypso/reader/discover/components/navigation';
import DiscoverTagsNavigation from 'calypso/reader/discover/components/tags-navigation';
import {
	FIRST_POSTS_TAB,
	ADD_NEW_TAB,
	REDDIT_TAB,
	RECOMMENDED_TAB,
	FRESHLY_PRESSED_TAB,
} from '../../helper';

export interface DiscoverHeaderAndNavigationProps {
	selectedTab: string;
	selectedTag?: string;
}

export default function DiscoverHeaderAndNavigation(
	props: DiscoverHeaderAndNavigationProps
): JSX.Element {
	const { selectedTab, selectedTag } = props;
	const currentLocale = useLocale();
	const translate = useTranslate();

	function handleTagSelect( tag: string ): void {
		const redirectPath = '/discover/tags';
		const localizedPath = addLocaleToPathLocaleInFront( redirectPath, currentLocale );
		page.replace( addQueryArgs( { selectedTag: tag }, localizedPath ) );
	}

	let subHeaderText;
	switch ( selectedTab ) {
		case FIRST_POSTS_TAB:
			subHeaderText = translate(
				'Fresh voices, fresh views. Explore first-time posts from new bloggers.'
			);
			break;
		case ADD_NEW_TAB:
			subHeaderText = translate( 'Subscribe to new blogs, newsletters, and RSS feeds.' );
			break;
		case REDDIT_TAB:
			subHeaderText = translate( 'Follow your favorite subreddits inside the Reader.' );
			break;
		case RECOMMENDED_TAB:
			subHeaderText = fixMe( {
				text: 'Explore popular blogs that inspire, educate, and entertain.',
				newCopy: translate( 'Explore popular blogs that inspire, educate, and entertain.' ),
				oldCopy: translate( 'Explore %s blogs that inspire, educate, and entertain.', {
					args: [ 'popular' ],
					comment: '%s is the type of blog being explored e.g. food, art, technology etc.',
				} ),
			} );
			break;
		case FRESHLY_PRESSED_TAB:
			subHeaderText = translate( "Our team's favorite blog posts." );
			break;
	}

	return (
		<>
			<NavigationHeader
				title={ translate( 'Discover' ) }
				subtitle={ subHeaderText }
				className={ clsx( 'discover-stream-header' ) }
			/>
			<DiscoverNavigation selectedTab={ selectedTab } />

			{ selectedTab === 'tags' && (
				<DiscoverTagsNavigation selectedTag={ selectedTag } onTagSelect={ handleTagSelect } />
			) }
		</>
	);
}
