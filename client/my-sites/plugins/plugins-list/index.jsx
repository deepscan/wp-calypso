import { recordTracksEvent } from '@automattic/calypso-analytics';
import { localize, translate } from 'i18n-calypso';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import { recordGoogleEvent } from 'calypso/state/analytics/actions';
import { warningNotice } from 'calypso/state/notices/actions';
import {
	activatePlugin,
	deactivatePlugin,
	disableAutoupdatePlugin,
	enableAutoupdatePlugin,
	removePlugin,
	updatePlugin,
} from 'calypso/state/plugins/installed/actions';
import { getPluginStatusesByType } from 'calypso/state/plugins/installed/selectors';
import { removePluginStatuses } from 'calypso/state/plugins/installed/status/actions';
import getSites from 'calypso/state/selectors/get-sites';
import { getSelectedSite, getSelectedSiteSlug } from 'calypso/state/ui/selectors';
import { PluginActions } from '../hooks/types';
import { withShowPluginActionDialog } from '../hooks/use-show-plugin-action-dialog';
import PluginsListDataViews from './plugins-list-dataviews';

import( './style.scss' );

function checkPropsChange( nextProps, propArr ) {
	let i;
	let prop;

	for ( i = 0; i < propArr.length; i++ ) {
		prop = propArr[ i ];

		if ( ! isEqual( nextProps[ prop ], this.props[ prop ] ) ) {
			return true;
		}
	}
	return false;
}

export class PluginsList extends Component {
	static propTypes = {
		plugins: PropTypes.arrayOf(
			PropTypes.shape( {
				sites: PropTypes.object,
				slug: PropTypes.string,
				name: PropTypes.string,
			} )
		).isRequired,
		selectedSite: PropTypes.object,
		selectedSiteSlug: PropTypes.string,
		onSearch: PropTypes.func,
	};

	static defaultProps = {
		recordGoogleEvent: () => {},
	};

	shouldComponentUpdate( nextProps, nextState ) {
		const propsToCheck = [ 'plugins', 'sites', 'selectedSite' ];
		if ( checkPropsChange.call( this, nextProps, propsToCheck ) ) {
			return true;
		}

		if ( this.props.searchTerm !== nextProps.searchTerm ) {
			return true;
		}

		if ( this.props.filter !== nextProps.filter ) {
			return true;
		}

		if ( this.state.disconnectJetpackNotice !== nextState.disconnectJetpackNotice ) {
			return true;
		}

		if ( this.state.removeJetpackNotice !== nextState.removeJetpackNotice ) {
			return true;
		}

		if ( ! isEqual( this.state.selectedPlugins, nextState.selectedPlugins ) ) {
			return true;
		}

		if ( ! isEqual( this.props.inProgressStatuses, nextProps.inProgressStatuses ) ) {
			return true;
		}

		return false;
	}

	componentDidUpdate() {
		this.maybeShowDisconnectNotice();
		this.maybeShowRemoveNotice();
	}

	state = {
		disconnectJetpackNotice: false,
		removeJetpackNotice: false,
		selectedPlugins: {},
	};

	recordEvent( eventAction, includeSelectedPlugins ) {
		eventAction += this.props.selectedSite ? '' : ' on Multisite';
		if ( includeSelectedPlugins ) {
			const pluginSlugs = this.state.selectedPlugins.map( ( plugin ) => plugin.slug );

			this.props.recordGoogleEvent( 'Plugins', eventAction, 'Plugins', pluginSlugs );
		} else {
			this.props.recordGoogleEvent( 'Plugins', eventAction );
		}
	}

	removePluginStatuses() {
		this.props.removePluginStatuses( 'completed', 'error', 'up-to-date' );
	}

