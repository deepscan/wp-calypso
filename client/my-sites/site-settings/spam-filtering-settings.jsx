import {
	PRODUCT_JETPACK_ANTI_SPAM,
	WPCOM_FEATURES_AKISMET,
	WPCOM_FEATURES_ANTISPAM,
	isJetpackAntiSpam,
} from '@automattic/calypso-products';
import {
	FormInputValidation,
	FormLabel,
	Gridicon,
	FoldableCard,
	ExternalLink,
} from '@automattic/components';
import { localize } from 'i18n-calypso';
import { includes, isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import UpsellNudge from 'calypso/blocks/upsell-nudge';
import FormFieldset from 'calypso/components/forms/form-fieldset';
import FormSettingExplanation from 'calypso/components/forms/form-setting-explanation';
import FormTextInput from 'calypso/components/forms/form-text-input';
import SupportInfo from 'calypso/components/support-info';
import { isFetchingSitePurchases } from 'calypso/state/purchases/selectors';
import isJetpackSettingsSaveFailure from 'calypso/state/selectors/is-jetpack-settings-save-failure';
import siteHasFeature from 'calypso/state/selectors/site-has-feature';
import { getSiteProducts } from 'calypso/state/sites/selectors';
import { getSelectedSiteId, getSelectedSiteSlug } from 'calypso/state/ui/selectors';

const SpamFilteringSettings = ( {
	currentAkismetKey,
	dirtyFields,
	fields,
	hasAkismetFeature,
	hasAkismetKeyError,
	hasAntiSpamFeature,
	hasJetpackAntiSpamProduct,
	isRequestingSettings,
	isRequestingSitePurchases,
	isSavingSettings,
	onChangeField,
	siteSlug,
	translate,
} ) => {
	const { akismet: akismetActive, wordpress_api_key } = fields;
	const isStoredKey = wordpress_api_key === currentAkismetKey && !! wordpress_api_key;
	const isDirty = includes( dirtyFields, 'wordpress_api_key' );
	const isCurrentKeyEmpty = isEmpty( currentAkismetKey );
	const isKeyFieldEmpty = isEmpty( wordpress_api_key );
	const isEmptyKey = isCurrentKeyEmpty || isKeyFieldEmpty;
	const inTransition = isRequestingSettings || isSavingSettings || isRequestingSitePurchases;
	const isValidKey =
		( wordpress_api_key && isStoredKey ) ||
		( wordpress_api_key && isDirty && isStoredKey && ! hasAkismetKeyError );
	const isInvalidKey = ( isDirty && hasAkismetKeyError && ! isStoredKey ) || isEmptyKey;
	let validationText;
	let className;
	let header = null;

	if ( inTransition ) {
		return null;
	}

	if (
		! ( hasAkismetFeature || hasAntiSpamFeature || hasJetpackAntiSpamProduct ) &&
		! akismetActive
	) {
		return (
			<UpsellNudge
				title={ translate( 'Automatically clear spam from comments and forms' ) }
				description={ translate(
					'Save time, get more responses, give your visitors a better experience - all without lifting a finger.'
				) }
				event="calypso_akismet_settings_upgrade_nudge"
				feature={ WPCOM_FEATURES_ANTISPAM }
				showIcon
				href={ `/checkout/${ siteSlug }/${ PRODUCT_JETPACK_ANTI_SPAM }` }
			/>
		);
	}

	if ( isValidKey ) {
		validationText = translate( 'Your Antispam key is valid.' );
		className = 'is-valid';
		header = (
			<div>
				<Gridicon icon="checkmark" />
				{ translate( 'Your site is protected from spam.' ) }
			</div>
		);
	}

	if ( isInvalidKey ) {
		validationText = translate( 'Please enter a valid Antispam API key.' );
		className = 'is-error';
		header = (
			<div>
				<Gridicon icon="notice-outline" />
				{ translate( 'Your site needs an Antispam key.' ) }
			</div>
		);
	}

	return (
		<FoldableCard
			header={ header }
			className="spam-filtering__foldable-card site-settings__foldable-card"
		>
			<FormFieldset>
				<div className="spam-filtering__settings site-settings__child-settings">
					<SupportInfo
						text={ translate( 'Removes spam from comments and contact forms.' ) }
						link="https://jetpack.com/features/security/spam-filtering/"
					/>
					<FormLabel htmlFor="wordpress_api_key">{ translate( 'Your API key' ) }</FormLabel>
					<FormTextInput
						name="wordpress_api_key"
						className={ className }
						value={ wordpress_api_key }
						disabled={ inTransition || ! akismetActive }
						onChange={ onChangeField( 'wordpress_api_key' ) }
					/>
					{ ( isValidKey || isInvalidKey ) && ! inTransition && (
						<FormInputValidation isError={ isInvalidKey } text={ validationText } />
					) }
					{ ( ! wordpress_api_key || isInvalidKey || ! isValidKey ) && (
						<FormSettingExplanation>
							{ translate(
								"If you don't already have an API key, then" +
									' {{link}}get your API key here{{/link}},' +
									" and you'll be guided through the process of getting one in a new window.",
								{
									components: {
										link: (
											<ExternalLink icon href="https://akismet.com/wordpress/" target="_blank" />
										),
									},
								}
							) }
						</FormSettingExplanation>
					) }
				</div>
			</FormFieldset>
		</FoldableCard>
	);
};

SpamFilteringSettings.propTypes = {
	dirtyFields: PropTypes.array,
	fields: PropTypes.object,
	hasAkismetKeyError: PropTypes.bool,
	isRequestingSettings: PropTypes.bool,
	isSavingSettings: PropTypes.bool,
	settings: PropTypes.object,
	siteSlug: PropTypes.string,
};

export default connect( ( state, { dirtyFields, fields } ) => {
	const selectedSiteId = getSelectedSiteId( state );
	const selectedSiteSlug = getSelectedSiteSlug( state );
	const hasAkismetKeyError =
		isJetpackSettingsSaveFailure( state, selectedSiteId, fields ) &&
		includes( dirtyFields, 'wordpress_api_key' );
	const hasAkismetFeature = siteHasFeature( state, selectedSiteId, WPCOM_FEATURES_AKISMET );
	const hasAntiSpamFeature = siteHasFeature( state, selectedSiteId, WPCOM_FEATURES_ANTISPAM );
	const hasJetpackAntiSpamProduct =
		getSiteProducts( state, selectedSiteId )?.filter( isJetpackAntiSpam ).length > 0;

	return {
		hasAkismetFeature,
		hasAkismetKeyError,
		hasAntiSpamFeature,
		hasJetpackAntiSpamProduct,
		siteSlug: selectedSiteSlug,
		isRequestingSitePurchases: isFetchingSitePurchases( state ),
	};
} )( localize( SpamFilteringSettings ) );
