import { isJetpackFreePlan, isFreePlan } from '@automattic/calypso-products';
import { SiteDetails } from '@automattic/data-stores';
import { localizeUrl } from '@automattic/i18n-utils';
import { Notice } from '@wordpress/components';
import { useTranslate, fixMe } from 'i18n-calypso';
import InlineSupportLink from 'calypso/components/inline-support-link';
import { useSelector } from 'calypso/state';
import getIsSiteWPCOM from 'calypso/state/selectors/is-site-wpcom';

import './style.scss';

export default function SubscriberImportLimitNotice( {
	closeModal = () => {},
	selectedSite,
}: {
	closeModal?: () => void;
	selectedSite: SiteDetails;
} ) {
	const translate = useTranslate();
	const currentPlan = selectedSite?.plan?.product_slug || '';
	const isOnFreePlan = isFreePlan( currentPlan ) || isJetpackFreePlan( currentPlan );
	const isWPCOMSite = useSelector( ( state ) => getIsSiteWPCOM( state, selectedSite?.ID ) );

	if ( ! isOnFreePlan || ! selectedSite?.ID ) {
		return null;
	}

	const supportLink = ! isWPCOMSite
		? 'https://jetpack.com/support/newsletter/import-subscribers/#add-up-to-100-subscribers'
		: 'https://wordpress.com/support/import-subscribers-to-a-newsletter/#import-limits';
	const supportPostId = ! isWPCOMSite ? null : 220199;

	return (
		<Notice status="info" isDismissible={ false } className="subscribers-import-limit-notice">
			{ fixMe( {
				text: 'Import up to 100 subscribers on the Free plan. Upgrade to add more.',
				newCopy: translate(
					'Import {{supportLink}}up to 100 subscribers{{/supportLink}} on the Free plan. {{upgradeLink}}Upgrade{{/upgradeLink}} to add more.',
					{
						components: {
							supportLink: (
								<InlineSupportLink
									noWrap={ false }
									showIcon={ ! supportPostId }
									supportLink={ localizeUrl( supportLink ) }
									supportPostId={ supportPostId }
									onClick={ supportPostId && closeModal }
								/>
							),
							upgradeLink: <a href={ `/plans/${ selectedSite.slug }` } />,
						},
					}
				),
				oldCopy: translate(
					'Note: On the free plan, {{supportLink}}you can import up to 100 subscribers.{{/supportLink}}',
					{
						components: {
							supportLink: (
								<InlineSupportLink
									noWrap={ false }
									showIcon={ false }
									supportLink={ localizeUrl(
										'https://wordpress.com/support/import-subscribers-to-a-newsletter/#import-limits'
									) }
									supportPostId={ 220199 }
								/>
							),
						},
					}
				),
			} ) }
		</Notice>
	);
}
