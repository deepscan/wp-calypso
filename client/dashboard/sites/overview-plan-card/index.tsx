import { JetpackLogo } from '@automattic/components/src/logos/jetpack-logo';
import { useQuery } from '@tanstack/react-query';
import {
	__experimentalGrid as Grid,
	__experimentalText as Text,
	__experimentalVStack as VStack,
	Icon,
	Tooltip,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { wordpress } from '@wordpress/icons';
import { siteCurrentPlanQuery } from '../../app/queries/site-plans';
import { sitePurchaseQuery } from '../../app/queries/site-purchases';
import { DotcomPlans } from '../../data/constants';
import {
	getJetpackProductsForSite,
	getSitePlanDisplayName,
	JETPACK_PRODUCTS,
} from '../../utils/site-plan';
import { isSelfHostedJetpackConnected } from '../../utils/site-types';
import OverviewCard from '../overview-card';
import SiteBandwidthStat from './site-bandwidth-stat';
import SiteStorageStat from './site-storage-stat';
import type { Site, Purchase } from '../../data/types';
import './style.scss';

function getJetpackProductsDescription( products: typeof JETPACK_PRODUCTS ) {
	if ( products.length === JETPACK_PRODUCTS.length ) {
		return __( 'The full Jetpack suite with everything you need to grow your business.' );
	}

	if ( products.length === 0 ) {
		return __( 'Enhance your site with Jetpack security, performance, and growth tools.' );
	}

	if ( products.length === 1 ) {
		return products[ 0 ].description;
	}

	return `${ products.map( ( product ) => product.label ).join( ', ' ) }.`;
}

function JetpackPlanCard( {
	site,
	purchase,
	isLoading,
}: {
	site: Site;
	purchase?: Purchase;
	isLoading: boolean;
} ) {
	const products = getJetpackProductsForSite( site );
	const productsToDisplay = products.length > 0 ? products : JETPACK_PRODUCTS;

	return (
		<OverviewCard
			title={ __( 'Subscriptions' ) }
			icon={ <JetpackLogo /> }
			heading={ getSitePlanDisplayName( site ) }
			description={ getCardDescription( site, purchase ) }
			externalLink={ `https://cloud.jetpack.com/purchases/subscriptions/${ site.slug }` }
			tracksId="plan"
			isLoading={ isLoading }
			bottom={
				<VStack spacing={ 3 }>
					<Grid
						className="jetpack-plan-card__icons"
						columns={ 4 }
						rows={ Math.ceil( productsToDisplay.length / 4 ) }
						gap={ 2 }
					>
						{ productsToDisplay.map( ( product ) => (
							<Tooltip key={ product.id } text={ product.label } placement="top">
								<div tabIndex={ -1 }>
									<Icon icon={ product.icon } />
								</div>
							</Tooltip>
						) ) }
					</Grid>
					<Text variant="muted" lineHeight="16px" size={ 12 }>
						{ getJetpackProductsDescription( products ) }
					</Text>
				</VStack>
			}
		/>
	);
}

function WpcomPlanCard( {
	site,
	purchase,
	isLoading,
}: {
	site: Site;
	purchase?: Purchase;
	isLoading: boolean;
} ) {
	return (
		<OverviewCard
			title={ __( 'Plan' ) }
			icon={ wordpress }
			heading={ getSitePlanDisplayName( site ) }
			description={ getCardDescription( site, purchase ) }
			link={ site.plan?.is_free ? undefined : '/v2/me/billing/active-subscriptions' }
			tracksId="plan"
			isLoading={ isLoading }
			bottom={
				<VStack spacing={ 4 }>
					<SiteStorageStat site={ site } />
					<SiteBandwidthStat site={ site } />
				</VStack>
			}
		/>
	);
}

function AgencyPlanCard( { site, isLoading }: { site: Site; isLoading: boolean } ) {
	return (
		<OverviewCard
			title={ __( 'Development license' ) }
			icon={ wordpress }
			heading={ getSitePlanDisplayName( site ) }
			description={ __( 'Managed by Automattic for Agencies' ) }
			externalLink={ `https://agencies.automattic.com/sites/overview/${ site.slug }` }
			tracksId="plan"
			isLoading={ isLoading }
			bottom={
				<VStack spacing={ 4 }>
					<SiteStorageStat site={ site } />
					<SiteBandwidthStat site={ site } />
				</VStack>
			}
		/>
	);
}

export default function PlanCard( { site }: { site: Site } ) {
	const { data: plan, isLoading: isLoadingPlan } = useQuery( siteCurrentPlanQuery( site.ID ) );
	const { data: purchase, isLoading: isLoadingPurchase } = useQuery( {
		...sitePurchaseQuery( site.ID, plan?.id ?? '' ),
		enabled: !! plan?.id,
	} );

	if ( site.is_a4a_dev_site ) {
		return <AgencyPlanCard site={ site } isLoading={ isLoadingPlan || isLoadingPurchase } />;
	}

	if ( isSelfHostedJetpackConnected( site ) ) {
		return (
			<JetpackPlanCard
				site={ site }
				purchase={ purchase }
				isLoading={ isLoadingPlan || isLoadingPurchase }
			/>
		);
	}

	return (
		<WpcomPlanCard
			site={ site }
			purchase={ purchase }
			isLoading={ isLoadingPlan || isLoadingPurchase }
		/>
	);
}

function getCardDescription( site: Site, purchase?: Purchase ) {
	if ( site.plan?.product_slug === DotcomPlans.FREE_PLAN ) {
		return __( 'Upgrade to access all hosting features.' );
	}

	if ( site.plan?.product_slug === DotcomPlans.JETPACK_FREE ) {
		return getJetpackProductsForSite( site ).length > 0
			? __( 'Manage subscriptions.' )
			: __( 'Upgrade to access more Jetpack tools.' );
	}

	if ( purchase?.expiry_message ) {
		return purchase.expiry_message;
	}

	if ( purchase?.partner_name ) {
		return sprintf(
			/* translators: %s: the partner name, e.g.: "Jetpack" */
			__( 'Managed by %s.' ),
			purchase.partner_name
		);
	}

	return undefined;
}
