import { Card, FormLabel } from '@automattic/components';
import { useTranslate } from 'i18n-calypso';
import { useEffect, useMemo } from 'react';
import SubscriptionsModuleBanner from 'calypso/blocks/subscriptions-module-banner';
import DocumentHead from 'calypso/components/data/document-head';
import QueryJetpackModules from 'calypso/components/data/query-jetpack-modules';
import Main from 'calypso/components/main';
import NavigationHeader from 'calypso/components/navigation-header';
import scrollToAnchor from 'calypso/lib/scroll-to-anchor';
import SettingsSectionHeader from 'calypso/my-sites/site-settings/settings-section-header';
import { useSelector } from 'calypso/state';
import isJetpackModuleActive from 'calypso/state/selectors/is-jetpack-module-active';
import isPrivateSite from 'calypso/state/selectors/is-private-site';
import { isJetpackSite as isJetpackSiteSelector } from 'calypso/state/sites/selectors';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import wrapSettingsForm from '../wrap-settings-form';
import { BylineSettings } from './BylineSettings';
import { EmailsTextSetting } from './EmailsTextSetting';
import { ExcerptSetting } from './ExcerptSetting';
import { FeaturedImageEmailSetting } from './FeaturedImageEmailSetting';
import { PaidNewsletterSection } from './PaidNewsletterSection';
import { ReplyToSetting } from './ReplyToSetting';
import { SenderNameSetting } from './SenderNameSetting';
import { SubscribeFloatingButtonSetting } from './SubscribeFloatingButtonSetting';
import { SubscribeModalOnCommentSetting } from './SubscribeModalOnCommentSetting';
import { SubscribeModalSetting } from './SubscribeModalSetting';
import { SubscribeNavigationSetting } from './SubscribeNavigationSetting';
import { SubscribeOverlaySetting } from './SubscribeOverlaySetting';
import { SubscribePostEndSetting } from './SubscribePostEndSetting';
import { SubscriberLoginNavigationSetting } from './SubscriberLoginNavigationSetting';
import { NewsletterCategoriesSection } from './newsletter-categories-section';
import './style.scss';

const defaultNewsletterCategoryIds: number[] = [];

export type SubscriptionOptions = {
	invitation: string;
	comment_follow: string;
	welcome: string;
};

type Fields = {
	subscription_options?: SubscriptionOptions;
	wpcom_featured_image_in_email?: boolean;
	wpcom_newsletter_categories?: number[] | Record< string, { term_id: number } >;
	wpcom_newsletter_categories_enabled?: boolean;
	wpcom_subscription_emails_use_excerpt?: boolean;
	newsletter_has_active_plan?: boolean;
	jetpack_subscriptions_reply_to?: string;
	jetpack_subscriptions_from_name?: string;
	sm_enabled?: boolean;
	jetpack_subscribe_overlay_enabled?: boolean;
	jetpack_subscribe_floating_button_enabled?: boolean;
	jetpack_subscriptions_subscribe_post_end_enabled?: boolean;
	jetpack_subscriptions_subscribe_navigation_enabled?: boolean;
	jetpack_subscriptions_login_navigation_enabled?: boolean;
	jetpack_verbum_subscription_modal?: boolean;
	jetpack_gravatar_in_email?: boolean;
	jetpack_author_in_email?: boolean;
	jetpack_post_date_in_email?: boolean;
	date_format?: string;
};

/**
 * Atomic and Simple site are getting/saving two different types. This equalizes them to make sure we are all on the same page.
 * @param categoryValue The result from wpcom_newsletter_categories option
 * @returns an array of category ID's
 */
