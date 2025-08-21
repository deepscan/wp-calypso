import { type Callback } from '@automattic/calypso-router';
import page from '@automattic/calypso-router';
import PageViewTracker from 'calypso/a8c-for-agencies/components/a4a-page-view-tracker';
import {
	A4A_MARKETPLACE_HOSTING_LINK,
	A4A_MARKETPLACE_HOSTING_PRESSABLE_LINK,
	A4A_MARKETPLACE_HOSTING_WPCOM_LINK,
} from 'calypso/a8c-for-agencies/components/sidebar-menu/lib/constants';
import { getActiveAgency } from 'calypso/state/a8c-for-agencies/agency/selectors';
import MarketplaceSidebar from '../../components/sidebar-menu/marketplace';
import AssignLicense from './assign-license';
import Checkout from './checkout';
import { MARKETPLACE_TYPE_REFERRAL } from './hoc/with-marketplace-type';
import HostingOverview from './hosting-overview';
import { getValidHostingSection } from './lib/hosting';
import { getValidBrand } from './lib/product-brand';
import { PLAN_CATEGORY_ENTERPRISE, PLAN_CATEGORY_PREMIUM } from './pressable-overview/constants';
import DownloadProducts from './primary/download-products';
import ProductsOverview from './products-overview';
import ReferHosting from './refer-hosting';

export const marketplaceContext: Callback = ( context ) => {
	const { purchase_type } = context.query;
	const purchaseType = purchase_type === 'referral' ? 'referral' : undefined;
	const purchaseTypeURLQuery = purchaseType ? `?purchase_type=${ purchaseType }` : '';
	page.redirect( A4A_MARKETPLACE_HOSTING_LINK + purchaseTypeURLQuery );
};

export const marketplaceProductsContext: Callback = ( context, next ) => {
	const { site_id, product_slug, purchase_type, search_query } = context.query;
	const productBrand = context.params.brand;

	context.secondary = <MarketplaceSidebar path={ context.path } />;
	const purchaseType = purchase_type === 'referral' ? 'referral' : undefined;

	context.primary = (
		<>
			<PageViewTracker title="Marketplace > Products" path={ context.path } />
			<ProductsOverview
				siteId={ site_id }
				suggestedProduct={ product_slug }
				defaultMarketplaceType={ purchaseType }
				productBrand={ getValidBrand( productBrand ) }
				searchQuery={ search_query }
			/>
		</>
	);
	next();
};

export const marketplaceHostingContext: Callback = ( context, next ) => {
	const { purchase_type } = context.query;
	const purchaseType = purchase_type === 'referral' ? 'referral' : undefined;

	if ( ! context.params.section ) {
		const currentAgency = getActiveAgency( context.store.getState() );

		const purchaseTypeURLQuery = purchaseType ? `?purchase_type=${ purchaseType }` : '';

		page.redirect(
			// If the agency is managing less than 5 sites, then we make wpcom as default section.
			( currentAgency?.signup_meta?.number_sites === '1-5'
				? A4A_MARKETPLACE_HOSTING_WPCOM_LINK
				: A4A_MARKETPLACE_HOSTING_PRESSABLE_LINK ) + purchaseTypeURLQuery
		);
		return;
	}

	const section = getValidHostingSection( context.params.section );

	context.secondary = <MarketplaceSidebar path={ context.path } />;
	context.primary = (
		<>
			<PageViewTracker title="Marketplace > Hosting" path={ context.path } />
			<HostingOverview section={ section } defaultMarketplaceType={ purchaseType } />
		</>
	);
	next();
};

export const marketplaceReferEnterpriseHostingContext: Callback = ( context, next ) => {
	context.secondary = <MarketplaceSidebar path={ context.path } />;
	context.primary = (
		<>
			<PageViewTracker
				title="Marketplace > Hosting > Refer Enterprise Hosting"
				path={ context.path }
			/>
			<ReferHosting type={ PLAN_CATEGORY_ENTERPRISE } />
		</>
	);
	next();
};

export const marketplaceReferPremiumPlanContext: Callback = ( context, next ) => {
	context.secondary = <MarketplaceSidebar path={ context.path } />;
	context.primary = (
		<>
			<PageViewTracker title="Marketplace > Hosting > Refer Premium Plan" path={ context.path } />
			<ReferHosting type={ PLAN_CATEGORY_PREMIUM } />
		</>
	);
	next();
};

export const checkoutContext: Callback = ( context, next ) => {
	const { referral_blog_id } = context.query;
	const referralBlogId = referral_blog_id ? parseInt( referral_blog_id ) : undefined;

	context.secondary = <MarketplaceSidebar path={ context.path } />;
	context.primary = (
		<>
			<PageViewTracker title="Marketplace > Checkout" path={ context.path } />
			<Checkout
				referralBlogId={ referralBlogId }
				defaultMarketplaceType={ referralBlogId ? MARKETPLACE_TYPE_REFERRAL : undefined }
			/>
		</>
	);
	next();
};

export const assignLicenseContext: Callback = ( context, next ) => {
	const { page, search } = context.query;
	const initialPage = parseInt( page ) || 1;

	context.secondary = <MarketplaceSidebar path={ context.path } />;
	context.primary = (
		<>
			<PageViewTracker title="Marketplace > Assign License" path={ context.path } />
			<AssignLicense initialPage={ initialPage } initialSearch={ search || '' } />
		</>
	);
	next();
};

export const downloadProductsContext: Callback = ( context, next ) => {
	context.secondary = <MarketplaceSidebar path={ context.path } />;
	context.primary = (
		<>
			<PageViewTracker title="Marketplace > Download Products" path={ context.path } />
			<DownloadProducts />
		</>
	);
	next();
};
