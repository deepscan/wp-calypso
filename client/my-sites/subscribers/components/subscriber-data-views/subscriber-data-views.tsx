import { Gravatar } from '@automattic/components';
import { useIsEnglishLocale } from '@automattic/i18n-utils';
import { useBreakpoint } from '@automattic/viewport-react';
import { Tooltip } from '@wordpress/components';
import { DataViews, type View, type Action, Operator } from '@wordpress/dataviews';
import { useMemo, useState, useCallback, useEffect } from '@wordpress/element';
import { hasTranslation } from '@wordpress/i18n';
import { translate } from 'i18n-calypso';
import TimeSince from 'calypso/components/time-since';
import { useSubscribedNewsletterCategories } from 'calypso/data/newsletter-categories';
import { EmptyListView } from 'calypso/my-sites/subscribers/components/empty-list-view';
import { SubscriberLaunchpad } from 'calypso/my-sites/subscribers/components/subscriber-launchpad';
import SubscriberTotals from 'calypso/my-sites/subscribers/components/subscriber-totals';
import { useSubscriptionPlans, useUnsubscribeModal } from 'calypso/my-sites/subscribers/hooks';
import { Subscriber } from 'calypso/my-sites/subscribers/types';
import { useSelector } from 'calypso/state';
import { getCouponsAndGiftsEnabledForSiteId } from 'calypso/state/memberships/settings/selectors';
import isAtomicSite from 'calypso/state/selectors/is-site-automated-transfer';
import { isSimpleSite } from 'calypso/state/sites/selectors';
import { SubscribersFilterBy, SubscribersSortBy } from '../../constants';
import {
	useSubscribersQuery,
	useSubscriberCountQuery,
	useSubscriberDetailsQuery,
} from '../../queries';
import { SubscriberDetails } from '../subscriber-details';
import { SubscribersHeader } from '../subscribers-header';
import { UnsubscribeModal } from '../unsubscribe-modal';
import './style.scss';

type SubscriberDataViewsProps = {
	siteId: number | null;
	isUnverified?: boolean;
	isStagingSite?: boolean;
	onGiftSubscription: ( subscriber: Subscriber ) => void;
};

const SubscriptionTypeCell = ( { subscriber }: { subscriber: Subscriber } ) => {
	const plans = useSubscriptionPlans( subscriber );
	return plans.map( ( plan, index ) => <div key={ index }>{ plan.plan }</div> );
};

const SubscriberName = ( { displayName, email }: { displayName: string; email: string } ) => (
	<div className="subscriber-profile subscriber-profile--compact">
		<div className="subscriber-profile__user-details">
			<span className="subscriber-profile__name">{ displayName }</span>
			{ email !== displayName && <span className="subscriber-profile__email">{ email }</span> }
		</div>
	</div>
);

const defaultView: View = {
	type: 'table',
	titleField: 'name',
	mediaField: 'media',
	showTitle: true,
	showMedia: true,
	fields: [ 'plan', 'is_email_subscriber', 'date_subscribed' ],
	layout: {
		styles: {
			media: { width: '60px' },
			name: { width: '55%', minWidth: '195px' },
			plan: { width: '15%' },
			is_email_subscriber: { width: '15%' },
			date_subscribed: { width: '15%' },
		},
	},
};