const getNewsletterCategories = (
	categoryValue:
		| number[]
		| Array< { term_id: unknown } >
		| Record< string, { term_id: unknown } >
		| undefined
): number[] => {
	if ( ! categoryValue ) {
		return [];
	}

	// If already a clean array of numbers, return as-is
	if (
		Array.isArray( categoryValue ) &&
		categoryValue.every( ( item ) => typeof item === 'number' )
	) {
		return categoryValue;
	}

	// Convert object to array if needed, then extract numeric term_ids
	const items = Array.isArray( categoryValue ) ? categoryValue : Object.values( categoryValue );

	return items
		.map( ( item ) => ( typeof item === 'number' ? item : item?.term_id ) )
		.filter( ( id ): id is number => typeof id === 'number' );
};

const getFormSettings = ( settings?: Fields ) => {
	if ( ! settings ) {
		return {};
	}

	const {
		subscription_options,
		wpcom_featured_image_in_email,
		wpcom_newsletter_categories,
		wpcom_newsletter_categories_enabled,
		wpcom_subscription_emails_use_excerpt,
		newsletter_has_active_plan,
		jetpack_subscriptions_reply_to,
		jetpack_subscriptions_from_name,
		sm_enabled,
		jetpack_subscribe_overlay_enabled,
		jetpack_subscribe_floating_button_enabled,
		jetpack_subscriptions_subscribe_post_end_enabled,
		jetpack_subscriptions_subscribe_navigation_enabled,
		jetpack_subscriptions_login_navigation_enabled,
		jetpack_verbum_subscription_modal,
		jetpack_gravatar_in_email,
		jetpack_author_in_email,
		jetpack_post_date_in_email,
		date_format,
	} = settings;

	return {
		...( subscription_options && { subscription_options } ),
		wpcom_featured_image_in_email: !! wpcom_featured_image_in_email,
		wpcom_newsletter_categories: getNewsletterCategories( wpcom_newsletter_categories ),
		wpcom_newsletter_categories_enabled: !! wpcom_newsletter_categories_enabled,
		wpcom_subscription_emails_use_excerpt: !! wpcom_subscription_emails_use_excerpt,
		newsletter_has_active_plan,
		jetpack_subscriptions_reply_to: jetpack_subscriptions_reply_to || '',
		jetpack_subscriptions_from_name: jetpack_subscriptions_from_name || '',
		sm_enabled: !! sm_enabled,
		jetpack_subscribe_overlay_enabled: !! jetpack_subscribe_overlay_enabled,
		jetpack_subscribe_floating_button_enabled: !! jetpack_subscribe_floating_button_enabled,
		jetpack_subscriptions_subscribe_post_end_enabled:
			!! jetpack_subscriptions_subscribe_post_end_enabled,
		jetpack_subscriptions_subscribe_navigation_enabled:
			!! jetpack_subscriptions_subscribe_navigation_enabled,
		jetpack_subscriptions_login_navigation_enabled:
			!! jetpack_subscriptions_login_navigation_enabled,
		jetpack_verbum_subscription_modal: !! jetpack_verbum_subscription_modal,
		jetpack_gravatar_in_email: !! jetpack_gravatar_in_email,
		jetpack_author_in_email: !! jetpack_author_in_email,
		jetpack_post_date_in_email: !! jetpack_post_date_in_email,
		date_format: date_format || '',
	};
};

type NewsletterSettingsFormProps = {
	fields: Fields;
	handleToggle: ( field: string ) => ( value: boolean ) => void;
	handleSubmitForm: () => void;
	isRequestingSettings: boolean;
	isSavingSettings: boolean;
	settings: { subscription_options?: SubscriptionOptions };
	updateFields: ( fields: Fields ) => void;
	errorNotice: ( text: string ) => void;
};

