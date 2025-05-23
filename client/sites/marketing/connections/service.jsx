import config from '@automattic/calypso-config';
import { Badge, FoldableCard, ExternalLink } from '@automattic/components';
import { localizeUrl } from '@automattic/i18n-utils';
import requestExternalAccess from '@automattic/request-external-access';
import clsx from 'clsx';
import { localize } from 'i18n-calypso';
import { isEqual, find, some, get } from 'lodash';
import PropTypes from 'prop-types';
import { Component, cloneElement } from 'react';
import { connect } from 'react-redux';
import Notice from 'calypso/components/notice';
import SocialLogo from 'calypso/components/social-logo';
import isJetpackCloud from 'calypso/lib/jetpack/is-jetpack-cloud';
import { recordGoogleEvent, recordTracksEvent } from 'calypso/state/analytics/actions';
import { getCurrentUserId } from 'calypso/state/current-user/selectors';
import { successNotice, errorNotice, warningNotice } from 'calypso/state/notices/actions';
import getCurrentRouteParameterized from 'calypso/state/selectors/get-current-route-parameterized';
import getRemovableConnections from 'calypso/state/selectors/get-removable-connections';
import isSiteP2Hub from 'calypso/state/selectors/is-site-p2-hub';
import siteHasFeature from 'calypso/state/selectors/site-has-feature';
import {
	requestKeyringConnections,
	requestP2KeyringConnections,
} from 'calypso/state/sharing/keyring/actions';
import {
	getKeyringConnectionsByName,
	getRefreshableKeyringConnections,
} from 'calypso/state/sharing/keyring/selectors';
import {
	createSiteConnection,
	deleteSiteConnection,
	fetchConnection,
	updateSiteConnection,
} from 'calypso/state/sharing/publicize/actions';
import {
	getBrokenSiteUserConnectionsForService,
	getSiteUserConnectionsForService,
	isFetchingConnections,
} from 'calypso/state/sharing/publicize/selectors';
import { getAvailableExternalAccounts, isServiceExpanded } from 'calypso/state/sharing/selectors';
import { isJetpackSite } from 'calypso/state/sites/selectors';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import AccountDialog from './account-dialog';
import Connection from './connection';
import GooglePhotosMigration from './google-photos-migration';
import MailchimpSettings, { renderMailchimpLogo } from './mailchimp-settings';
import ServiceAction from './service-action';
import ServiceConnectedAccounts from './service-connected-accounts';
import ServiceDescription from './service-description';
import ServiceExamples, { SERVICES_WITH_EXAMPLES } from './service-examples';
import ServiceTip from './service-tip';

/**
 * Check if the connection is broken or requires reauth.
 * @param {Object} connection Publicize connection.
 * @returns {boolean} True if connection is broken or requires reauthentication.
 */
const isConnectionInvalidOrMustReauth = ( connection ) =>
	[ 'must_reauth', 'invalid' ].includes( connection.status );

export class SharingService extends Component {
	static propTypes = {
		availableExternalAccounts: PropTypes.arrayOf( PropTypes.object ),
		brokenConnections: PropTypes.arrayOf( PropTypes.object ),
		createSiteConnection: PropTypes.func,
		deleteSiteConnection: PropTypes.func,
		errorNotice: PropTypes.func,
		fetchConnection: PropTypes.func,
		isFetching: PropTypes.bool,
		keyringConnections: PropTypes.arrayOf( PropTypes.object ),
		recordGoogleEvent: PropTypes.func,
		recordTracksEvent: PropTypes.func,
		removableConnections: PropTypes.arrayOf( PropTypes.object ),
		service: PropTypes.object.isRequired, // The single service object
		siteId: PropTypes.number, // The site ID for which connections are created
		siteUserConnections: PropTypes.arrayOf( PropTypes.object ),
		translate: PropTypes.func,
		updateSiteConnection: PropTypes.func,
		warningNotice: PropTypes.func,
		isP2HubSite: PropTypes.bool,
		isJetpack: PropTypes.bool,
		hasMultiConnections: PropTypes.bool,
		isNew: PropTypes.bool,
	};

	static defaultProps = {
		availableExternalAccounts: [],
		brokenConnections: [],
		createSiteConnection: () => {},
		deleteSiteConnection: () => {},
		errorNotice: () => {},
		fetchConnection: () => {},
		isFetching: false,
		keyringConnections: [],
		recordGoogleEvent: () => {},
		requestKeyringConnections: () => {},
		removableConnections: [],
		siteId: 0,
		siteUserConnections: [],
		updateSiteConnection: () => {},
		warningNotice: () => {},
		isP2HubSite: false,
		isJetpack: false,
		hasMultiConnections: false,
		isNew: false,
	};