const SubscriberDataViews = ( {
	siteId = null,
	isUnverified = false,
	isStagingSite = false,
	onGiftSubscription,
}: SubscriberDataViewsProps ) => {
	const isMobile = useBreakpoint( '<660px' );
	const isEnglishLocale = useIsEnglishLocale();

	const [ searchTerm, setSearchTerm ] = useState( '' );
	const [ filterOption, setFilterOption ] = useState( SubscribersFilterBy.All );
	const [ selectedSubscriber, setSelectedSubscriber ] = useState< Subscriber | null >( null );
	const { isSimple, isAtomic } = useSelector( ( state ) => ( {
		isSimple: isSimpleSite( state ),
		isAtomic: isAtomicSite( state, siteId ),
	} ) );
	const couponsAndGiftsEnabled = useSelector( ( state ) =>
		getCouponsAndGiftsEnabledForSiteId( state, siteId )
	);

	const [ currentView, setCurrentView ] = useState< View >( {
		...defaultView,
		page: 1,
		perPage: 10,
		sort: {
			field: SubscribersSortBy.DateSubscribed,
			direction: 'desc',
		},
	} );

	const { data: subscribersQueryResult, isLoading } = useSubscribersQuery( {
		siteId: siteId ?? null,
		page: currentView.page,
		perPage: currentView.perPage,
		search: searchTerm,
		sortTerm: currentView.sort?.field as SubscribersSortBy,
		sortOrder: currentView.sort?.direction as 'asc' | 'desc',
		filterOption,
		limitData: true,
	} );

	const { data: subscriber, isLoading: isLoadingDetails } = useSubscriberDetailsQuery(
		siteId ?? null,
		selectedSubscriber?.subscription_id,
		selectedSubscriber?.user_id
	);

	const { data: subscribedNewsletterCategoriesData, isLoading: isLoadingNewsletterCategories } =
		useSubscribedNewsletterCategories( {
			siteId: siteId as number,
			subscriptionId: selectedSubscriber?.subscription_id,
			userId: selectedSubscriber?.user_id,
		} );

	const { data: subscribersTotals } = useSubscriberCountQuery( siteId ?? null );
	const grandTotal = subscribersTotals?.email_subscribers ?? 0;
	const {
		subscribers,
		is_owner_subscribed: isOwnerSubscribed,
		pages,
		total,
	} = subscribersQueryResult || {
		subscribers: [],
		is_owner_subscribed: false,
		pages: 0,
		total: 0,
	};

	const {
		currentSubscriber,
		onClickUnsubscribe: handleUnsubscribe,
		onConfirmModal,
		resetSubscriber,
	} = useUnsubscribeModal(
		siteId ?? null,
		{
			currentPage: currentView.page ?? 1,
			filterOption,
			searchTerm,
			sortTerm: SubscribersSortBy.DateSubscribed,
		},
		false,
		() => {
			setSelectedSubscriber( null );
		}
	);

	const EmptyComponent = isSimple || isAtomic ? SubscriberLaunchpad : EmptyListView;
	const shouldShowLaunchpad =
		! isLoading && ! searchTerm && ( ! grandTotal || ( grandTotal === 1 && isOwnerSubscribed ) );

	const handleSubscriberSelect = useCallback(
		( items: string[] ) => {
			if ( items.length === 0 ) {
				setSelectedSubscriber( null );
				return;
			}
			const selectedId = items[ 0 ];
			const subscriber = subscribers.find(
				( s: Subscriber ) => s.subscription_id.toString() === selectedId
			);
			if ( subscriber ) {
				setSelectedSubscriber( subscriber );
			}
		},
		[ subscribers ]
	);

	const getSubscriberId = useCallback(
		( subscriber: Subscriber ) => subscriber.subscription_id.toString(),
		[]
	);

	const handleSubscriberOnClick = useCallback(
		( subscriber: Subscriber ) => {
			handleSubscriberSelect( [ getSubscriberId( subscriber ) ] );
		},
		[ getSubscriberId, handleSubscriberSelect ]
	);

	const fields = useMemo(
		() => [
			{
				id: 'media',
				label: translate( 'Media' ),
				getValue: ( { item }: { item: Subscriber } ) => item.avatar,
				render: ( { item }: { item: Subscriber } ) => (
					<Gravatar
						user={ { avatar_URL: item.avatar, name: item.display_name } }
						size={ 40 }
						imgSize={ 80 }
						className="subscriber-data-views__square-avatar"
					/>
				),
				enableHiding: false,
				enableSorting: false,
			},
			{
				id: 'name',
				label: translate( 'Name' ),
				getValue: ( { item }: { item: Subscriber } ) => item.display_name,
				render: ( { item }: { item: Subscriber } ) => (
					<SubscriberName displayName={ item.display_name } email={ item.email_address } />
				),
				enableHiding: false,
				enableSorting: true,
			},
			{
				id: 'plan',
				label: translate( 'Plan' ),
				getValue: ( { item }: { item: Subscriber } ) =>
					item.plans?.length ? SubscribersFilterBy.Paid : SubscribersFilterBy.Free,
				render: ( { item }: { item: Subscriber } ) => <SubscriptionTypeCell subscriber={ item } />,
				elements: [
					{ label: translate( 'Paid' ), value: SubscribersFilterBy.Paid },
					{ label: translate( 'Free' ), value: SubscribersFilterBy.Free },
				],
				filterBy: {
					operators: [ 'is' as Operator ],
				},
				enableHiding: false,
				enableSorting: true,
			},
			{
				id: 'is_email_subscriber',
				label: translate( 'Email subscriber' ),
				getValue: ( { item }: { item: Subscriber } ) => ( item.is_email_subscriber ? 'yes' : 'no' ),
				render: ( { item }: { item: Subscriber } ) => {
					const noTooltip =
						isEnglishLocale || hasTranslation( 'Reader only subscriber' ) ? (
							<Tooltip text={ translate( 'Reader only subscriber' ) }>
								<span className="subscriber-data-views__tooltip-text">{ translate( 'No' ) }</span>
							</Tooltip>
						) : (
							translate( 'No' )
						);

					return <div>{ item.is_email_subscriber ? translate( 'Yes' ) : noTooltip }</div>;
				},
				elements: [
					{ label: translate( 'True' ), value: SubscribersFilterBy.EmailSubscriber },
					{
						label: translate( 'False' ),
						value: SubscribersFilterBy.ReaderSubscriber,
					},
				],
				filterBy: {
					operators: [ 'is' as Operator ],
				},
				enableHiding: false,
				enableSorting: true,
			},
			{
				id: 'date_subscribed',
				label: translate( 'Since' ),
				getValue: ( { item }: { item: Subscriber } ) => item.date_subscribed,
				render: ( { item }: { item: Subscriber } ) => <TimeSince date={ item.date_subscribed } />,
				enableHiding: false,
				enableSorting: true,
			},
		],
		[ isEnglishLocale ]
	);

	const actions = useMemo< Action< Subscriber >[] >( () => {
		// If we're in list view (when a subscriber is selected), return empty actions array.
		if ( selectedSubscriber ) {
			return [];
		}

		const baseActions = [
			{
				id: 'view',
				label: translate( 'View' ),
				callback: ( items: Subscriber[] ) => {
					if ( items[ 0 ] ) {
						handleSubscriberSelect( [ getSubscriberId( items[ 0 ] ) ] );
					}
				},
				isPrimary: true,
			},
			{
				id: 'remove',
				label: translate( 'Remove' ),
				callback: ( items: Subscriber[] ) => handleUnsubscribe( items[ 0 ] ),
				isPrimary: false,
			},
		];

		if ( couponsAndGiftsEnabled ) {
			baseActions.push( {
				id: 'gift',
				label: translate( 'Gift a subscription' ),
				callback: ( items: Subscriber[] ) => {
					if ( items[ 0 ] && items[ 0 ].user_id ) {
						onGiftSubscription( items[ 0 ] );
					}
				},
				isPrimary: false,
			} );
		}

		return baseActions;
	}, [
		selectedSubscriber,
		handleSubscriberSelect,
		handleUnsubscribe,
		onGiftSubscription,
		couponsAndGiftsEnabled,
		getSubscriberId,
	] );

	useEffect( () => {
		// If we're on mobile, we only want to show the name field.
		if ( isMobile ) {
			setCurrentView( ( prevView ) => ( {
				...prevView,
				showMedia: false,
				fields: [],
			} ) );
		} else if ( selectedSubscriber ) {
			// If we're on subscribers page, we want to show the list view (name & media).
			setCurrentView( ( prevView ) => ( {
				...prevView,
				type: 'list',
				showTitle: true,
				showMedia: true,
				fields: [],
			} ) );
		} else {
			// Otherwise, we want to show the table view.
			setCurrentView( ( prevView ) => ( {
				...prevView,
				...defaultView,
				layout: defaultView.layout,
			} ) );
		}
	}, [ isMobile, selectedSubscriber ] );

	useEffect( () => {
		// Handle search term from the view.
		setSearchTerm( currentView.search ?? '' );

		// Handle filter option from the view.
		setFilterOption(
			( currentView.filters?.[ 0 ]?.value as SubscribersFilterBy ) ?? SubscribersFilterBy.All
		);
	}, [ currentView.search, currentView.filters ] );

	// Memoize the data and pagination info.
	const { data, paginationInfo } = useMemo( () => {
		return {
			data: subscribers,
			paginationInfo: {
				totalItems: grandTotal,
				totalPages: pages,
			},
		};
	}, [ subscribers, grandTotal, pages ] );

	return (
		<div
			className={ `subscriber-data-views ${ selectedSubscriber ? 'has-selected-subscriber' : '' }` }
		>
			<section className="subscriber-data-views__list">
				<SubscribersHeader
					selectedSiteId={ siteId || undefined }
					disableCta={ isUnverified || isStagingSite }
					hideSubtitle={ !! selectedSubscriber }
				/>
				{ shouldShowLaunchpad ? (
					<EmptyComponent />
				) : (
					<>
						<SubscriberTotals
							totalSubscribers={ grandTotal }
							filteredCount={ total }
							filterOption={ filterOption }
							searchTerm={ searchTerm }
							isLoading={ isLoading }
						/>
						<DataViews< Subscriber >
							data={ data }
							fields={ fields }
							view={ currentView }
							onClickItem={ handleSubscriberOnClick }
							onChangeView={ setCurrentView }
							selection={
								selectedSubscriber ? [ selectedSubscriber.subscription_id.toString() ] : undefined
							}
							onChangeSelection={ handleSubscriberSelect }
							isLoading={ isLoading }
							paginationInfo={ paginationInfo }
							getItemId={ ( item: Subscriber ) => item.subscription_id.toString() }
							defaultLayouts={ selectedSubscriber ? { list: {} } : { table: {} } }
							actions={ actions }
							search
							searchLabel={
								isEnglishLocale || hasTranslation( 'Search subscribers…' )
									? translate( 'Search subscribers…' )
									: translate( 'Search by name, username or email…' )
							}
						/>
					</>
				) }
			</section>
			{ selectedSubscriber &&
				siteId &&
				! isLoadingNewsletterCategories &&
				! isLoadingDetails &&
				subscriber && (
					<section className="subscriber-data-views__details">
						<SubscriberDetails
							subscriber={ subscriber }
							siteId={ siteId }
							subscriptionId={ selectedSubscriber.subscription_id }
							onClose={ () => setSelectedSubscriber( null ) }
							onUnsubscribe={ handleUnsubscribe }
							newsletterCategoriesEnabled={ subscribedNewsletterCategoriesData?.enabled }
							newsletterCategories={ subscribedNewsletterCategoriesData?.newsletterCategories }
						/>
					</section>
				) }
			<UnsubscribeModal
				subscriber={ currentSubscriber }
				onCancel={ resetSubscriber }
				onConfirm={ onConfirmModal }
			/>
		</div>
	);
};

export default SubscriberDataViews;
