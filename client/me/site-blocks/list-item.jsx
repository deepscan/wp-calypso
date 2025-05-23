import { Button, ExternalLink } from '@wordpress/components';
import { localize } from 'i18n-calypso';
import { Component } from 'react';
import { connect } from 'react-redux';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import { unblockSite } from 'calypso/state/reader/site-blocks/actions';
import { getSite } from 'calypso/state/reader/sites/selectors';

class SiteBlockListItem extends Component {
	unblockSite = () => {
		const { siteId } = this.props;
		this.props.recordTracksEvent( 'calypso_me_unblock_site', {
			blog_id: siteId,
		} );
		this.props.unblockSite( siteId );
	};

	render() {
		const { site, translate } = this.props;

		if ( ! site ) {
			return null;
		}

		return (
			<div className="site-blocks__list-item">
				<ExternalLink target="_blank" href={ site.URL }>
					{ site.name || site.title || site.slug || site.feed_URL }
				</ExternalLink>
				<Button
					__next40pxDefaultSize
					isDestructive
					variant="tertiary"
					className="site-blocks__remove-button"
					title={ translate( 'Unblock site' ) }
					onClick={ this.unblockSite }
				>
					{ translate( 'Unblock' ) }
				</Button>
			</div>
		);
	}
}

export default connect(
	( state, ownProps ) => {
		return {
			site: getSite( state, ownProps.siteId ),
		};
	},
	{ unblockSite, recordTracksEvent }
)( localize( SiteBlockListItem ) );