	/**
	 * Triggers an action based on the current connection status.
	 */
	performAction = () => {
		const connectionStatus = this.getConnectionStatus(
			this.props.service.ID,
			this.props.service.status ?? 'ok'
		);
		const { path } = this.props;

		// Depending on current status, perform an action when user clicks the
		// service action button
		if (
			( 'connected' === connectionStatus && this.canRemoveConnection() ) ||
			'must-disconnect' === connectionStatus
		) {
			this.removeConnection();
			this.props.recordTracksEvent( 'calypso_connections_disconnect_button_click', {
				service: this.props.service.ID,
				path,
			} );
			this.props.recordGoogleEvent( 'Sharing', 'Clicked Disconnect Button', this.props.service.ID );
		} else if ( 'reconnect' === connectionStatus || 'refresh-failed' === connectionStatus ) {
			this.refresh();
			this.props.recordTracksEvent( 'calypso_connections_reconnect_button_click', {
				service: this.props.service.ID,
				path,
			} );
			this.props.recordGoogleEvent( 'Sharing', 'Clicked Reconnect Button', this.props.service.ID );
		} else {
			this.addConnection( this.props.service, this.state.newKeyringId );
			this.props.recordTracksEvent( 'calypso_connections_connect_button_click', {
				service: this.props.service.ID,
				path,
			} );
			this.props.recordGoogleEvent( 'Sharing', 'Clicked Connect Button', this.props.service.ID );
		}
	};

	/**
	 * Handle external access provided by the user.
	 * @param {number} keyringConnectionId Keyring connection ID.
	 */
	externalAccessProvided = ( keyringConnectionId ) => {}; // eslint-disable-line no-unused-vars

	/**
	 * Establishes a new connection.
	 * @param {Object} service             Service to connect to.
	 * @param {number} keyringConnectionId Keyring conneciton ID.
	 * @param {number} externalUserId      Optional. User ID for the service. Default: 0.
	 */
	addConnection = ( service, keyringConnectionId, externalUserId = 0 ) => {
		this.setState( { isConnecting: true } );

		const { path } = this.props;

		if ( service ) {
			if ( keyringConnectionId ) {
				// Since we have a Keyring connection to work with, we can immediately
				// create or update the connection
				this.createOrUpdateConnection( keyringConnectionId, externalUserId );
				this.props.recordTracksEvent( 'calypso_connections_connect_button_in_modal_click', {
					service: this.props.service.ID,
					path,
				} );
				this.props.recordGoogleEvent(
					'Sharing',
					'Clicked Connect Button in Modal',
					this.props.service.ID
				);
			} else {
				// Attempt to create a new connection. If a Keyring connection ID
				// is not provided, the user will need to authorize the app
				requestExternalAccess( service.connect_URL, ( { keyring_id: newKeyringId } ) => {
					if ( this.props.isP2HubSite ) {
						this.props.requestP2KeyringConnections( this.props.siteId );
					} else {
						// When the user has finished authorizing the connection
						// (or otherwise closed the window), force a refresh
						this.props.requestKeyringConnections();
					}

					// In the case that a Keyring connection doesn't exist, wait for app
					// authorization to occur, then display with the available connections
					this.setState( { isAwaitingConnections: true } );

					this.externalAccessProvided( newKeyringId );
				} );
			}
		} else {
			// If an account wasn't selected from the dialog or the user cancels
			// the connection, the dialog should simply close
			this.props.warningNotice(
				this.props.translate( 'The connection could not be made because no account was selected.', {
					comment: 'Warning notice when sharing connection dialog was closed without selection',
				} ),
				{ id: 'publicize' }
			);
			this.setState( { isConnecting: false } );
			this.props.recordTracksEvent( 'calypso_connections_cancel_button_in_modal_click', {
				service: this.props.service.ID,
				path,
			} );
			this.props.recordGoogleEvent(
				'Sharing',
				'Clicked Cancel Button in Modal',
				this.props.service.ID
			);
		}

		// Reset active account selection
		this.setState( { isSelectingAccount: false } );
	};