	doActionOverSelected( actionName, action ) {
		const isDeactivatingOrRemovingAndJetpackSelected = ( { slug } ) =>
			[ 'deactivating', 'activating', 'removing' ].includes( actionName ) && 'jetpack' === slug;

		this.removePluginStatuses();

		const pluginAndSiteObjects = this.state.selectedPlugins
			.filter( ( plugin ) => ! isDeactivatingOrRemovingAndJetpackSelected( plugin ) ) // ignore sites that are deactivating, activating or removing jetpack
			.map( ( p ) => {
				return Object.keys( p.sites ).map( ( siteId ) => {
					const site = this.props.allSites.find( ( s ) => s.ID === parseInt( siteId ) );
					return {
						site,
						plugin: p,
					};
				} );
			} ) // list of plugins -> list of plugin+site objects
			.flat(); // flatten the list into one big list of plugin+site objects

		pluginAndSiteObjects.forEach( ( { plugin, site } ) => action( site.ID, plugin ) );

		const pluginSlugs = [
			...new Set( pluginAndSiteObjects.map( ( { plugin } ) => plugin.slug ) ),
		].join( ',' );

		const siteIds = [ ...new Set( pluginAndSiteObjects.map( ( { site } ) => site.ID ) ) ].join(
			','
		);

		recordTracksEvent( 'calypso_plugins_bulk_action_execute', {
			action: actionName,
			plugins: pluginSlugs,
			sites: siteIds,
		} );
	}

	bulkActionDialog = ( actionName, selectedPlugins ) => {
		const { allSites, showPluginActionDialog } = this.props;

		const isJetpackIncluded = selectedPlugins.some( ( { slug } ) => slug === 'jetpack' );

		const ALL_ACTION_CALLBACKS = {
			[ PluginActions.ACTIVATE ]: this.activateSelected,
			[ PluginActions.DEACTIVATE ]: isJetpackIncluded
				? this.deactivateAndDisconnectSelected
				: this.deactivateSelected,
			[ PluginActions.REMOVE ]: isJetpackIncluded
				? ( accepted ) => this.removeSelectedWithJetpack( accepted, selectedPlugins )
				: ( accepted ) => this.removeSelected( accepted, selectedPlugins ),
			[ PluginActions.UPDATE ]: this.updateSelected,
			[ PluginActions.ENABLE_AUTOUPDATES ]: this.setAutoupdateSelected,
			[ PluginActions.DISABLE_AUTOUPDATES ]: this.unsetAutoupdateSelected,
		};

		if ( actionName === PluginActions.UPDATE ) {
			//filter out sites that don't have an update available
			selectedPlugins = selectedPlugins.map( ( plugin ) => {
				const filteredSites = Object.fromEntries(
					Object.entries( plugin.sites ).filter( ( [ , site ] ) => site.update?.new_version )
				);
				return { ...plugin, sites: filteredSites };
			} );
		}

		this.setState( {
			selectedPlugins,
		} );

		const selectedActionCallback = ALL_ACTION_CALLBACKS[ actionName ];
		showPluginActionDialog( actionName, selectedPlugins, allSites, selectedActionCallback );
	};

	/** BEGIN BULK ACTION DIALOG CALLBACKS */

	activateSelected = ( accepted ) => {
		if ( ! accepted ) {
			return;
		}

		this.recordEvent( 'Clicked Activate Plugin(s)', true );
		this.doActionOverSelected( 'activating', this.props.activatePlugin );
	};

	deactivateAndDisconnectSelected = ( accepted ) => {
		if ( ! accepted ) {
			return;
		}

		this.recordEvent( 'Clicked Deactivate Plugin(s) and Disconnect Jetpack', true );

		let waitForDeactivate = false;

		this.doActionOverSelected( 'deactivating', ( site, plugin ) => {
			waitForDeactivate = true;
			this.props.deactivatePlugin( site, plugin );
		} );

		if ( waitForDeactivate && this.props.selectedSite ) {
			this.setState( { disconnectJetpackNotice: true } );
		}
	};

