import { Purchases, SiteDetails } from '@automattic/data-stores';
import { StoredPaymentMethod } from '@automattic/wpcom-checkout';
import { Fields } from '@wordpress/dataviews';
import { fixMe, LocalizeProps } from 'i18n-calypso';
import { useLocalizedMoment } from 'calypso/components/localized-moment';
import { logToLogstash } from 'calypso/lib/logstash';
import { getDisplayName, isExpired, isRenewing, purchaseType } from 'calypso/lib/purchases';
import { GetManagePurchaseUrlFor, MembershipSubscription } from 'calypso/lib/purchases/types';
import { useSelector } from 'calypso/state';
import { getSite } from 'calypso/state/sites/selectors';
import { isTransferredOwnership } from '../hooks/use-is-transferred-ownership';
import { Icon, MembershipType, MembershipTerms } from '../membership-item';
import {
	PurchaseItemSiteIcon,
	PurchaseItemProduct,
	PurchaseItemStatus,
	PurchaseItemPaymentMethod,
	BackupPaymentMethodNotice,
} from '../purchase-item';
import OwnerInfo from '../purchase-item/owner-info';

function PurchaseItemRowProduct( props: {
	purchase: Purchases.Purchase;
	translate: LocalizeProps[ 'translate' ];
} ) {
	const { purchase, translate } = props;
	const site = useSelector( ( state ) => getSite( state, purchase.siteId ?? 0 ) );
	const slug = site?.domain ?? undefined;
	return (
		<PurchaseItemProduct
			purchase={ purchase }
			site={ site }
			translate={ translate }
			slug={ slug }
			showSite
			isDisconnectedSite={ ! site }
		/>
	);
}

function PurchaseItemRowStatus( props: {
	purchase: Purchases.Purchase;
	translate: LocalizeProps[ 'translate' ];
	moment: ReturnType< typeof useLocalizedMoment >;
	isJetpack?: boolean;
	isDisconnectedSite?: boolean;
} ) {
	const { purchase, translate, moment, isJetpack, isDisconnectedSite } = props;

	return (
		<div className="purchase-item__status purchases-layout__status">
			<PurchaseItemStatus
				purchase={ purchase }
				translate={ translate }
				moment={ moment }
				isJetpack={ isJetpack }
				isDisconnectedSite={ isDisconnectedSite }
			/>
		</div>
	);
}

