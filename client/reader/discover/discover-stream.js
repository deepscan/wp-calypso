import clsx from 'clsx';
import { useTranslate } from 'i18n-calypso';
import ReaderMain from 'calypso/reader/components/reader-main';
import DiscoverAddNew from 'calypso/reader/discover/components/add-new';
import DiscoverHeaderAndNavigation from 'calypso/reader/discover/components/header-and-navigation';
import Reddit from 'calypso/reader/discover/components/reddit';
import Stream from 'calypso/reader/stream';
import { useSelector } from 'calypso/state';
import { isUserLoggedIn } from 'calypso/state/current-user/selectors';
import { getReaderFollowedTags } from 'calypso/state/reader/tags/selectors';
import {
	getDiscoverStreamTags,
	RECOMMENDED_TAB,
	buildDiscoverStreamKey,
	ADD_NEW_TAB,
	REDDIT_TAB,
	getDefaultTab,
} from './helper';

const DiscoverStream = ( props ) => {
	const translate = useTranslate();
	const followedTags = useSelector( getReaderFollowedTags );
	const isLoggedIn = useSelector( isUserLoggedIn );
	const selectedTab = props.selectedTab || getDefaultTab();
	const selectedTag = props.query?.selectedTag ?? 'dailyprompt';

	const effectiveTabSelection = 'tags' === selectedTab ? selectedTag : selectedTab;
	const headerAndNavigationProps = {
		width: props.width,
		selectedTab: selectedTab,
		selectedTag: selectedTag,
	};

	const TAB_COMPONENTS = {
		[ ADD_NEW_TAB ]: DiscoverAddNew,
		[ REDDIT_TAB ]: Reddit,
	};

	const ContentComponent = TAB_COMPONENTS[ selectedTab ];
	if ( ContentComponent ) {
		return (
			<ReaderMain className={ clsx( 'following main', props.className ) }>
				<DiscoverHeaderAndNavigation { ...headerAndNavigationProps } />
				<div className="reader__content">
					<ContentComponent />
				</div>
			</ReaderMain>
		);
	}

	// Do not supply a fallback empty array as null is good data for getDiscoverStreamTags
	const recommendedStreamTags = getDiscoverStreamTags(
		followedTags && followedTags.map( ( tag ) => tag.slug ),
		isLoggedIn
	);

	const streamKey = buildDiscoverStreamKey( effectiveTabSelection, recommendedStreamTags );
	return (
		<Stream
			{ ...props }
			streamKey={ streamKey }
			sidebarTabTitle={
				selectedTab === RECOMMENDED_TAB ? translate( 'Sites' ) : translate( 'Related' )
			}
			selectedStreamName={ selectedTab }
			useCompactCards
		>
			<DiscoverHeaderAndNavigation { ...headerAndNavigationProps } />
		</Stream>
	);
};

export default DiscoverStream;