const NewsletterSettingsForm = wrapSettingsForm( getFormSettings )( ( {
	fields,
	handleSubmitForm,
	handleToggle,
	isRequestingSettings,
	isSavingSettings,
	settings,
	updateFields,
	errorNotice,
}: NewsletterSettingsFormProps ) => {
	const translate = useTranslate();
	const siteId = useSelector( getSelectedSiteId );

	const {
		wpcom_featured_image_in_email,
		wpcom_subscription_emails_use_excerpt,
		jetpack_subscriptions_reply_to,
		jetpack_subscriptions_from_name,
		subscription_options,
		sm_enabled,
		jetpack_subscribe_overlay_enabled,
		jetpack_subscribe_floating_button_enabled,
		jetpack_subscriptions_subscribe_post_end_enabled,
		jetpack_subscriptions_subscribe_navigation_enabled,
		jetpack_subscriptions_login_navigation_enabled,
		jetpack_verbum_subscription_modal,
		jetpack_gravatar_in_email,
		jetpack_author_in_email,
		jetpack_post_date_in_email,
		date_format,
	} = fields;

	const isSubscriptionModuleInactive = useSelector( ( state ) => {
		if ( ! siteId ) {
			return null;
		}

		const isJetpackSite = isJetpackSiteSelector( state, siteId, {
			treatAtomicAsJetpackSite: false,
		} );

		return (
			Boolean( isJetpackSite ) && isJetpackModuleActive( state, siteId, 'subscriptions' ) === false
		);
	} );

	const shouldShowSubscriptionOnCommentModule = useSelector( ( state ) => {
		const isJetpackSite = isJetpackSiteSelector( state, siteId, {
			treatAtomicAsJetpackSite: false,
		} );

		return ! isJetpackSite;
	} );

	const isPrivate = useSelector( ( state ) => siteId && isPrivateSite( state, siteId ) ) || false;

	const disabled = isSubscriptionModuleInactive || isRequestingSettings || isSavingSettings;

	const newsletterCategoryIds = useMemo( () => {
		const categories = fields.wpcom_newsletter_categories;
		// Ensure we always return a number array
		if ( Array.isArray( categories ) ) {
			return categories;
		}
		return defaultNewsletterCategoryIds;
	}, [ fields.wpcom_newsletter_categories ] );

	const savedSubscriptionOptions = settings?.subscription_options;

	// Update subscription_options form fields when savedSubscriptionOptions changes.
	// This makes sure the form fields hold the current value after saving.
	useEffect( () => {
		updateFields( { subscription_options: savedSubscriptionOptions } );

		// If the URL has a hash, scroll to it.
		scrollToAnchor( { offset: 15 } );
	}, [ savedSubscriptionOptions, updateFields ] );

	const onSubmit = ( event?: React.FormEvent | React.MouseEvent ) => {
		event?.preventDefault();

		if (
			fields.wpcom_newsletter_categories_enabled &&
			! fields.wpcom_newsletter_categories?.length
		) {
			errorNotice(
				translate( 'Please select at least one category when newsletter categories are enabled.' )
			);
			return;
		}

		handleSubmitForm();
	};

	return (
		<form onSubmit={ onSubmit }>
			{ siteId && <QueryJetpackModules siteId={ siteId } /> }

			<SettingsSectionHeader
				disabled={ disabled }
				id="subscriptions"
				isSaving={ isSavingSettings }
				onButtonClick={ onSubmit }
				showButton
				title={ translate( 'Subscriptions' ) }
			/>
			<Card className="site-settings__card">
				<FormLabel>{ translate( 'Homepage and posts' ) }</FormLabel>
				<SubscribePostEndSetting
					disabled={ disabled }
					handleToggle={ handleToggle }
					value={ jetpack_subscriptions_subscribe_post_end_enabled }
				/>
				<SubscribeModalSetting
					disabled={ disabled }
					handleToggle={ handleToggle }
					value={ sm_enabled }
				/>
				<SubscribeOverlaySetting
					disabled={ disabled }
					handleToggle={ handleToggle }
					value={ jetpack_subscribe_overlay_enabled }
				/>
				<SubscribeFloatingButtonSetting
					disabled={ disabled }
					handleToggle={ handleToggle }
					value={ jetpack_subscribe_floating_button_enabled }
				/>
				<FormLabel>{ translate( 'Navigation' ) }</FormLabel>
				<SubscribeNavigationSetting
					disabled={ disabled }
					handleToggle={ handleToggle }
					value={ jetpack_subscriptions_subscribe_navigation_enabled }
				/>
				<SubscriberLoginNavigationSetting
					disabled={ disabled }
					handleToggle={ handleToggle }
					value={ jetpack_subscriptions_login_navigation_enabled }
				/>
				{ shouldShowSubscriptionOnCommentModule && (
					<>
						<FormLabel>{ translate( 'Comments' ) }</FormLabel>
						<SubscribeModalOnCommentSetting
							disabled={ disabled }
							handleToggle={ handleToggle }
							value={ jetpack_verbum_subscription_modal }
						/>
					</>
				) }
			</Card>

			<SettingsSectionHeader
				disabled={ disabled }
				id="paid-newsletter"
				title={ translate( 'Paid Newsletter' ) }
			/>
			<PaidNewsletterSection newsletterHasActivePlan={ fields.newsletter_has_active_plan } />
			<SettingsSectionHeader
				disabled={ disabled }
				id="email-settings"
				isSaving={ isSavingSettings }
				onButtonClick={ onSubmit }
				showButton
				title={ translate( 'Email' ) }
			/>
			<Card className="site-settings__card">
				<FeaturedImageEmailSetting
					disabled={ disabled }
					handleToggle={ handleToggle }
					value={ wpcom_featured_image_in_email }
					isPrivate={ isPrivate }
				/>
			</Card>
			<Card className="site-settings__card">
				<BylineSettings
					disabled={ disabled }
					handleToggle={ handleToggle }
					showAvatarValue={ jetpack_gravatar_in_email }
					showAuthorValue={ jetpack_author_in_email }
					showDateValue={ jetpack_post_date_in_email }
					dateFormat={ date_format }
				/>
			</Card>
			<Card className="site-settings__card">
				<ExcerptSetting
					disabled={ disabled }
					updateFields={ updateFields }
					value={ wpcom_subscription_emails_use_excerpt }
				/>
			</Card>
			<Card className="site-settings__card">
				<SenderNameSetting
					disabled={ disabled }
					updateFields={ updateFields }
					value={ jetpack_subscriptions_from_name }
					replyToValue={ jetpack_subscriptions_reply_to }
				/>
			</Card>
			<Card className="site-settings__card">
				<ReplyToSetting
					disabled={ disabled }
					updateFields={ updateFields }
					value={ jetpack_subscriptions_reply_to }
				/>
			</Card>
			<SettingsSectionHeader
				id="newsletter-categories-settings"
				title={ translate( 'Newsletter categories' ) }
				showButton
				onButtonClick={ onSubmit }
				disabled={ disabled }
				isSaving={ isSavingSettings }
			/>
			<NewsletterCategoriesSection
				disabled={ disabled }
				newsletterCategoryIds={ newsletterCategoryIds }
				newsletterCategoriesEnabled={ fields.wpcom_newsletter_categories_enabled }
				handleToggle={ handleToggle }
				updateFields={ updateFields }
			/>
			<SettingsSectionHeader
				disabled={ disabled }
				id="messages"
				isSaving={ isSavingSettings }
				onButtonClick={ onSubmit }
				showButton
				title={ translate( 'Messages' ) }
			/>
			<Card className="site-settings__card">
				<EmailsTextSetting
					disabled={ disabled }
					updateFields={ updateFields }
					value={ subscription_options }
				/>
			</Card>
		</form>
	);
} );

const NewsletterSettings = () => {
	const translate = useTranslate();

	return (
		<Main className="site-settings">
			<DocumentHead title={ translate( 'Newsletter Settings' ) } />
			<NavigationHeader
				navigationItems={ [] }
				title={ translate( 'Newsletter Settings' ) }
				subtitle={ translate(
					'Transform your blog posts into newsletters to easily reach your subscribers.'
				) }
			/>
			<SubscriptionsModuleBanner />
			<NewsletterSettingsForm />
		</Main>
	);
};

export default NewsletterSettings;
