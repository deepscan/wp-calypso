import { localizeUrl } from '@automattic/i18n-utils';
import { localize } from 'i18n-calypso';
import { connect } from 'react-redux';
import QueryJetpackConnection from 'calypso/components/data/query-jetpack-connection';
import QueryMailchimpLists from 'calypso/components/data/query-mailchimp-lists';
import QueryMailchimpSettings from 'calypso/components/data/query-mailchimp-settings';
import FormSelect from 'calypso/components/forms/form-select';
import InlineSupportLink from 'calypso/components/inline-support-link';
import Notice from 'calypso/components/notice';
import NoticeAction from 'calypso/components/notice/notice-action';
import { getAllLists } from 'calypso/state/mailchimp/lists/selectors';
import { requestSettingsUpdate } from 'calypso/state/mailchimp/settings/actions';
import { getListId } from 'calypso/state/mailchimp/settings/selectors';
import getJetpackConnectionStatus from 'calypso/state/selectors/get-jetpack-connection-status';
import { isJetpackSite } from 'calypso/state/sites/selectors';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';

const MailchimpSettings = ( {
	siteId,
	keyringConnections,
	requestSettingsUpdateAction,
	mailchimpLists,
	mailchimpListId,
	isJetpack,
	isJetpackConnectionBroken,
	translate,
} ) => {
	const chooseMailchimpList = ( event ) => {
		if ( event.target.value === '0' ) {
			// This means we want to turn off sharing for this site.
			requestSettingsUpdateAction(
				siteId,
				{
					follower_list_id: 0,
					keyring_id: 0,
				},
				translate( 'Subscriber emails will not be saved to Mailchimp any more' )
			);
			return;
		}
		const list = mailchimpLists.filter( ( mcList ) => mcList.id === event.target.value )[ 0 ];
		requestSettingsUpdateAction(
			siteId,
			{
				follower_list_id: event.target.value,
				keyring_id: keyringConnections[ 0 ].ID,
			},
			translate( 'Subscriber emails will be saved to the %s Mailchimp list', { args: list.name } )
		);
	};
	const common = (
		<div>
			{ isJetpack && <QueryJetpackConnection siteId={ siteId } /> }
			{ /* eslint-disable-next-line wpcalypso/jsx-classname-namespace */ }
			<div className="sharing-connections__mailchimp-gutenberg_explanation">
				<p>
					{ translate(
						'Start building your mailing list by adding the Mailchimp block to your posts and pages. '
					) }
					<InlineSupportLink
						showIcon={ false }
						supportPostId={ 152657 }
						supportLink={ localizeUrl( 'https://wordpress.com/support/mailchimp-block/' ) }
					>
						{ translate( 'Learn more.' ) }
					</InlineSupportLink>
				</p>
			</div>
		</div>
	);

	if ( isJetpackConnectionBroken ) {
		return (
			<div>
				<Notice
					status="is-warning"
					text={ translate(
						'Jetpack connection for this site is not active. Please reactivate it.'
					) }
					showDismiss={ false }
				/>
				{ common }
			</div>
		);
	}

	return (
		<div>
			<QueryMailchimpLists siteId={ siteId } />
			<QueryMailchimpSettings siteId={ siteId } />
			<p>{ translate( 'What Mailchimp list should subscribers be added to?' ) }</p>
			{ Array.isArray( mailchimpLists ) && mailchimpLists.length === 0 && (
				<Notice
					status="is-info"
					text={ translate(
						"Looks like you've not set up any Mailchimp lists yet. Head to your Mailchimp admin to add a list."
					) }
					showDismiss={ false }
				>
					<NoticeAction href="https://login.mailchimp.com" external />
				</Notice>
			) }
			{ mailchimpLists && mailchimpLists.length > 0 && mailchimpListId === 0 && (
				<Notice
					status="is-warning"
					text={ translate(
						'Subscribers will not be added to Mailchimp for this site. Please select a list to sign them up for your Mailchimp content'
					) }
					showDismiss={ false }
				/>
			) }
			<FormSelect value={ mailchimpListId } onChange={ chooseMailchimpList }>
				<option key="none" value={ 0 }>
					{ translate( 'Do not save subscribers to Mailchimp for this site' ) }
				</option>
				{ mailchimpLists &&
					mailchimpLists.map( ( list ) => (
						<option key={ list.id } value={ list.id }>
							{ list.name }
						</option>
					) ) }
			</FormSelect>
			{ common }
		</div>
	);
};

