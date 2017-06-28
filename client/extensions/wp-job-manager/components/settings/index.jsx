/**
 * External dependencies
 */
import React, { cloneElement, Children, Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { localize } from 'i18n-calypso';
import { flowRight } from 'lodash';

/**
 * Internal dependencies
 */
import DocumentHead from 'components/data/document-head';
import Main from 'components/main';
import Navigation from '../navigation';
import QuerySettings from '../../data/query-settings';
import { getSelectedSite, getSelectedSiteId } from 'state/ui/selectors';

class Settings extends Component {
	static propTypes = {
		children: PropTypes.element,
		site: PropTypes.object,
		siteId: PropTypes.number,
		tab: PropTypes.string,
		translate: PropTypes.func,
	};

	render() {
		const {
			children,
			site,
			siteId,
			tab,
			translate,
		} = this.props;
		const mainClassName = 'wp-job-manager__main';

		return (
			<Main className={ mainClassName }>
				<QuerySettings siteId={ siteId } />
				<DocumentHead title={ translate( 'WP Job Manager' ) } />
				<Navigation activeTab={ tab } site={ site } />
				{
					Children.map( children, child => cloneElement( child, {} ) )
				}
			</Main>
		);
	}
}

const connectComponent = connect(
	( state ) => {
		const siteId = getSelectedSiteId( state );

		return {
			site: getSelectedSite( state ),
			siteId,
		};
	}
);

export default flowRight(
	connectComponent,
	localize,
)( Settings );
