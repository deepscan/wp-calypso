import page from '@automattic/calypso-router';
import { Button, Card } from '@automattic/components';
import { getQueryArg } from '@wordpress/url';
import clsx from 'clsx';
import { useTranslate } from 'i18n-calypso';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useShowFeedback from 'calypso/a8c-for-agencies/components/a4a-feedback/hooks/use-show-a4a-feedback';
import { FeedbackType } from 'calypso/a8c-for-agencies/components/a4a-feedback/types';
import { LayoutWithGuidedTour as Layout } from 'calypso/a8c-for-agencies/components/layout/layout-with-guided-tour';
import LayoutTop from 'calypso/a8c-for-agencies/components/layout/layout-with-payment-notification';
import MobileSidebarNavigation from 'calypso/a8c-for-agencies/components/sidebar/mobile-sidebar-navigation';
import {
	A4A_MARKETPLACE_DOWNLOAD_PRODUCTS_LINK,
	A4A_LICENSES_LINK,
	A4A_SITES_LINK,
	A4A_FEEDBACK_LINK,
} from 'calypso/a8c-for-agencies/components/sidebar-menu/lib/constants';
import FormRadio from 'calypso/components/forms/form-radio';
import Pagination from 'calypso/components/pagination';
import SearchCard from 'calypso/components/search-card';
import useFetchDashboardSites from 'calypso/data/agency-dashboard/use-fetch-dashboard-sites';
import areLicenseKeysAssignableToMultisite from 'calypso/jetpack-cloud/sections/partner-portal/lib/are-license-keys-assignable-to-multisite';
import isWooCommerceProduct from 'calypso/jetpack-cloud/sections/partner-portal/lib/is-woocommerce-product';
import LayoutBody from 'calypso/layout/hosting-dashboard/body';
import LayoutHeader, {
	LayoutHeaderActions as Actions,
	LayoutHeaderSubtitle as Subtitle,
	LayoutHeaderTitle as Title,
} from 'calypso/layout/hosting-dashboard/header';
import { addQueryArgs } from 'calypso/lib/url';
import { useDispatch, useSelector } from 'calypso/state';
import { getActiveAgencyId } from 'calypso/state/a8c-for-agencies/agency/selectors';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import { getCurrentUser } from 'calypso/state/current-user/selectors';
import { resetSite, setPurchasedLicense } from 'calypso/state/jetpack-agency-dashboard/actions';
import { errorNotice } from 'calypso/state/notices/actions';
import { DEFAULT_SORT_DIRECTION, DEFAULT_SORT_FIELD } from '../../sites/constants';
import { Site } from '../../sites/types';
import AssignLicenseStepProgress from '../assign-license-step-progress';
import useAssignLicensesToSite from '../products-overview/hooks/use-assign-licenses-to-site';
import { SITE_CARDS_PER_PAGE } from './constants';

import './styles.scss';

type Props = {
	initialPage: number;
	initialSearch: string;
};