	/**
	 * Create or update the connection
	 * @param {number} keyringConnectionId Keyring conneciton ID.
	 * @param {number} externalUserId      Optional. User ID for the service. Default: 0.
	 */
	createOrUpdateConnection = ( keyringConnectionId, externalUserId = 0 ) => {
		if ( this.props.hasMultiConnections ) {
			return this.props.createSiteConnection(
				this.props.siteId,
				keyringConnectionId,
				externalUserId
			);
		}

		const existingConnection = find( this.props.siteUserConnections, {
			keyring_connection_ID: keyringConnectionId,
		} );

		if ( this.props.siteId && existingConnection ) {
			// If a Keyring connection is already in use by another connection,
			// we should trigger an update. There should only be one connection,
			// so we're correct in using the connection ID from the first
			this.props.updateSiteConnection( existingConnection, { external_user_ID: externalUserId } );
		} else {
			this.props.createSiteConnection( this.props.siteId, keyringConnectionId, externalUserId );
		}
	};

	connectAnother = () => {
		const { path } = this.props;

		this.props.recordTracksEvent( 'calypso_connections_connect_another_button_click', {
			service: this.props.service.ID,
			path,
		} );
		this.props.recordGoogleEvent(
			'Sharing',
			'Clicked Connect Another Account Button',
			this.props.service.ID
		);
		this.addConnection( this.props.service );
	};

	/**
	 * Sets a connection to be site-wide or not.
	 * @param  {Object}   connection Connection to update.
	 * @param  {boolean}  shared     Whether the connection can be used by other users.
	 * @returns {Function}            Action thunk
	 */
	toggleSitewideConnection = ( connection, shared ) =>
		this.props.updateSiteConnection( connection, { shared } );

	/**
	 * Lets users re-authenticate their Keyring connections if lost.
	 * @param {Array} connections Optional. Broken connections.
	 *                            Default: All broken connections for this service.
	 */
	refresh = ( connections = this.props.brokenConnections ) => {
		this.getConnections( connections ).map( ( connection ) => {
			const keyringConnection = find( this.props.keyringConnections, ( token ) => {
				// Publicize connections store the token id as `keyring_connection_ID`
				const tokenID =
					'publicize' === token.type ? connection.keyring_connection_ID : connection.ID;
				return token.ID === tokenID;
			} );

			if ( keyringConnection ) {
				this.setState( { isRefreshing: true } );

				// Attempt to create a new connection. If a Keyring connection ID
				// is not provided, the user will need to authorize the app
				requestExternalAccess( connection.refresh_URL, () => {
					// When the user has finished authorizing the connection
					// (or otherwise closed the window), force a refresh
					const reFetchConnections = [
						this.fetchConnection( connection ),
						this.props.requestKeyringConnections(),
					];
					Promise.all( reFetchConnections ).then( () => {
						this.setState( { isRefreshing: false } );
					} );
				} );
			} else {
				this.props.errorNotice(
					this.props.translate( 'The %(service)s account was unable to be reconnected.', {
						args: { service: this.props.service.label },
						context: 'Sharing: Publicize reconnection confirmation',
					} ),
					{ id: 'publicize' }
				);
			}
		} );
	};

	/**
	 * Fetch connections
	 * @param {Object} connection Connection to update.
	 * @returns {Function} Action thunk
	 */
	fetchConnection = ( connection ) =>
		this.props.fetchConnection( this.props.siteId, connection.ID );

	/**
	 * Checks whether any connection can be removed.
	 * @returns {boolean} true if there's any removable; otherwise, false.
	 */
	canRemoveConnection = () => {
		return this.props.removableConnections.length > 0;
	};

	/**
	 * Deletes the passed connections.
	 * @param {Array} connections Optional. Connections to be deleted.
	 *                            Default: All connections for this service.
	 */
	removeConnection = ( connections = this.props.removableConnections ) => {
		this.setState( { isDisconnecting: true } );
		connections.map( this.props.deleteSiteConnection );
	};

	constructor() {
		super( ...arguments );

		this.state = {
			isOpen: false, // The service is visually opened
			isConnecting: false, // A pending connection is awaiting authorization
			isDisconnecting: false, // A pending disconnection is awaiting completion
			isRefreshing: false, // A pending refresh is awaiting completion
			isSelectingAccount: false, // The modal to select an account is open
			isAwaitingConnections: false, // Waiting for Keyring Connections request to finish
		};
	}

