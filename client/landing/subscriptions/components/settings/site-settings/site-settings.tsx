import { Reader, SubscriptionManager } from '@automattic/data-stores';
import { Button, __experimentalVStack as VStack } from '@wordpress/components';
import { Icon, seen } from '@wordpress/icons';
import clsx from 'clsx';
import { useTranslate } from 'i18n-calypso';
import { useRecordViewFeedButtonClicked } from 'calypso/landing/subscriptions/tracks';
import ReaderFollowingConversationIcon from 'calypso/reader/components/icons/following-conversation-icon';
import { getFeedUrl } from 'calypso/reader/route';
import { SubscriptionsEllipsisMenu } from '../../subscriptions-ellipsis-menu';
import DeliveryFrequencyInput from './delivery-frequency-input';
import EmailMeNewCommentsToggle from './email-me-new-comments-toggle';
import EmailMeNewPostsToggle from './email-me-new-posts-toggle';
import NotifyMeOfNewPostsToggle from './notify-me-of-new-posts-toggle';
import './styles.scss';
import '../styles.scss';

type SiteSettingsProps = {
	notifyMeOfNewPosts: boolean;
	onNotifyMeOfNewPostsChange: ( value: boolean ) => void;
	updatingNotifyMeOfNewPosts: boolean;
	emailMeNewPosts: boolean;
	onEmailMeNewPostsChange: ( value: boolean ) => void;
	updatingEmailMeNewPosts: boolean;
	deliveryFrequency: Reader.EmailDeliveryFrequency;
	onDeliveryFrequencyChange: ( value: Reader.EmailDeliveryFrequency ) => void;
	updatingFrequency: boolean;
	emailMeNewComments: boolean;
	onEmailMeNewCommentsChange: ( value: boolean ) => void;
	updatingEmailMeNewComments: boolean;
};

const SiteSettings = ( {
	notifyMeOfNewPosts,
	onNotifyMeOfNewPostsChange,
	updatingNotifyMeOfNewPosts,
	emailMeNewPosts,
	onEmailMeNewPostsChange,
	updatingEmailMeNewPosts,
	deliveryFrequency,
	onDeliveryFrequencyChange,
	emailMeNewComments,
	onEmailMeNewCommentsChange,
	updatingEmailMeNewComments,
	updatingFrequency,
}: SiteSettingsProps ) => {
	const { isLoggedIn } = SubscriptionManager.useIsLoggedIn();

	return (
		<div className="settings site-settings">
			{ isLoggedIn && (
				<EmailMeNewPostsToggle
					className="setting-item"
					value={ emailMeNewPosts }
					onChange={ onEmailMeNewPostsChange }
					isDisabled={ updatingEmailMeNewPosts }
				/>
			) }
			{ emailMeNewPosts && (
				<DeliveryFrequencyInput
					value={ deliveryFrequency }
					onChange={ onDeliveryFrequencyChange }
					isUpdating={ updatingFrequency }
				/>
			) }
			{ isLoggedIn && (
				<EmailMeNewCommentsToggle
					className="setting-item"
					value={ emailMeNewComments }
					onChange={ onEmailMeNewCommentsChange }
					isDisabled={ updatingEmailMeNewComments }
				/>
			) }
			{ isLoggedIn && (
				<NotifyMeOfNewPostsToggle
					className="setting-item setting-item__last"
					value={ notifyMeOfNewPosts }
					onChange={ onNotifyMeOfNewPostsChange }
					isDisabled={ updatingNotifyMeOfNewPosts }
					showJetpackAppHint
				/>
			) }
		</div>
	);
};

type SiteSettingsPopoverProps = SiteSettingsProps & {
	onUnsubscribe: () => void;
	unsubscribing: boolean;
	blogId?: number;
	feedId: number;
	subscriptionId: number;
};

export const SiteSettingsPopover = ( {
	onUnsubscribe,
	unsubscribing,
	blogId,
	feedId,
	subscriptionId,
	...props
}: SiteSettingsPopoverProps ) => {
	const translate = useTranslate();
	const recordViewFeedButtonClicked = useRecordViewFeedButtonClicked();
	const isWpComSite = Reader.isValidId( blogId );
	return (
		<SubscriptionsEllipsisMenu
			popoverClassName="site-settings-popover"
			toggleTitle={ translate( 'More actions' ) }
		>
			{ ( close: () => void ) => (
				<>
					{ isWpComSite && <SiteSettings { ...props } /> }

					<Button
						className={ clsx( 'site-settings-popover__unsubscribe-button', {
							'is-loading': unsubscribing,
						} ) }
						disabled={ unsubscribing }
						icon={ ReaderFollowingConversationIcon( {
							iconSize: 24,
							className: 'subscriptions-ellipsis-menu__item-icon',
						} ) }
						onClick={ () => {
							onUnsubscribe();
							close();
						} }
					>
						{ translate( 'Subscribed' ) }
					</Button>

					<hr className="subscriptions__separator" />

					<VStack spacing={ 4 }>
						{ Boolean( feedId ) && (
							<Button
								className="site-settings-popover__view-feed-button"
								icon={ <Icon className="subscriptions-ellipsis-menu__item-icon" icon={ seen } /> }
								href={ getFeedUrl( feedId ) }
								onClick={ () => {
									recordViewFeedButtonClicked( {
										blogId: blogId ? String( blogId ) : null,
										feedId: String( feedId ),
										source: 'subscription-settings-dropdown',
									} );
								} }
							>
								{ translate( 'View feed' ) }
							</Button>
						) }
					</VStack>
				</>
			) }
		</SubscriptionsEllipsisMenu>
	);
};

export default SiteSettings;