export function getPurchasesFieldDefinitions( {
	translate,
	moment,
	paymentMethods,
	sites,
	getManagePurchaseUrlFor,
	fieldIds,
	transferredOwnershipPurchases = [],
}: {
	translate: LocalizeProps[ 'translate' ];
	moment: ReturnType< typeof useLocalizedMoment >;
	paymentMethods: Array< StoredPaymentMethod >;
	sites: SiteDetails[];
	getManagePurchaseUrlFor: GetManagePurchaseUrlFor;
	fieldIds?: string[];
	transferredOwnershipPurchases?: Purchases.Purchase[];
} ): Fields< Purchases.Purchase > {
	const backupPaymentMethods = paymentMethods.filter(
		( paymentMethod ) => paymentMethod.is_backup === true
	);

	const getPurchaseUrl = ( item: Purchases.Purchase ) => {
		const siteUrl = item.siteSlug || item.domain;
		const subscriptionId = item.id;
		if ( ! siteUrl ) {
			// eslint-disable-next-line no-console
			console.error( 'Cannot display manage purchase page for subscription without site' );
			return;
		}
		if ( ! subscriptionId ) {
			// eslint-disable-next-line no-console
			console.error( 'Cannot display manage purchase page for subscription without ID' );
			return;
		}
		return getManagePurchaseUrlFor( siteUrl, subscriptionId );
	};

	// No point in having a filter if there's only one site.
	const shouldAllowSiteFiltering = sites.length > 1;
	const fields: Fields< Purchases.Purchase > = [
		{
			id: 'site',
			label: translate( 'Site' ),
			type: 'text',
			enableGlobalSearch: true,
			enableSorting: true,
			enableHiding: false,
			elements: shouldAllowSiteFiltering
				? sites.map( ( site ) => ( {
						value: String( site.ID ),
						label: `${ site.name } (${ site.domain })`,
				  } ) )
				: undefined,
			filterBy: shouldAllowSiteFiltering ? { operators: [ 'isAny' ] } : false,
			getValue: ( { item }: { item: Purchases.Purchase } ) => {
				// getValue must return a string because the DataViews search feature calls `trim()` on it.
				return String( item.siteId );
			},
			// Render the site icon
			render: ( { item }: { item: Purchases.Purchase } ) => {
				const site = { ID: item.siteId };
				return (
					<a
						title={ translate( 'Manage purchase', { textOnly: true } ) }
						href={ getPurchaseUrl( item ) }
					>
						<PurchaseItemSiteIcon site={ site } purchase={ item } />
					</a>
				);
			},
		},
		{
			id: 'product',
			label: translate( 'Product' ),
			type: 'text',
			enableGlobalSearch: true,
			enableSorting: true,
			enableHiding: false,
			filterBy: false,
			getValue: ( { item }: { item: Purchases.Purchase } ) => {
				// Render a bunch of things to make this easily searchable.
				const site = sites.find( ( site ) => site.ID === item.siteId );
				return (
					getDisplayName( item ) +
					' ' +
					( purchaseType( item ) || '' ) +
					' ' +
					item.siteName +
					' ' +
					( item.siteSlug || item.domain ) +
					' ' +
					( site?.URL ?? '' )
				);
			},
			render: ( { item }: { item: Purchases.Purchase } ) => {
				const hasTransferredOwnership = isTransferredOwnership(
					item.id,
					transferredOwnershipPurchases
				);
				return (
					<div className="purchase-item__information">
						<div className="purchase-item__title">
							{ hasTransferredOwnership ? (
								<div>
									{ getDisplayName( item ) }
									&nbsp;
									<OwnerInfo purchase={ item } isTransferredOwnership={ hasTransferredOwnership } />
								</div>
							) : (
								<>
									<a
										className="purchase-item__title-link"
										title={ translate( 'Manage purchase', { textOnly: true } ) }
										href={ getPurchaseUrl( item ) }
									>
										{ getDisplayName( item ) }
									</a>
									<OwnerInfo purchase={ item } />
								</>
							) }
						</div>
					</div>
				);
			},
		},
		{
			id: 'description',
			label: translate( 'Description' ),
			type: 'text',
			enableGlobalSearch: true,
			enableSorting: true,
			enableHiding: false,
			filterBy: false,
			getValue: ( { item }: { item: Purchases.Purchase } ) => {
				// Render a bunch of things to make this easily searchable.
				const site = sites.find( ( site ) => site.ID === item.siteId );
				return item.siteName + ' ' + ( item.siteSlug || item.domain ) + ' ' + ( site?.URL ?? '' );
			},
			render: ( { item }: { item: Purchases.Purchase } ) => {
				return (
					<div className="purchase-item__information">
						<div className="purchase-item__purchase-type">
							<PurchaseItemRowProduct purchase={ item } translate={ translate } />
						</div>
					</div>
				);
			},
		},
		{
			id: 'type',
			label: translate( 'Type' ),
			enableHiding: false,
			enableSorting: true,
			type: 'text',
			elements: [
				{ value: 'domain', label: translate( 'Domains' ) },
				{ value: 'plan', label: translate( 'Plans' ) },
				{ value: 'other', label: translate( 'Other' ) },
			],
			filterBy: { operators: [ 'is' ] },
			getValue: ( { item } ) => {
				if ( item.isDomain || item.isDomainRegistration ) {
					return 'domain';
				}
				if ( item.productType === 'bundle' ) {
					return 'plan';
				}
				return 'other';
			},
		},
		{
			id: 'expiring-soon',
			enableHiding: false,
			enableSorting: true,
			label: translate( 'Expiring soon' ),
			type: 'text',
			elements: [
				{
					value: '7',
					label: translate( 'Expires in %(days)d days', { textOnly: true, args: { days: 7 } } ),
				},
				{
					value: '14',
					label: translate( 'Expires in %(days)d days', { textOnly: true, args: { days: 14 } } ),
				},
				{
					value: '30',
					label: translate( 'Expires in %(days)d days', { textOnly: true, args: { days: 30 } } ),
				},
				{
					value: '60',
					label: translate( 'Expires in %(days)d days', { textOnly: true, args: { days: 60 } } ),
				},
				{
					value: '365',
					label: translate( 'Expires in %(days)d days', { textOnly: true, args: { days: 365 } } ),
				},
			],
			filterBy: { operators: [ 'is' ] },
			getValue: ( { item } ) => {
				const now = Date.now();
				const expiryDate = Date.parse( item.expiryDate );
				if ( ! item.isRenewable || ! expiryDate || expiryDate < now ) {
					return 'not-expiring-soon';
				}
				const msPerDay = 86_400_000;
				const msTilExpiry = expiryDate - now;
				if ( msTilExpiry <= 7 * msPerDay ) {
					return '7';
				}
				if ( msTilExpiry <= 14 * msPerDay ) {
					return '14';
				}
				if ( msTilExpiry <= 30 * msPerDay ) {
					return '30';
				}
				if ( msTilExpiry <= 60 * msPerDay ) {
					return '60';
				}
				if ( msTilExpiry <= 365 * msPerDay ) {
					return '365';
				}
				return 'not-expiring-soon';
			},
		},
		{
			id: 'status',
			label: translate( 'Expires/Renews on' ),
			type: 'text',
			enableGlobalSearch: true,
			enableSorting: true,
			enableHiding: false,
			filterBy: false,
			getValue: ( { item }: { item: Purchases.Purchase } ) => {
				if ( isExpired( item ) ) {
					// Prefix expired items with a z so they sort to the end of the list.
					return 'zzz ' + item.expiryStatus + ' ' + item.expiryDate;
				}
				// Include date in value to sort similar expiries together.
				return item.expiryDate + ' ' + item.expiryStatus;
			},
			render: ( { item }: { item: Purchases.Purchase } ) => {
				return (
					<PurchaseItemRowStatus purchase={ item } translate={ translate } moment={ moment } />
				);
			},
		},
		{
			id: 'payment-method',
			label: translate( 'Payment method' ),
			type: 'text',
			enableGlobalSearch: true,
			enableSorting: true,
			enableHiding: false,
			filterBy: false,
			getValue: ( { item }: { item: Purchases.Purchase } ) => {
				// This should not be possible. Investigating a bug:
				// https://linear.app/a8c/issue/SHILL-901/
				if ( ! item?.payment ) {
					logToLogstash( {
						feature: 'calypso_client',
						message: 'Purchase payment method data field getValue got unexpected data',
						severity: 'warning',
						extra: {
							item: JSON.stringify( item ),
						},
					} );
					return 'no-payment-method';
				}
				// Allows sorting by card number or payment partner (eg: `type === 'paypal'`).
				return isExpired( item )
					? // Do not return card number for expired purchases because it
					  // will not be displayed so it will look wierd if we sort
					  // expired purchases with active ones that have the same card.
					  'expired'
					: item.payment.creditCard?.number ?? item.payment.type ?? 'no-payment-method';
			},
			render: ( { item }: { item: Purchases.Purchase } ) => {
				let isBackupMethodAvailable = false;

				if ( backupPaymentMethods ) {
					const backupPaymentMethodsWithoutCurrentPurchase = backupPaymentMethods.filter(
						// A payment method is only a back up if it isn't already assigned to the current purchase
						( paymentMethod ) => item.payment.storedDetailsId !== paymentMethod.stored_details_id
					);

					isBackupMethodAvailable = backupPaymentMethodsWithoutCurrentPurchase.length >= 1;
				}

				return (
					<div className="purchase-item__payment-method">
						<PurchaseItemPaymentMethod purchase={ item } translate={ translate } />
						{ isBackupMethodAvailable && isRenewing( item ) && <BackupPaymentMethodNotice /> }
					</div>
				);
			},
		},
	];
	return fields.filter( ( field ) => fieldIds?.includes( field.id ) ?? true );
}