export default function AssignLicense( { initialPage, initialSearch }: Props ) {
	const translate = useTranslate();
	const dispatch = useDispatch();

	const user = useSelector( getCurrentUser );

	const { isFeedbackShown } = useShowFeedback( FeedbackType.PurchaseCompleted );

	const [ selectedSite, setSelectedSite ] = useState( { ID: 0, domain: '' } );
	const [ currentPage, setCurrentPage ] = useState< number >( initialPage );
	const [ search, setSearch ] = useState< string >( initialSearch );
	const [ totalSites, setTotalSites ] = useState< number >( 0 );

	const { assignLicensesToSite, isPending } = useAssignLicensesToSite( selectedSite, {
		onError: ( error: any ) => {
			if ( error.code === 'partner_not_connected_to_site' ) {
				dispatch(
					errorNotice(
						translate(
							'Connect your WordPress.com user (%(username)s) as a site admin to continue. {{a}}How to connect {{/a}}↗',
							{
								args: {
									username: user?.display_name ?? '',
								},
								components: {
									a: (
										<a
											href="https://agencieshelp.automattic.com/knowledge-base/invite-and-manage-team-members/#limitations-for-the-team-member-role"
											target="_blank"
											rel="noopener noreferrer"
										/>
									),
								},
							}
						),
						{ isPersistent: true, id: 'partner_not_connected_to_site' }
					)
				);
				return;
			}
			dispatch( errorNotice( error.message, { isPersistent: true, id: 'assign_license_error' } ) );
		},
	} );

	const licenseKeysArray = useMemo( () => {
		const products = getQueryArg( window.location.href, 'products' );
		if ( typeof products === 'string' ) {
			return products.split( ',' );
		}

		const licenseKey = getQueryArg( window.location.href, 'key' );
		if ( typeof licenseKey === 'string' ) {
			return [ licenseKey ];
		}

		return [];
	}, [] );

	const filterOutMultisites = ! areLicenseKeysAssignableToMultisite( licenseKeysArray );

	const agencyId = useSelector( getActiveAgencyId );

	const { data, isError, isLoading } = useFetchDashboardSites( {
		isPartnerOAuthTokenLoaded: false,
		searchQuery: search,
		currentPage: currentPage,
		perPage: SITE_CARDS_PER_PAGE,
		filter: {
			issueTypes: [],
			showOnlyFavorites: false,
			showOnlyDevelopmentSites: false,
			...( filterOutMultisites && { isNotMultisite: true } ),
		},
		sort: {
			field: DEFAULT_SORT_FIELD,
			direction: DEFAULT_SORT_DIRECTION,
		},
		agencyId,
	} );

	useEffect( () => {
		if ( isLoading || isError ) {
			return;
		}

		setTotalSites( data?.total );
	}, [ data, isError, isLoading ] );

	useEffect( () => {
		const urlSearch = getQueryArg( window.location.search, 'search' );
		const urlPage = getQueryArg( window.location.search, 'page' );

		if ( search !== urlSearch ) {
			setCurrentPage( 1 );
		}

		if ( search === urlSearch && currentPage.toString() === urlPage ) {
			return;
		}

		const queryParams = { search, page: currentPage };
		const currentPath = window.location.pathname + window.location.search;

		page( addQueryArgs( queryParams, currentPath ) );
	}, [ search, currentPage, setCurrentPage ] );

	const showDownloadStep = licenseKeysArray.some( isWooCommerceProduct );

	useEffect( () => {
		const layoutClass = 'layout__content--partner-portal-assign-license';
		const content = document.getElementById( 'content' );

		if ( content ) {
			content.classList.add( layoutClass );

			return () => content.classList.remove( layoutClass );
		}
	}, [] );

	const title = translate( 'Assign your license', 'Assign your licenses', {
		count: licenseKeysArray.length,
	} );

	const onClickAssignLater = useCallback( () => {
		if ( licenseKeysArray.length > 1 ) {
			page.redirect( A4A_LICENSES_LINK );
		}

		const licenseKey = licenseKeysArray[ 0 ];
		page.redirect( addQueryArgs( { highlight: licenseKey }, A4A_LICENSES_LINK ) );
	}, [ licenseKeysArray ] );

	const onClickAssignLicenses = useCallback( async () => {
		dispatch(
			recordTracksEvent( 'calypso_a4a_assign_multiple_licenses_submit', {
				products: licenseKeysArray.join( ',' ),
				selected_site: selectedSite?.ID,
			} )
		);

		const assignLicensesResult = await assignLicensesToSite( licenseKeysArray );

		dispatch( resetSite() );
		dispatch( setPurchasedLicense( assignLicensesResult ) );

		const rejectedProduct = assignLicensesResult.selectedProducts.find(
			( product ) => product.status === 'rejected'
		);

		const hasOnlyOneLicense = licenseKeysArray.length === 1;

		const goToDownloadStep = licenseKeysArray.some( ( licenseKey ) =>
			isWooCommerceProduct( licenseKey )
		);

		// We don't want to redirect if there is a rejected product
		// and there is only one license (there will always be one license as we don't have a flow for multiple licenses)
		// or the product is a WooCommerce product
		if ( rejectedProduct && ( hasOnlyOneLicense || goToDownloadStep ) ) {
			return;
		}

		if ( goToDownloadStep ) {
			return page.redirect(
				addQueryArgs(
					{ products: licenseKeysArray.join( ',' ), attachedSiteId: selectedSite?.ID },
					A4A_MARKETPLACE_DOWNLOAD_PRODUCTS_LINK
				)
			);
		}

		const fromDashboard = getQueryArg( window.location.href, 'source' ) === 'dashboard';
		const redirectUrl = fromDashboard ? A4A_SITES_LINK : A4A_LICENSES_LINK;
		return isFeedbackShown
			? page.redirect( redirectUrl )
			: page.redirect(
					addQueryArgs(
						{
							redirectUrl: redirectUrl,
							type: FeedbackType.PurchaseCompleted,
						},
						A4A_FEEDBACK_LINK
					)
			  );
	}, [ assignLicensesToSite, dispatch, isFeedbackShown, licenseKeysArray, selectedSite?.ID ] );

	return (
		<Layout
			className={ clsx( 'assign-license' ) }
			title={ title }
			wide
			sidebarNavigation={ <MobileSidebarNavigation /> }
		>
			<LayoutTop>
				<AssignLicenseStepProgress
					currentStep="assignLicense"
					showDownloadStep={ showDownloadStep }
				/>

				<LayoutHeader>
					<Title>{ title } </Title>
					<Subtitle>
						{ translate( 'Select the website you would like to assign the license to.' ) }
					</Subtitle>

					<Actions>
						<div className="assign-license__controls">
							<Button
								borderless
								onClick={ onClickAssignLater }
								disabled={ isPending }
								className="assign-license-form__assign-later"
							>
								{ translate( 'Assign later' ) }
							</Button>

							<Button
								primary
								className="assign-license__assign-now"
								disabled={ selectedSite?.ID === 0 }
								busy={ isPending }
								onClick={ onClickAssignLicenses }
							>
								{ translate( 'Assign %(numLicenses)d License', 'Assign %(numLicenses)d Licenses', {
									count: licenseKeysArray.length,
									args: {
										numLicenses: licenseKeysArray.length,
									},
								} ) }
							</Button>
						</div>
					</Actions>
				</LayoutHeader>
			</LayoutTop>

			<LayoutBody>
				<SearchCard
					className="assign-license__search-field"
					placeHolder={ translate( 'Search for website URL right here' ) }
					onSearch={ ( query: string ) => setSearch( query ) }
					initialValue={ search }
				/>

				<div className="assign-license__sites-list">
					{ data?.sites.map( ( site: Site ) => {
						return (
							<Card
								key={ site.blog_id }
								onClick={ () =>
									setSelectedSite( { ID: site.blog_id, domain: site.url_with_scheme } )
								}
							>
								<FormRadio
									className="assign-license-form__site-card-radio"
									label={ site.url_with_scheme }
									name="site_select"
									disabled={ isPending }
									checked={ selectedSite?.ID === site.blog_id }
									onChange={ () =>
										setSelectedSite( { ID: site.blog_id, domain: site.url_with_scheme } )
									}
								/>
							</Card>
						);
					} ) }
					{ data?.sites.length === 0 && (
						<div className={ clsx( 'card', 'assign-license__sites-no-results' ) }>
							{ translate( 'No results' ) }
						</div>
					) }
				</div>

				<Pagination
					className="assign-license__pagination"
					page={ currentPage }
					perPage={ SITE_CARDS_PER_PAGE }
					total={ totalSites }
					pageClick={ ( page: number ) => setCurrentPage( page ) }
				/>
			</LayoutBody>
		</Layout>
	);
}
