import { Card, LoadingPlaceholder } from '@automattic/components';
import { ToggleControl } from '@wordpress/components';
import { localize } from 'i18n-calypso';
import { get } from 'lodash';
import { Component } from 'react';
import { connect } from 'react-redux';
import FormSectionHeading from 'calypso/components/forms/form-section-heading';
import Main from 'calypso/components/main';
import NavigationHeader from 'calypso/components/navigation-header';
import PageViewTracker from 'calypso/lib/analytics/page-view-tracker';
import twoStepAuthorization from 'calypso/lib/two-step-authorization';
import ReauthRequired from 'calypso/me/reauth-required';
import {
	fetchSettings,
	toggleWPcomEmailSetting,
	saveSettings,
} from 'calypso/state/notification-settings/actions';
import {
	getNotificationSettings,
	isFetchingNotificationsSettings,
} from 'calypso/state/notification-settings/selectors';
import hasJetpackSites from 'calypso/state/selectors/has-jetpack-sites';
import Navigation from '../navigation';
import SubscriptionManagementBackButton from '../subscription-management-back-button';
import EmailCategory from './email-category';

import './style.scss';

/**
 * Module variables for wpcom
 */
const options = {
	marketing: 'marketing',
	research: 'research',
	community: 'community',
	promotion: 'promotion',
	news: 'news',
	digest: 'digest',
	reports: 'reports',
	news_developer: 'news_developer',
	scheduled_updates: 'scheduled_updates',
};

/**
 * Module variables for jetpack
 */
const jetpackOptions = {
	jetpack_marketing: 'jetpack_marketing',
	jetpack_research: 'jetpack_research',
	jetpack_promotion: 'jetpack_promotion',
	jetpack_news: 'jetpack_news',
	jetpack_reports: 'jetpack_reports',
};

class WPCOMNotifications extends Component {
	static displayName = 'WPCOMNotifications';

	// TODO: Add propTypes

	componentDidMount() {
		this.props.fetchSettings();
	}

	unsubscribeFromAll = ( productOptions ) => ( toggleValue ) => {
		const toggledSettings = {};
		Object.keys( productOptions ).forEach( ( option ) => {
			if ( this.props.settings[ option ] !== toggleValue ) {
				toggledSettings[ option ] = toggleValue;
				this.props.toggleWPcomEmailSetting( option );
			}
		} );

		this.props.saveSettings( 'wpcom', toggledSettings );
	};

	toggleShouldBeOff = ( productOptions ) => {
		return Object.keys( productOptions ).some(
			( key ) => key in this.props.settings && this.props.settings[ key ] === true
		);
	};