	// @TODO: Please update https://github.com/Automattic/wp-calypso/issues/58453 if you are refactoring away from UNSAFE_* lifecycle methods!
	UNSAFE_componentWillReceiveProps( nextProps ) {
		if ( ! isEqual( this.props.siteUserConnections, nextProps.siteUserConnections ) ) {
			this.setState( {
				isConnecting: false,
				isDisconnecting: false,
				isSelectingAccount: false,
			} );
		}

		if ( ! isEqual( this.props.brokenConnections, nextProps.brokenConnections ) ) {
			this.setState( { isRefreshing: false } );
		}

		if ( this.state.isAwaitingConnections ) {
			this.setState( { isAwaitingConnections: false } );

			/**
			 * This immediately connects the account, which is needed for non-publicize accounts
			 */
			if (
				get( nextProps, 'service.type' ) !== 'publicize' &&
				this.didKeyringConnectionSucceed( nextProps.availableExternalAccounts )
			) {
				const account = find( nextProps.availableExternalAccounts, { isConnected: false } );
				this.addConnection( nextProps.service, account.keyringConnectionId );
				this.setState( { isConnecting: false } );
			} else if ( this.didKeyringConnectionSucceed( nextProps.availableExternalAccounts ) ) {
				this.setState( { isSelectingAccount: true } );
			}
		}
	}

	/**
	 * Get current connections
	 * @param  {Array} overrides Optional. If it is passed, just return the argument
	 *                           instead of the default connections.
	 * @returns {Array} connections
	 */
	getConnections( overrides ) {
		return overrides || this.props.siteUserConnections;
	}

	/**
	 * Given a service name and optional site ID, returns the current status of the
	 * service's connection.
	 * @param {string} service The name of the service to check
	 * @returns {string} Connection status.
	 */
	getConnectionStatus( service, serviceStatus = 'ok' ) {
		let status;

		if ( this.props.isFetching ) {
			// When connections are still loading, we don't know the status
			status = 'unknown';
		} else if ( ! some( this.getConnections(), { service } ) ) {
			// If no connections exist, the service isn't connected
			status = 'not-connected';
		} else if ( some( this.getConnections(), { status: 'broken' } ) ) {
			// A problematic connection exists
			status = 'reconnect';
		} else if ( some( this.getConnections(), { status: 'refresh-failed' } ) ) {
			// We need to manually refresh a token
			status = 'refresh-failed';
		} else if ( some( this.getConnections(), isConnectionInvalidOrMustReauth ) ) {
			// A valid connection is not available anymore, user must reconnect
			status = 'must-disconnect';
		} else {
			// If all else passes, assume service is connected
			status = 'connected';
		}

		status = 'ok' !== serviceStatus && 'not-connected' !== status ? 'must-disconnect' : status;
		return status;
	}

	getConnectionExpiry() {
		const expiringConnections = this.getConnections().filter( ( conn ) => conn.expires );
		const oldestConnection = expiringConnections.sort( ( a, b ) => a.expires - b.expires ).shift();
		return oldestConnection?.expires;
	}

	/**
	 * Given a service name and optional site ID, returns whether the Keyring
	 * authorization attempt succeeded in creating new Keyring account options.
	 * @param {Array} externalAccounts Props to check on if a keyring connection succeeded.
	 * @returns {boolean} Whether the Keyring authorization attempt succeeded
	 */
	didKeyringConnectionSucceed( externalAccounts ) {
		const hasAnyConnectionOptions = some( externalAccounts, { isConnected: false } );

		if ( ! externalAccounts.length ) {
			// At this point, if there are no available accounts to
			// select, we must assume the user closed the popup
			// before completing the authorization step.
			this.props.warningNotice(
				this.props.translate(
					'The %(service)s connection could not be made because no account was selected.',
					{
						args: { service: this.props.service.label },
						context: 'Sharing: Publicize connection confirmation',
					}
				),
				{ id: 'publicize' }
			);
			this.setState( { isConnecting: false } );
		} else if ( ! hasAnyConnectionOptions ) {
			// Similarly warn user if all options are connected
			this.props.warningNotice(
				this.props.translate(
					'The %(service)s connection could not be made because all available accounts are already connected.',
					{
						args: { service: this.props.service.label },
						context: 'Sharing: Publicize connection confirmation',
					}
				),
				{ id: 'publicize' }
			);
			this.setState( { isConnecting: false } );
		}
		this.setState( { justConnected: true } );

		return externalAccounts.length && hasAnyConnectionOptions;
	}

	renderLogo() {
		return (
			/* eslint-disable wpcalypso/jsx-classname-namespace */
			<SocialLogo
				icon={ this.props.service.ID.replace( /_/g, '-' ) }
				size={ 48 }
				className="sharing-service__logo"
			/>
		);
	}

