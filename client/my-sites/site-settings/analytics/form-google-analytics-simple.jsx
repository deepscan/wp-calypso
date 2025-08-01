import {
	findFirstSimilarPlanKey,
	FEATURE_GOOGLE_ANALYTICS,
	TYPE_PREMIUM,
	getPlan,
	PLAN_PREMIUM,
} from '@automattic/calypso-products';
import {
	FormInputValidation as FormTextValidation,
	FormLabel,
	Button,
} from '@automattic/components';
import { ToggleControl } from '@wordpress/components';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import googleIllustration from 'calypso/assets/images/illustrations/google-analytics-logo.svg';
import UpsellNudge from 'calypso/blocks/upsell-nudge';
import FormFieldset from 'calypso/components/forms/form-fieldset';
import FormTextInput from 'calypso/components/forms/form-text-input';
import InlineSupportLink from 'calypso/components/inline-support-link';
import { PanelCard, PanelCardHeading } from 'calypso/components/panel';
import { getSiteAdminUrl } from 'calypso/state/sites/selectors';

import './style.scss';

const GoogleAnalyticsSimpleForm = ( {
	displayForm,
	enableForm,
	fields,
	handleCodeChange,
	handleFieldChange,
	handleFieldFocus,
	handleFieldKeypress,
	handleSubmitForm,
	isCodeValid,
	isRequestingSettings,
	isSavingSettings,
	isSubmitButtonDisabled,
	placeholderText,
	setDisplayForm,
	showUpgradeNudge,
	site,
	siteId,
	translate,
} ) => {
	const nudgeTitle = translate(
		'Connect your site to Google Analytics in seconds with the %(premiumPlanName)s plan',
		{ args: { premiumPlanName: getPlan( PLAN_PREMIUM )?.getTitle() } }
	);
	const statsUrl = useSelector( ( state ) =>
		getSiteAdminUrl( state, siteId, 'admin.php?page=stats' )
	);

	useEffect( () => {
		if ( fields?.wga?.code ) {
			setDisplayForm( true );
		} else {
			setDisplayForm( false );
		}
	}, [ fields, setDisplayForm ] );

	const handleFormToggle = () => {
		if ( displayForm ) {
			setDisplayForm( false );
			handleFieldChange( 'code', '', () => {
				handleSubmitForm();
			} );
		} else {
			setDisplayForm( true );
		}
	};

	const renderForm = () => {
		const plan = findFirstSimilarPlanKey( site.plan.product_slug, {
			type: TYPE_PREMIUM,
		} );

		const nudge = (
			<UpsellNudge
				description={ translate(
					"Add your unique Measurement ID to monitor your site's performance in Google Analytics."
				) }
				event="google_analytics_settings"
				feature={ FEATURE_GOOGLE_ANALYTICS }
				plan={ plan }
				showIcon
				title={ nudgeTitle }
			/>
		);
		return (
			<form
				aria-label="Google Analytics Site Settings"
				id="analytics"
				onSubmit={ handleSubmitForm }
			>
				<>
					<PanelCardHeading>{ translate( 'Google Analytics' ) }</PanelCardHeading>
					<div className="analytics site-settings__analytics">
						<div className="analytics site-settings__analytics-illustration">
							<img src={ googleIllustration } alt="" />
						</div>
						<div className="analytics site-settings__analytics-text">
							<p>
								{ translate(
									'A free analytics tool that offers additional insights into your site.'
								) }{ ' ' }
							</p>
						</div>
					</div>
					{ displayForm && (
						<div className="analytics site-settings__analytics-form-content">
							<FormFieldset>
								<FormLabel htmlFor="wgaCode">
									{ translate( 'Google Analytics Measurement ID', { context: 'site setting' } ) }
								</FormLabel>
								<FormTextInput
									name="wgaCode"
									id="wgaCode"
									value={ fields.wga ? fields.wga.code : '' }
									onChange={ handleCodeChange }
									placeholder={ placeholderText }
									disabled={ isRequestingSettings || ! enableForm }
									onFocus={ handleFieldFocus }
									onKeyPress={ handleFieldKeypress }
									isError={ ! isCodeValid }
								/>
								{ ! isCodeValid && (
									<FormTextValidation
										isError
										text={ translate( 'Invalid Google Analytics Measurement ID.' ) }
									/>
								) }
								<InlineSupportLink
									supportContext="google-analytics-measurement-id"
									tracksEvent="calypso_traffic_settings_google_support_click"
								>
									{ translate( 'Where can I find my Measurement ID?' ) }
								</InlineSupportLink>
							</FormFieldset>
							<p>
								{ translate(
									'Google Analytics is a free service that complements our {{a}}built-in stats{{/a}} ' +
										'with different insights into your traffic. Jetpack Stats and Google Analytics ' +
										'use different methods to identify and track activity on your site, so they will ' +
										'normally show slightly different totals for your visits, views, etc.',
									{
										components: {
											a: <a href={ statsUrl } />,
										},
									}
								) }
							</p>
						</div>
					) }
				</>
				{ showUpgradeNudge && site && site.plan ? (
					nudge
				) : (
					<>
						<div className="analytics site-settings__analytics">
							<ToggleControl
								checked={ displayForm }
								disabled={ isRequestingSettings || isSavingSettings }
								onChange={ handleFormToggle }
								label={ translate( 'Add Google Analytics' ) }
							/>
						</div>
						<Button
							className="is-primary"
							disabled={ isSubmitButtonDisabled }
							busy={ isSavingSettings }
							onClick={ handleSubmitForm }
						>
							{ translate( 'Save' ) }
						</Button>
					</>
				) }
			</form>
		);
	};

	// we need to check that site has loaded first... a placeholder would be better,
	// but returning null is better than a fatal error for now
	if ( ! site ) {
		return null;
	}
	return <PanelCard>{ renderForm() }</PanelCard>;
};

export default GoogleAnalyticsSimpleForm;
