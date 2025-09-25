import pagejs from '@automattic/calypso-router';
import {
	type SiteExcerptData,
	SitesSortKey,
	useFilterDeletedSites,
	useSitesListFiltering,
	useSitesListGrouping,
	useSitesListSorting,
} from '@automattic/sites';
import { GroupableSiteLaunchStatuses } from '@automattic/sites/src/use-sites-list-grouping';
import { DESKTOP_BREAKPOINT, WIDE_BREAKPOINT } from '@automattic/viewport';
import { useBreakpoint } from '@automattic/viewport-react';
import clsx from 'clsx';
import { translate } from 'i18n-calypso';
import React, { useEffect, useMemo, useState, useRef } from 'react';
import AsyncLoad from 'calypso/components/async-load';
import DocumentHead from 'calypso/components/data/document-head';
import GuidedTour from 'calypso/components/guided-tour';
import { GuidedTourContextProvider } from 'calypso/components/guided-tour/data/guided-tour-context';
import { useCurrentRoute } from 'calypso/components/route';
import { useSiteExcerptsQuery } from 'calypso/data/sites/use-site-excerpts-query';
import Layout from 'calypso/layout/hosting-dashboard';
import LayoutColumn from 'calypso/layout/hosting-dashboard/column';
import LayoutHeader, {
	LayoutHeaderActions as Actions,
	LayoutHeaderTitle as Title,
} from 'calypso/layout/hosting-dashboard/header';
import LayoutTop from 'calypso/layout/hosting-dashboard/top';
import { recordTracksEvent } from 'calypso/lib/analytics/tracks';
import { isP2Theme } from 'calypso/lib/site/utils';
import {
	SitesDashboardQueryParams,
	handleQueryParamChange,
} from 'calypso/sites-dashboard/components/sites-content-controls';
import { useSelector } from 'calypso/state';
import { shouldShowSiteDashboard } from 'calypso/state/global-sidebar/selectors';
import { useSitesSorting } from 'calypso/state/sites/hooks/use-sites-sorting';
import { getSite } from 'calypso/state/sites/selectors';
import { getSelectedSite } from 'calypso/state/ui/selectors';
import { useInitializeDataViewsPage } from '../hooks/use-initialize-dataviews-page';
import { useShowSiteCreationNotice } from '../hooks/use-show-site-creation-notice';
import { useShowSiteTransferredNotice } from '../hooks/use-show-site-transferred-notice';
import { useTracksEventOnFilterChange } from '../hooks/use-tracks-event-on-filter-change';
import {
	CALYPSO_ONBOARDING_TOURS_PREFERENCE_NAME,
	CALYPSO_ONBOARDING_TOURS_EVENT_NAMES,
	useOnboardingTours,
} from '../onboarding-tours';
import { OVERVIEW, FEATURE_TO_ROUTE_MAP } from './site-preview-pane/constants';
import DotcomPreviewPane from './site-preview-pane/dotcom-preview-pane';
import { useRestoreSitesBanner } from './sites-dashboard-banners/use-restore-sites-reminder-banner';
import SitesDashboardBannersManager from './sites-dashboard-banners-manager';
import SitesDashboardHeader from './sites-dashboard-header';
import DotcomSitesDataViews, { useSiteStatusGroups } from './sites-dataviews';
import { getSitesPagination } from './sites-dataviews/utils';
import type { View } from '@wordpress/dataviews';

// todo: we are using A4A styles until we extract them as common styles in the ItemsDashboard component
import './style.scss';

// Add Dotcom specific styles
import './dotcom-style.scss';

import './guided-tours.scss';

interface SitesDashboardProps {
	queryParams: SitesDashboardQueryParams;
	initialSiteFeature?: string;
	selectedSiteFeaturePreview?: React.ReactNode;
	sectionName?: string;
	isOnlyLayoutView?: boolean;
}

const siteSortingKeys = [
	{ dataView: 'site-title', sortKey: 'alphabetically' },
	{ dataView: 'last-publish', sortKey: 'updatedAt' },
	{ dataView: 'last-interacted', sortKey: 'lastInteractedWith' },
	{ dataView: 'plan', sortKey: 'plan' },
	{ dataView: 'status', sortKey: 'status' },
];

const DEFAULT_PER_PAGE = 50;
const DEFAULT_SITE_TYPE = 'non-p2';

const desktopFields = [ 'plan', 'status', 'last-publish', 'stats' ];
const mobileFields: string[] = [];
const listViewFields: string[] = [];

const getFieldsByBreakpoint = ( selectedSite: boolean, isDesktop: boolean ) => {
	if ( selectedSite ) {
		return listViewFields;
	}
	return isDesktop ? desktopFields : mobileFields;
};