export const renderMailchimpLogo = () => (
	<svg
		className="sharing-service__logo" // eslint-disable-line wpcalypso/jsx-classname-namespace
		height="48"
		width="48"
		xmlns="http://www.w3.org/2000/svg"
		viewBox="-4 -4 48 48"
	>
		<path
			fill="rgb(46, 68, 83)"
			fillRule="evenodd"
			d="M37.03 25.32c.57 0 1.47.66 1.47 2.26 0 1.58-.65 3.38-.8 3.77C35.32 37.03 29.7 40.2 23 40c-6.24-.19-11.57-3.5-13.9-8.9a6.13 6.13 0 0 1-3.97-1.6 5.9 5.9 0 0 1-2.02-3.78 6.5 6.5 0 0 1 .37-2.99l-1.31-1.11C-3.83 16.52 14.92-4.42 20.9.84l2.04 2.01 1.12-.47c5.26-2.2 9.52-1.14 9.53 2.36 0 1.81-1.15 3.93-3 5.85.67.62 1.2 1.6 1.52 2.7.25.83.3 1.67.32 2.2l.07 2.5.74.2c1.42.4 2.42.93 2.91 1.45.5.52.73 1.02.82 1.6a3.1 3.1 0 0 1-.55 2.26s.16.35.32.85l.28.97zm-14.56 2.63zm14.63.16c.15-.95-.06-1.31-.35-1.49-.3-.19-.66-.12-.66-.12s-.17-1.13-.63-2.16a13.83 13.83 0 0 1-4.53 2.26c-1.56.45-3.68.8-6.04.65-1.31-.1-2.18-.49-2.5.58 2.99 1.1 6.16.63 6.16.63.06 0 .11.04.12.1 0 .05-.02.1-.07.12 0 0-2.43 1.13-6.3-.07.1.91.99 1.32 1.41 1.49.53.2 1.12.3 1.12.3 4.79.83 9.27-1.92 10.28-2.62.07-.05.12 0 .06.1l-.1.13c-1.23 1.6-4.55 3.46-8.87 3.46-1.88 0-3.76-.67-4.45-1.7-1.08-1.58-.06-3.9 1.73-3.66l.78.09a16.3 16.3 0 0 0 8.13-1.31c2.44-1.14 3.36-2.4 3.22-3.4a1.46 1.46 0 0 0-.42-.83 5.25 5.25 0 0 0-2.3-1.1c-.39-.1-.65-.18-.93-.27-.5-.17-.76-.3-.81-1.25l-.13-2.47c-.04-1.05-.17-2.48-1.05-3.07a1.48 1.48 0 0 0-.76-.25c-.26 0-.4.04-.45.05-.5.08-.8.35-1.18.67A4.04 4.04 0 0 1 24.51 14c-.62-.03-1.28-.13-2.03-.17l-.44-.03c-1.73-.08-3.6 1.42-3.9 3.56-.44 2.98 1.7 4.52 2.33 5.43.08.1.17.26.17.4 0 .17-.11.31-.22.43a7.66 7.66 0 0 0-1.36 8.03c1.57 3.68 6.43 5.4 11.18 3.84.63-.21 1.23-.47 1.8-.77 1.07-.52 2-1.24 2.76-2.07a8.27 8.27 0 0 0 2.3-4.54zm-7.9-9.2a3.23 3.23 0 0 1-.52-1.28c-.2-.96-.18-1.65.37-1.74.56-.09.82.49 1.02 1.44.14.64.11 1.23-.04 1.57a3.2 3.2 0 0 0-.82 0zm-4.74.75c-.4-.18-.91-.37-1.53-.34-.88.06-1.65.45-1.87.42-.09-.01-.13-.05-.14-.1-.04-.17.22-.44.48-.63.8-.58 1.84-.71 2.72-.33.42.18.82.5 1.02.83.1.15.11.27.05.33-.1.1-.34-.01-.73-.18zm-.8.45c.71-.08 1.23.25 1.35.45.05.08.03.14.02.16-.06.1-.18.08-.44.05a3.27 3.27 0 0 0-1.66.17s-.26.1-.38.1a.12.12 0 0 1-.12-.12c0-.1.1-.26.25-.4.18-.16.46-.33.98-.4zm3.94 1.68c-.35-.17-.53-.52-.4-.78.12-.26.5-.32.86-.15.35.17.53.52.4.78-.12.25-.5.32-.86.15zm2.25-1.98c.29 0 .51.33.5.72 0 .4-.23.7-.52.7-.28 0-.5-.32-.5-.72 0-.39.24-.7.52-.7zm-14.77-8.58c-.06.06.02.15.09.1A15.1 15.1 0 0 1 27.1 8.94c.07.02.12-.11.05-.15-1-.57-2.54-.95-3.63-.96-.06 0-.09-.06-.05-.1.19-.26.44-.51.68-.7.05-.04.02-.12-.05-.12-1.55.1-3.32.84-4.34 1.54-.05.04-.12 0-.1-.07.07-.38.32-.89.45-1.13.04-.05-.03-.11-.08-.08a17.67 17.67 0 0 0-4.95 4.06zm-7.72 8.2c1.71-4.61 4.57-8.87 8.35-11.8 2.81-2.35 5.84-4.04 5.84-4.04s-1.63-1.9-2.12-2.04C16.4.73 9.85 5.26 5.67 11.25c-1.69 2.43-4.1 6.73-2.95 8.94.14.27.95.97 1.38 1.34a5.15 5.15 0 0 1 3.26-2.1zm2.26 10.14c2.19-.37 2.76-2.76 2.4-5.1-.4-2.66-2.2-3.6-3.4-3.66-.34-.02-.65.01-.9.06-2.17.44-3.39 2.29-3.15 4.7.22 2.16 2.4 4 4.43 4.05.2 0 .41-.01.62-.05zm.83-2.72c.1-.03.22-.06.3.03.02.03.06.1.01.21-.08.19-.4.44-.85.43-.47-.04-1-.38-1.06-1.23-.04-.42.12-.94.22-1.2a1.12 1.12 0 0 0-1.3-1.52c-.3.07-.54.24-.7.5a2.64 2.64 0 0 0-.3.7c-.1.27-.25.35-.36.33-.05 0-.12-.04-.17-.16-.12-.34-.02-1.29.61-1.98a1.9 1.9 0 0 1 1.63-.6c.63.09 1.16.47 1.48 1.09.43.82.05 1.68-.18 2.2l-.06.15c-.15.34-.16.64-.03.84.1.15.28.24.49.24.1 0 .19-.02.27-.03z"
		/>
	</svg>
);

export default connect(
	( state ) => {
		const siteId = getSelectedSiteId( state );
		const isJetpack = isJetpackSite( state, siteId );

		return {
			siteId,
			isJetpack,
			isJetpackConnectionBroken: isJetpack && getJetpackConnectionStatus( state, siteId ) === false,
			mailchimpLists: getAllLists( state, siteId ),
			mailchimpListId: getListId( state, siteId ),
		};
	},
	{
		requestSettingsUpdateAction: requestSettingsUpdate,
	}
)( localize( MailchimpSettings ) );