	renderWpcomPreferences = () => {
		const { settings, translate } = this.props;

		return (
			<div>
				<p>
					{ translate(
						"We'll always send important emails regarding your account, security, " +
							'privacy, and purchase transactions, but you can get some helpful extras, too.'
					) }
				</p>

				<FormSectionHeading>
					{ this.props.translate( 'Email from WordPress.com' ) }
				</FormSectionHeading>

				<ToggleControl
					__nextHasNoMarginBottom
					checked={ this.toggleShouldBeOff( options ) }
					className="wpcom-settings__notification-settings-emailsection-toggle"
					label={
						this.toggleShouldBeOff( options )
							? this.props.translate( 'Unsubscribe from all' )
							: this.props.translate( 'Subscribe to all' )
					}
					onChange={ this.unsubscribeFromAll( options ) }
					disabled={ this.props.isFetching }
				/>

				<EmailCategory
					name={ options.marketing }
					isEnabled={ get( settings, options.marketing ) }
					title={ translate( 'Suggestions' ) }
					description={ translate( 'Tips for getting the most out of WordPress.com.' ) }
				/>

				<EmailCategory
					name={ options.research }
					isEnabled={ get( settings, options.research ) }
					title={ translate( 'Research' ) }
					description={ translate(
						'Opportunities to participate in WordPress.com research and surveys.'
					) }
				/>

				<EmailCategory
					name={ options.community }
					isEnabled={ get( settings, options.community ) }
					title={ translate( 'Community' ) }
					description={ translate(
						'Information on WordPress.com courses and events (online and in-person).'
					) }
				/>

				<EmailCategory
					name={ options.promotion }
					isEnabled={ get( settings, options.promotion ) }
					title={ translate( 'Promotions' ) }
					description={ translate(
						'Sales and promotions for WordPress.com products and services.'
					) }
				/>

				<EmailCategory
					name={ options.news }
					isEnabled={ get( settings, options.news ) }
					title={ translate( 'Newsletter' ) }
					description={ translate( 'WordPress.com news, announcements, and product spotlights.' ) }
				/>

				<EmailCategory
					name={ options.digest }
					isEnabled={ get( settings, options.digest ) }
					title={ translate( 'Digests' ) }
					description={ translate( 'Popular content from the blogs you follow.' ) }
				/>

				<EmailCategory
					name={ options.reports }
					isEnabled={ get( settings, options.reports ) }
					title={ translate( 'Reports' ) }
					description={ translate(
						'Complimentary reports and updates regarding site performance and traffic.'
					) }
				/>

				<EmailCategory
					name={ options.news_developer }
					isEnabled={ get( settings, options.news_developer ) }
					title={ translate( 'Developer Newsletter' ) }
					description={ translate(
						'A once-monthly roundup of notable news for WordPress developers.'
					) }
				/>

				<EmailCategory
					name={ options.scheduled_updates }
					isEnabled={ get( settings, options.scheduled_updates ) }
					title={ translate( 'Scheduled updates' ) }
					description={ translate( 'Complimentary reports regarding scheduled plugin updates.' ) }
				/>

				{ this.props.hasJetpackSites && (
					<>
						<FormSectionHeading>
							{ this.props.translate( 'Email from Jetpack' ) }
						</FormSectionHeading>

						<p>
							{ this.props.translate(
								'Jetpack is a suite of tools connected to your WordPress site, like backups, security, and performance reports.'
							) }
						</p>

						<ToggleControl
							__nextHasNoMarginBottom
							checked={ this.toggleShouldBeOff( jetpackOptions ) }
							className="wpcom-settings__notification-settings-emailsection-toggle"
							label={
								this.toggleShouldBeOff( jetpackOptions )
									? this.props.translate( 'Unsubscribe from all' )
									: this.props.translate( 'Subscribe to all' )
							}
							onChange={ this.unsubscribeFromAll( jetpackOptions ) }
							disabled={ this.props.isFetching }
						/>

						<EmailCategory
							name={ jetpackOptions.jetpack_marketing }
							isEnabled={ get( settings, jetpackOptions.jetpack_marketing ) }
							title={ translate( 'Suggestions' ) }
							description={ translate( 'Tips for getting the most out of Jetpack.' ) }
						/>

						<EmailCategory
							name={ jetpackOptions.jetpack_research }
							isEnabled={ get( settings, jetpackOptions.jetpack_research ) }
							title={ translate( 'Research' ) }
							description={ translate(
								'Opportunities to participate in Jetpack research and surveys.'
							) }
						/>

						<EmailCategory
							name={ jetpackOptions.jetpack_promotion }
							isEnabled={ get( settings, jetpackOptions.jetpack_promotion ) }
							title={ translate( 'Promotions' ) }
							description={ translate( 'Sales and promotions for Jetpack products and services.' ) }
						/>

						<EmailCategory
							name={ jetpackOptions.jetpack_news }
							isEnabled={ get( settings, jetpackOptions.jetpack_news ) }
							title={ translate( 'Newsletter' ) }
							description={ translate( 'Jetpack news, announcements, and product spotlights.' ) }
						/>

						<EmailCategory
							name={ jetpackOptions.jetpack_reports }
							isEnabled={ get( settings, jetpackOptions.jetpack_reports ) }
							title={ translate( 'Reports' ) }
							description={ translate( 'Jetpack security and performance reports.' ) }
						/>
					</>
				) }
			</div>
		);
	};

	renderPlaceholder = () => {
		return <LoadingPlaceholder />;
	};

	render() {
		return (
			<Main wideLayout className="wpcom-settings__main">
				<PageViewTracker
					path="/me/notifications/updates"
					title="Me > Notifications > Updates from WordPress.com"
				/>
				<ReauthRequired twoStepAuthorization={ twoStepAuthorization } />

				<SubscriptionManagementBackButton />

				<NavigationHeader
					navigationItems={ [] }
					label={ this.props.translate( 'Notification Settings' ) }
				/>

				<Navigation path={ this.props.path } />

				<Card>
					{ this.props.settings ? this.renderWpcomPreferences() : this.renderPlaceholder() }
				</Card>
			</Main>
		);
	}
}

export default connect(
	( state ) => ( {
		settings: getNotificationSettings( state, 'wpcom' ),
		hasJetpackSites: hasJetpackSites( state ),
		isFetching: isFetchingNotificationsSettings( state ),
	} ),
	{ fetchSettings, toggleWPcomEmailSetting, saveSettings }
)( localize( WPCOMNotifications ) );