	shouldBeExpandable( status ) {
		return (
			this.shouldBeExpanded( status ) ||
			SERVICES_WITH_EXAMPLES.includes( this.props.service.ID ) ||
			this.getConnections().length > 0
		);
	}

	shouldBeExpanded( status ) {
		if ( this.isMailchimpService() && this.state.justConnected ) {
			return true;
		}

		if ( this.isGooglePhotosMigration( status ) ) {
			return true;
		}

		if ( this.props.isExpanded ) {
			return true;
		}

		return false;
	}

	isMailchimpService = () => {
		if ( ! config.isEnabled( 'mailchimp' ) ) {
			return false;
		}
		return get( this, 'props.service.ID' ) === 'mailchimp';
	};

	// Is the service a Google Photos that requires migration to Google Photos Picker API
	isGooglePhotosMigration( status ) {
		if ( status === 'must-disconnect' && get( this, 'props.service.ID' ) === 'google_photos' ) {
			return true;
		}

		return false;
	}

	renderBadges() {
		return this.props.isNew ? (
			<Badge className="service__new-badge">{ this.props.translate( 'New' ) }</Badge>
		) : null;
	}

	render() {
		const connections = this.getConnections();
		const serviceStatus = this.props.service.status ?? 'ok';
		const connectionStatus = this.getConnectionStatus( this.props.service.ID, serviceStatus );
		const earliestExpiry = this.getConnectionExpiry();
		const classNames = clsx( 'sharing-service', this.props.service.ID, connectionStatus, {
			'is-open': this.state.isOpen,
		} );
		const accounts = this.state.isSelectingAccount ? this.props.availableExternalAccounts : [];
		const showLinkedInNotice =
			'linkedin' === this.props.service.ID && some( connections, { status: 'must_reauth' } );

		const header = (
			<div>
				{ ! this.isMailchimpService( connectionStatus ) && this.renderLogo() }
				{ this.isMailchimpService( connectionStatus ) && renderMailchimpLogo() }

				<div className="sharing-service__name">
					<h3>
						{ this.props.service.label } { this.renderBadges() }
					</h3>
					<ServiceDescription
						service={ this.props.service }
						status={ connectionStatus }
						expires={ earliestExpiry }
						numberOfConnections={ this.getConnections().length }
					/>
				</div>
				{ showLinkedInNotice && (
					<Notice isCompact status="is-error" className="sharing-service__notice">
						{ this.props.translate(
							'Time to reauthenticate! Some changes to LinkedIn mean that you need to re-enable Jetpack Social ' +
								'by disconnecting and reconnecting your account.'
						) }
					</Notice>
				) }
			</div>
		);

		const action = (
			<ServiceAction
				status={ 'ok' !== serviceStatus ? 'must-disconnect' : connectionStatus }
				service={ this.props.service }
				onAction={ this.performAction }
				isConnecting={ this.state.isConnecting }
				isRefreshing={ this.state.isRefreshing }
				isDisconnecting={ this.state.isDisconnecting }
			/>
		);

		if ( 'ok' !== serviceStatus ) {
			return (
				<li>
					<FoldableCard
						disabled={ 'must-disconnect' !== connectionStatus }
						compact
						header={ header }
						className={ classNames }
						summary={
							[ 'connected', 'reconnect', 'refresh-falied', 'must-disconnect' ].includes(
								connectionStatus
							)
								? action
								: undefined
						}
					/>
					<Notice isCompact status="is-error" className="sharing-service__unsupported">
						{ this.props.translate(
							'X (Twitter) is {{a}}no longer supported{{/a}}. You can still use our quick {{a2}}manual sharing{{/a2}} feature from the post editor to share to it!',
							{
								components: {
									a: (
										<ExternalLink
											target="_blank"
											icon
											iconSize={ 14 }
											href={ localizeUrl(
												this.props.isJetpack || isJetpackCloud()
													? 'https://jetpack.com/2023/04/29/the-end-of-twitter-auto-sharing/'
													: 'https://wordpress.com/blog/2023/04/29/why-twitter-auto-sharing-is-coming-to-an-end/'
											) }
										/>
									),
									a2: (
										<ExternalLink
											target="_blank"
											icon
											iconSize={ 14 }
											href={ localizeUrl(
												'https://jetpack.com/redirect/?source=jetpack-social-manual-sharing-help'
											) }
										/>
									),
								},
							}
						) }
					</Notice>
				</li>
			);
		}

		return (
			<li>
				<AccountDialog
					isVisible={ this.state.isSelectingAccount }
					service={ this.props.service }
					accounts={ accounts }
					onAccountSelected={ this.addConnection }
					disclaimerText={ this.getDisclamerText && this.getDisclamerText() }
				/>
				<FoldableCard
					className={ classNames }
					header={ header }
					clickableHeader
					//For Mailchimp we want to open settings, because in other services we have the popup.
					expandable={ this.shouldBeExpandable( connectionStatus ) }
					expanded={ this.shouldBeExpanded( connectionStatus ) }
					compact
					summary={ action }
					expandedSummary={
						this.props.service.ID === 'mastodon' || this.props.service.ID === 'bluesky'
							? cloneElement( action, { isExpanded: true } )
							: action
					}
				>
					<div
						className={ clsx( 'sharing-service__content', {
							'is-placeholder': this.props.isFetching,
						} ) }
					>
						{ 'not-connected' === connectionStatus && (
							<ServiceExamples
								service={ this.props.service }
								action={ this.performAction }
								connectAnother={ this.connectAnother }
								isConnecting={ this.state.isConnecting }
								connections={ connections }
							/>
						) }
						{ this.isGooglePhotosMigration( connectionStatus ) && <GooglePhotosMigration /> }

						{ ! this.isMailchimpService( connectionStatus ) && (
							<ServiceConnectedAccounts
								connect={ this.connectAnother }
								service={ this.props.service }
							>
								{ connections.map( ( connection ) => (
									<Connection
										key={ connection.keyring_connection_ID }
										connection={ connection }
										isDisconnecting={ this.state.isDisconnecting }
										isRefreshing={ this.state.isRefreshing }
										onDisconnect={ this.removeConnection }
										onRefresh={ this.refresh }
										onToggleSitewideConnection={ this.toggleSitewideConnection }
										service={ this.props.service }
										showDisconnect={
											connections.length > 1 ||
											[ 'broken', 'must_reauth' ].includes( connection.status )
										}
									/>
								) ) }
							</ServiceConnectedAccounts>
						) }
						<ServiceTip service={ this.props.service } />
						{ this.isMailchimpService( connectionStatus ) && connectionStatus === 'connected' && (
							<MailchimpSettings keyringConnections={ this.props.keyringConnections } />
						) }
					</div>
				</FoldableCard>
			</li>
		);
	}
}