export function getMembershipsFieldDefinitions( {
	translate,
}: {
	translate: LocalizeProps[ 'translate' ];
} ): Fields< MembershipSubscription > {
	const getPurchaseUrl = ( item: MembershipSubscription ) => {
		const subscriptionId = item.ID;
		if ( ! subscriptionId ) {
			// eslint-disable-next-line no-console
			console.error( 'Cannot display manage purchase page for subscription without ID' );
			return;
		}
		return `/me/purchases/other/${ subscriptionId }`;
	};

	return [
		{
			id: 'site',
			label: translate( 'Site' ),
			type: 'text',
			enableGlobalSearch: true,
			enableSorting: false,
			enableHiding: false,
			filterBy: false,
			getValue: ( { item }: { item: MembershipSubscription } ) => {
				return item.site_id + ' ' + item.site_title + ' ' + item.site_url;
			},
			// Render the site icon
			render: ( { item }: { item: MembershipSubscription } ) => {
				return (
					<a
						title={ translate( 'Manage purchase', { textOnly: true } ) }
						href={ getPurchaseUrl( item ) }
					>
						<Icon subscription={ item } />
					</a>
				);
			},
		},
		{
			id: 'product',
			label: translate( 'Product' ),
			type: 'text',
			enableGlobalSearch: true,
			enableSorting: true,
			enableHiding: false,
			filterBy: false,
			getValue: ( { item }: { item: MembershipSubscription } ) => {
				return item.title + ' ' + item.site_title + ' ' + item.site_url;
			},
			render: ( { item }: { item: MembershipSubscription } ) => {
				return (
					<div className="membership-item__information purchase-item__information">
						<div className="membership-item__title purchase-item__title">
							<a
								title={ translate( 'Manage purchase', { textOnly: true } ) }
								href={ getPurchaseUrl( item ) }
							>
								{ item.title }
							</a>
						</div>
					</div>
				);
			},
		},
		{
			id: 'description',
			label: String(
				fixMe( {
					text: 'Product Description',
					newCopy: translate( 'Product Description', { textOnly: true } ),
					oldCopy: translate( 'Description', { textOnly: true } ),
				} )
			),
			type: 'text',
			enableGlobalSearch: true,
			enableSorting: true,
			enableHiding: false,
			filterBy: false,
			getValue: ( { item }: { item: MembershipSubscription } ) => {
				return item.title + ' ' + item.site_title + ' ' + item.site_url;
			},
			render: ( { item }: { item: MembershipSubscription } ) => {
				return (
					<div className="membership-item__information purchase-item__information">
						<div className="membership-item__purchase-type purchase-item__purchase-type">
							<MembershipType subscription={ item } />
						</div>
					</div>
				);
			},
		},
		{
			id: 'status',
			label: translate( 'Status' ),
			type: 'text',
			enableGlobalSearch: true,
			enableSorting: false,
			enableHiding: false,
			filterBy: false,
			getValue: ( { item }: { item: MembershipSubscription } ) => {
				return item.end_date ?? '';
			},
			render: ( { item }: { item: MembershipSubscription } ) => {
				return (
					<div className="membership-item__status purchase-item__status">
						<MembershipTerms subscription={ item } />
					</div>
				);
			},
		},
	];
}