	deactivateSelected = ( accepted ) => {
		if ( ! accepted ) {
			return;
		}

		this.recordEvent( 'Clicked Deactivate Plugin(s)', true );
		this.doActionOverSelected( 'deactivating', this.props.deactivatePlugin );
	};

	removeSelectedWithJetpack = ( accepted, selectedPlugins ) => {
		if ( ! accepted ) {
			return;
		}

		this.recordEvent( 'Clicked Remove Plugin(s) and Remove Jetpack', true );

		if ( selectedPlugins.length === 1 ) {
			this.setState( { removeJetpackNotice: true } );
			return;
		}

		let waitForRemove = false;
		this.doActionOverSelected( 'removing', ( site, plugin ) => {
			waitForRemove = true;
			this.props.removePlugin( site, plugin );
		} );

		if ( waitForRemove && this.props.selectedSite ) {
			this.setState( { removeJetpackNotice: true } );
		}
	};

	removeSelected = ( accepted ) => {
		if ( ! accepted ) {
			return;
		}

		this.recordEvent( 'Clicked Remove Plugin(s)', true );
		this.doActionOverSelected( 'removing', this.props.removePlugin );
	};

	updateSelected = ( accepted ) => {
		if ( ! accepted ) {
			return;
		}

		this.recordEvent( 'Clicked Update Plugin(s)', true );
		this.doActionOverSelected( 'updating', this.props.updatePlugin );
	};

	setAutoupdateSelected = ( accepted ) => {
		if ( ! accepted ) {
			return;
		}

		this.recordEvent( 'Clicked Enable Autoupdate Plugin(s)', true );
		this.doActionOverSelected( 'enablingAutoupdates', this.props.enableAutoupdatePlugin );
	};

	unsetAutoupdateSelected = ( accepted ) => {
		if ( ! accepted ) {
			return;
		}

		this.recordEvent( 'Clicked Disable Autoupdate Plugin(s)', true );
		this.doActionOverSelected( 'disablingAutoupdates', this.props.disableAutoupdatePlugin );
	};

	/** END BULK ACTION DIALOG CALLBACKS */

	maybeShowDisconnectNotice() {
		if ( ! this.state.disconnectJetpackNotice ) {
			return;
		}

		if ( this.props.inProgressStatuses.length > 0 ) {
			return;
		}

		this.setState( {
			disconnectJetpackNotice: false,
		} );

		this.props.warningNotice(
			translate(
				'Jetpack cannot be deactivated from WordPress.com. {{link}}Manage connection{{/link}}',
				{
					components: {
						link: <a href={ '/settings/manage-connection/' + this.props.selectedSiteSlug } />,
					},
				}
			)
		);
	}

	maybeShowRemoveNotice() {
		if ( ! this.state.removeJetpackNotice ) {
			return;
		}

		if ( this.props.inProgressStatuses.length > 0 ) {
			return;
		}

		this.setState( {
			removeJetpackNotice: false,
		} );

		this.props.warningNotice( translate( 'Jetpack must be removed via wp-admin.' ) );
	}

	render() {
		return (
			<PluginsListDataViews
				currentPlugins={ this.props.plugins }
				initialSearch={ this.props.searchTerm }
				isLoading={ this.props.isLoading }
				onSearch={ this.props.onSearch }
				bulkActionDialog={ this.bulkActionDialog }
			/>
		);
	}
}

export default connect(
	( state ) => {
		const selectedSite = getSelectedSite( state );

		return {
			allSites: getSites( state ),
			selectedSite,
			selectedSiteSlug: getSelectedSiteSlug( state ),
			inProgressStatuses: getPluginStatusesByType( state, 'inProgress' ),
		};
	},
	{
		activatePlugin,
		deactivatePlugin,
		disableAutoupdatePlugin,
		enableAutoupdatePlugin,
		recordGoogleEvent,
		removePlugin,
		removePluginStatuses,
		updatePlugin,
		warningNotice,
	}
)( withShowPluginActionDialog( localize( PluginsList ) ) );