/**
 * Connect a SharingService component to a Redux store.
 * @param  {Component} sharingService     A SharingService component
 * @param  {Function}  mapStateToProps    Optional. A function to pick props from the state.
 *                                        It should return a plain object, which will be merged into the component's props.
 * @param  {Object}    mapDispatchToProps Optional. An object that contains additional action creators. Default: {}
 * @returns {Component} A highter-order service component
 */
export function connectFor( sharingService, mapStateToProps, mapDispatchToProps = {} ) {
	return connect(
		( state, { service } ) => {
			const siteId = getSelectedSiteId( state );
			const userId = getCurrentUserId( state );
			const brokenPublicizeConnections = getBrokenSiteUserConnectionsForService(
				state,
				siteId,
				userId,
				service.ID
			);
			const refreshableConnections = getRefreshableKeyringConnections( state, service.ID );
			const props = {
				availableExternalAccounts: getAvailableExternalAccounts( state, service.ID ),
				brokenConnections: brokenPublicizeConnections.concat( refreshableConnections ),
				isFetching: isFetchingConnections( state, siteId ),
				keyringConnections: getKeyringConnectionsByName( state, service.ID ),
				removableConnections: getRemovableConnections( state, service.ID ),
				path: getCurrentRouteParameterized( state, siteId ),
				service,
				siteId,
				siteUserConnections: getSiteUserConnectionsForService( state, siteId, userId, service.ID ),
				userId,
				isExpanded: isServiceExpanded( state, service ),
				isP2HubSite: isSiteP2Hub( state, siteId ),
				isJetpack: isJetpackSite( state, siteId ),
				hasMultiConnections: siteHasFeature( state, siteId, 'social-multi-connections' ),
			};
			return typeof mapStateToProps === 'function' ? mapStateToProps( state, props ) : props;
		},
		{
			createSiteConnection,
			deleteSiteConnection,
			successNotice,
			errorNotice,
			fetchConnection,
			recordGoogleEvent,
			recordTracksEvent,
			requestP2KeyringConnections,
			requestKeyringConnections,
			updateSiteConnection,
			warningNotice,
			...mapDispatchToProps,
		}
	)( localize( sharingService ) );
}

export default connectFor( SharingService );