export function showSitesPage( route: string, openInNewTab = false ) {
	const currentParams = new URL( window.location.href ).searchParams;
	const newUrl = new URL( route, window.location.origin );

	const supportedParams = [ 'page', 'per-page', 'search', 'status', 'siteType' ];
	supportedParams.forEach( ( param ) => {
		if ( currentParams.has( param ) ) {
			const value = currentParams.get( param );
			if ( value ) {
				newUrl.searchParams.set( param, value );
			}
		}
	} );

	if ( openInNewTab ) {
		const newWindow = window.open(
			newUrl.toString().replace( window.location.origin, '' ),
			'_blank'
		);
		if ( newWindow ) {
			newWindow.opener = null;
		}
	} else {
		pagejs.show( newUrl.toString().replace( window.location.origin, '' ) );
	}
}

const SitesDashboard = ( {
	// Note - control params (eg. search, page, perPage, status...) are currently meant for
	// initializing the dataViewsState. Further calculations should reference the dataViewsState.
	queryParams: {
		page = 1,
		perPage = DEFAULT_PER_PAGE,
		search,
		newSiteID,
		status,
		siteType = DEFAULT_SITE_TYPE,
	},
	initialSiteFeature = OVERVIEW,
	selectedSiteFeaturePreview = undefined,
	isOnlyLayoutView = undefined,
}: SitesDashboardProps ) => {
	const [ initialSortApplied, setInitialSortApplied ] = useState( false );
	const isWide = useBreakpoint( WIDE_BREAKPOINT );
	const isDesktop = useBreakpoint( DESKTOP_BREAKPOINT );
	const { hasSitesSortingPreferenceLoaded, sitesSorting, onSitesSortingChange } = useSitesSorting();
	const selectedSite = useSelector( getSelectedSite );
	const getSiteFromState = useSelector(
		( state ) => ( siteId: number ) => getSite( state, siteId )
	);
	const { shouldShow: isRestoringAccount } = useRestoreSitesBanner();

	const sitesFilterCallback = ( site: SiteExcerptData ) => {
		const { options } = site || {};

		// Early return if the site is domain-only
		if ( options?.is_domain_only ) {
			return false;
		}

		// siteType is 'all' - filter out sites that are P2 sites
		if ( siteType === DEFAULT_SITE_TYPE ) {
			return (
				! options?.is_wpforteams_site &&
				( ! options?.theme_slug || ! isP2Theme( options.theme_slug ) )
			);
		}

		// siteType is 'p2' - filter out sites that are not P2
		return (
			!! options?.is_wpforteams_site ||
			!! ( options?.theme_slug && isP2Theme( options.theme_slug ) )
		);
	};

	const { data: allSites = [], isLoading } = useSiteExcerptsQuery(
		[],
		sitesFilterCallback,
		'all',
		[ 'is_a4a_dev_site', 'site_migration' ],
		[ 'theme_slug' ],
		// Don't fetch sites on narrow screens since it's not visible.
		! selectedSite || isWide
	);

	useShowSiteCreationNotice( allSites, newSiteID );
	useShowSiteTransferredNotice();

	const siteStatusGroups = useSiteStatusGroups();

	// Create the DataViews state based on initial values
	const defaultDataViewsState: View = {
		sort: {
			field: '',
			direction: 'asc',
		},
		page,
		perPage,
		search: search ?? '',
		fields: getFieldsByBreakpoint( !! selectedSite, isDesktop ),
		...( status
			? {
					filters: [
						{
							field: 'status',
							operator: 'is',
							value: siteStatusGroups.find( ( item ) => item.slug === status )?.value || 1,
						},
					],
			  }
			: {} ),
		...( selectedSite
			? {
					type: 'list',
					titleField: 'site-title',
					showTitle: true,
					mediaField: 'icon',
					showMedia: true,
			  }
			: {
					type: 'table',
					titleField: 'site-title',
					showTitle: true,
					mediaField: 'icon',
					showMedia: true,
					layout: {
						styles: {
							site: {
								width: '40%',
							},
							plan: {
								width: '126px',
							},
							status: {
								width: '142px',
							},
							'last-publish': {
								width: '146px',
							},
							stats: {
								width: '106px',
							},
						},
					},
			  } ),
	};
	const [ dataViewsState, setDataViewsState ] = useState< View >( defaultDataViewsState );

	useEffect( () => {
		const fields = getFieldsByBreakpoint( !! selectedSite, isDesktop );
		const fieldsForBreakpoint = [ ...fields ].sort().toString();
		const existingFields = [ ...( dataViewsState?.fields ?? [] ) ].sort().toString();
		// Compare the content of the arrays, not its referrences that will always be different.
		// sort() sorts the array in place, so we need to clone them first.
		if ( existingFields !== fieldsForBreakpoint ) {
			setDataViewsState( ( prevState ) => ( { ...prevState, fields } ) );
		}
	}, [ isDesktop, isWide, dataViewsState, selectedSite ] );

	// Ensure site sort preference is applied when it loads in. This isn't always available on
	// initial mount.
	useEffect( () => {
		// Ensure we set and check initialSortApplied to prevent infinite loops when changing sort
		// values after initial sort.
		if ( hasSitesSortingPreferenceLoaded && ! initialSortApplied ) {
			const newSortField =
				siteSortingKeys.find( ( key ) => key.sortKey === sitesSorting.sortKey )?.dataView || '';
			const newSortDirection = sitesSorting.sortOrder;

			setDataViewsState( ( prevState ) => ( {
				...prevState,
				sort: {
					field: newSortField,
					direction: newSortDirection,
				},
			} ) );

			setInitialSortApplied( true );
		}
	}, [
		hasSitesSortingPreferenceLoaded,
		sitesSorting,
		dataViewsState.sort,
		initialSortApplied,
		siteType,
	] );

	// Get the status group slug.
	const statusSlug = useMemo( () => {
		const statusFilter = dataViewsState.filters?.find( ( filter ) => filter.field === 'status' );
		const statusNumber = statusFilter?.value;
		return siteStatusGroups.find( ( status ) => status.value === statusNumber )
			?.slug as GroupableSiteLaunchStatuses;
	}, [ dataViewsState.filters, siteStatusGroups ] );

	// Filter sites list by status group.
	const { currentStatusGroup, statuses } = useSitesListGrouping( allSites, {
		status: statusSlug || 'all',
		showHidden: true,
	} );

	// Remove deleted sites from default view
	const filteredStatusGroup = useFilterDeletedSites( currentStatusGroup, {
		shouldApplyFilter:
			! search && ( ! statusSlug || statusSlug === 'all' ) && ! isRestoringAccount(),
	} );

	// Perform sorting actions
	const sortedSites = useSitesListSorting( filteredStatusGroup, {
		sortKey: siteSortingKeys.find( ( key ) => key.dataView === dataViewsState.sort?.field )
			?.sortKey as SitesSortKey,
		sortOrder: dataViewsState.sort?.direction || undefined,
	} );

	const hasA8CSitesFilter =
		dataViewsState.filters?.some(
			( { field, operator, value } ) => field === 'is_a8c' && operator === 'is' && value === true
		) ?? false;

	const includeA8CSites = siteType === 'p2' || hasA8CSitesFilter;

	// Filter sites list by search query.
	const filteredSites = useSitesListFiltering( sortedSites, {
		search: dataViewsState.search,
		includeA8CSites,
	} );

	const paginatedSites =
		dataViewsState.page && dataViewsState.perPage
			? filteredSites.slice(
					( dataViewsState.page - 1 ) * dataViewsState.perPage,
					dataViewsState.page * dataViewsState.perPage
			  )
			: filteredSites;

	const onboardingTours = useOnboardingTours();

	useInitializeDataViewsPage( dataViewsState, setDataViewsState );

	// Update URL with view control params on change.
	useEffect( () => {
		const queryParams = {
			search: dataViewsState.search?.trim(),
			status: statusSlug,
			page: dataViewsState.page && dataViewsState.page > 1 ? dataViewsState.page : undefined,
			'per-page': dataViewsState.perPage === DEFAULT_PER_PAGE ? undefined : dataViewsState.perPage,
		};

		window.setTimeout( () => handleQueryParamChange( queryParams ) );
	}, [ dataViewsState.search, dataViewsState.page, dataViewsState.perPage, statusSlug ] );

	// Update site sorting preference on change
	useEffect( () => {
		if ( dataViewsState.sort?.field ) {
			onSitesSortingChange( {
				sortKey: siteSortingKeys.find( ( key ) => key.dataView === dataViewsState.sort?.field )
					?.sortKey as SitesSortKey,
				sortOrder: dataViewsState.sort.direction || 'asc',
			} );
		}
	}, [ dataViewsState.sort, onSitesSortingChange ] );

	useTracksEventOnFilterChange( dataViewsState.filters ?? [] );

	// Manage the closing of the preview pane
	const closeSitePreviewPane = () => {
		if ( selectedSite ) {
			showSitesPage( '/sites' );
		}
	};

	const initialSiteFeatureRef = useRef( initialSiteFeature );
	initialSiteFeatureRef.current = initialSiteFeature;

	const sitePreviewPane = useMemo(
		() => ( {
			getUrl: ( site: SiteExcerptData ) => {
				return `/${ FEATURE_TO_ROUTE_MAP[ initialSiteFeatureRef.current ].replace(
					':site',
					site.slug
				) }`;
			},
			open: (
				site: SiteExcerptData,
				source: 'site_field' | 'action' | 'list_row_click' | 'environment_switcher',
				openInNewTab?: boolean
			) => {
				recordTracksEvent( 'calypso_sites_dashboard_open_site_preview_pane', {
					site_id: site.ID,
					source,
				} );
				showSitesPage( sitePreviewPane.getUrl( site ), openInNewTab );
			},
		} ),
		[]
	);

	const changeSitePreviewPane = ( siteId: number ) => {
		// allSites does not always query all sites (e.g. for small screens),
		// so we need to get the site from the state in those cases
		const targetSite =
			allSites.find( ( site ) => site.ID === siteId ) || getSiteFromState( siteId );
		if ( targetSite ) {
			sitePreviewPane.open( targetSite, 'environment_switcher' );
		}
	};

	const { currentSection, currentRoute } = useCurrentRoute() as {
		currentSection: false | { group?: string; name?: string };
		currentRoute: string;
	};
	const showSiteDashboard = useSelector( ( state ) =>
		shouldShowSiteDashboard( {
			state,
			siteId: selectedSite?.ID ?? null,
			section: currentSection as { group?: string },
			route: currentRoute,
		} )
	);
	if ( !! selectedSite && ! showSiteDashboard ) {
		return null;
	}

	// Hide the listing on narrow screens since it's not visible.
	const hideListing = selectedSite && ! isWide;

	// todo: temporary mock data
	const isNarrowView = false;

	const dashboardTitle = siteType === 'p2' ? translate( 'P2s' ) : translate( 'Sites' );

	return (
		<Layout
			className={ clsx(
				'sites-dashboard',
				'sites-dashboard__layout',
				! selectedSite && 'preview-hidden',
				isOnlyLayoutView && 'domains-overview'
			) }
			wide
			title={ selectedSite ? null : dashboardTitle }
		>
			<DocumentHead title={ dashboardTitle } />

			{ ! hideListing && (
				<LayoutColumn className="sites-overview" wide>
					<LayoutTop withNavigation={ false }>
						<LayoutHeader>
							{ ! isNarrowView && <Title>{ dashboardTitle }</Title> }
							<Actions>
								<SitesDashboardHeader isPreviewPaneOpen={ !! selectedSite } />
							</Actions>
						</LayoutHeader>
					</LayoutTop>

					<DocumentHead title={ dashboardTitle } />
					<SitesDashboardBannersManager
						sitesStatuses={ statuses }
						sitesCount={ paginatedSites.length }
					/>

					{ ! selectedSite && siteType === DEFAULT_SITE_TYPE ? (
						<AsyncLoad require="../v2/sites-list" placeholder={ null } />
					) : (
						<DotcomSitesDataViews
							sites={ paginatedSites }
							siteType={ siteType }
							isLoading={ isLoading || ! initialSortApplied }
							paginationInfo={ getSitesPagination( filteredSites, perPage ) }
							dataViewsState={ dataViewsState }
							setDataViewsState={ setDataViewsState }
							selectedItem={ selectedSite }
							sitePreviewPane={ sitePreviewPane }
						/>
					) }
				</LayoutColumn>
			) }

			{ selectedSite && (
				<GuidedTourContextProvider
					guidedTours={ onboardingTours }
					preferenceNames={ CALYPSO_ONBOARDING_TOURS_PREFERENCE_NAME }
					eventNames={ CALYPSO_ONBOARDING_TOURS_EVENT_NAMES }
				>
					<LayoutColumn
						className={ clsx(
							'site-preview-pane',
							isOnlyLayoutView && 'domains-overview__details'
						) }
						wide
					>
						{ isOnlyLayoutView ? (
							selectedSiteFeaturePreview
						) : (
							<DotcomPreviewPane
								site={ selectedSite }
								selectedSiteFeature={ initialSiteFeature }
								selectedSiteFeaturePreview={ selectedSiteFeaturePreview }
								closeSitePreviewPane={ closeSitePreviewPane }
								changeSitePreviewPane={ changeSitePreviewPane }
							/>
						) }
					</LayoutColumn>
					<GuidedTour defaultTourId="siteManagementTour" />
				</GuidedTourContextProvider>
			) }
		</Layout>
	);
};

export default SitesDashboard;
