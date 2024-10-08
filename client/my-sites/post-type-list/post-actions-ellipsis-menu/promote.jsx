import { Icon } from '@wordpress/components';
import { localize, useTranslate } from 'i18n-calypso';
import PropTypes from 'prop-types';
import { connect, useSelector } from 'react-redux';
import PopoverMenuItem from 'calypso/components/popover-menu/item';
import { recordTracksEvent } from 'calypso/lib/analytics/tracks';
import { usePromoteWidget, PromoteWidgetStatus } from 'calypso/lib/promote-post';
import useOpenPromoteWidget from 'calypso/my-sites/promote-post-i2/hooks/use-open-promote-widget';
import { getPost } from 'calypso/state/posts/selectors';
import isPrivateSite from 'calypso/state/selectors/is-private-site';
import isSiteComingSoon from 'calypso/state/selectors/is-site-coming-soon';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';

function PostActionsEllipsisMenuPromote( {
	globalId,
	postId,
	bumpStatKey,
	status,
	password,
	siteId,
} ) {
	const translate = useTranslate();

	const openPromoteModal = useOpenPromoteWidget( {
		keyValue: globalId,
		entrypoint: bumpStatKey,
	} );

	const isSitePrivate =
		useSelector( ( state ) => siteId && isPrivateSite( state, siteId ) ) || false;

	const isComingSoon =
		useSelector( ( state ) => siteId && isSiteComingSoon( state, siteId ) ) || false;

	const widgetEnabled = usePromoteWidget() === PromoteWidgetStatus.ENABLED;

	const icon = (
		<Icon
			icon={
				<svg
					className="gridicon needs-offset-y"
					width="18"
					height="18"
					viewBox="0 0 64 64"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path d="M56 35.593C56 38.5372 55.3742 41.4395 54.151 44.1605C52.9279 46.8814 51.15 49.3512 48.8886 51.4302C46.6413 53.5093 43.9674 55.1558 41.0233 56.286C39.6295 56.8163 38.193 57.2209 36.728 57.5L37.3823 57.1512C37.3823 57.1512 43.043 53.914 44.1666 46.6581C44.6928 40.1837 39.3166 37.3512 39.3166 37.3512C39.3166 37.3512 36.5858 40.8092 32.7029 40.8092C26.6013 40.8092 27.7083 30.6579 27.7083 30.6579C27.7083 30.6579 18.4516 35.4256 18.4516 45.807C18.4516 52.2954 24.9941 57.0814 24.9941 57.0814V57.0954C24.1408 56.8721 23.3016 56.593 22.4767 56.2721C19.5326 55.1419 16.8587 53.4953 14.6114 51.4163C12.3642 49.3372 10.5721 46.8674 9.34897 44.1465C8.12581 41.4256 7.5 38.5233 7.5 35.5791C7.5 25.6163 19.1343 15.9605 19.1343 15.9605C19.1343 15.9605 20.2437 23.5372 25.9186 23.5372C36.5858 23.5372 32.7029 6.5 32.7029 6.5C32.7029 6.5 42.4029 12.1791 45.3186 27.3186C50.6111 26.6316 50.1686 19.7419 50.1686 19.7419C50.1686 19.7419 56 27.3186 56 35.6628" />
				</svg>
			}
			size={ 18 }
		/>
	);

	if ( isSitePrivate ) {
		return null;
	}

	if ( isComingSoon ) {
		return null;
	}

	if ( password !== '' ) {
		return null;
	}

	if ( ! widgetEnabled ) {
		return null;
	}

	if ( ! postId ) {
		return null;
	}

	if ( status !== 'publish' ) {
		return null;
	}

	const showDSPWidget = () => {
		recordTracksEvent( 'calypso_post_type_list_blaze' );
		openPromoteModal();
	};

	return (
		<PopoverMenuItem onClick={ showDSPWidget } icon={ icon }>
			{ translate( 'Promote with Blaze' ) }
		</PopoverMenuItem>
	);
}

PostActionsEllipsisMenuPromote.propTypes = {
	bumpStatKey: PropTypes.string,
	globalId: PropTypes.string,
	postId: PropTypes.number,
};

const mapStateToProps = ( state, { globalId } ) => {
	const post = getPost( state, globalId );
	if ( ! post ) {
		return {};
	}

	return {
		type: post.type,
		postId: post.ID,
		status: post.status,
		password: post.password,
		siteId: getSelectedSiteId( state ),
	};
};

export default connect( mapStateToProps )( localize( PostActionsEllipsisMenuPromote ) );
