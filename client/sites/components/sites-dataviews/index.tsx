import { SiteExcerptData } from '@automattic/sites';
import { usePrevious } from '@wordpress/compose';
import { DataViews, Field } from '@wordpress/dataviews';
import { useI18n } from '@wordpress/react-i18n';
import { useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import JetpackLogo from 'calypso/components/jetpack-logo';
import TimeSince from 'calypso/components/time-since';
import { SitePlan } from 'calypso/sites-dashboard/components/sites-site-plan';
import { useSelector } from 'calypso/state';
import { getCurrentUserId } from 'calypso/state/current-user/selectors';
import { useActions } from './actions';
import SiteField from './dataviews-fields/site-field';
import { SiteStats } from './sites-site-stats';
import { SiteStatus } from './sites-site-status';
import type { View } from '@wordpress/dataviews';

import './style.scss';
import './dataview-style.scss';

type Props = {
	sites: SiteExcerptData[];
	isLoading: boolean;
	paginationInfo: { totalItems: number; totalPages: number };
	dataViewsState: View;
	setDataViewsState: ( callback: ( prevState: View ) => View ) => void;
	selectedItem: SiteExcerptData | null | undefined;
	openSitePreviewPane: (
		site: SiteExcerptData,
		source: 'site_field' | 'action' | 'list_row_click' | 'environment_switcher'
	) => void;
};

export function useSiteStatusGroups() {
	const { __ } = useI18n();

	return useMemo(
		() => [
			{ value: 1, label: __( 'All sites' ), slug: 'all' },
			{ value: 2, label: __( 'Public' ), slug: 'public' },
			{ value: 3, label: __( 'Private' ), slug: 'private' },
			{ value: 4, label: __( 'Coming soon' ), slug: 'coming-soon' },
			{ value: 5, label: __( 'Redirect' ), slug: 'redirect' },
			{ value: 6, label: __( 'Deleted' ), slug: 'deleted' },
		],
		[ __ ]
	);
}

const DotcomSitesDataViews = ( {
	sites,
	isLoading,
	paginationInfo,
	dataViewsState,
	setDataViewsState,
	selectedItem,
	openSitePreviewPane,
}: Props ) => {
	const { __ } = useI18n();
	const userId = useSelector( getCurrentUserId );

	// Scroll to selected site in the list when in list view.
	const scrollContainerRef = useRef< HTMLElement >();
	const previousDataViewsState = usePrevious( dataViewsState );
	const previousSelectedItem = usePrevious( selectedItem );
	useLayoutEffect( () => {
		if ( ! scrollContainerRef.current || previousDataViewsState?.type !== dataViewsState.type ) {
			scrollContainerRef.current = document.querySelector( '.dataviews-view-list' ) as HTMLElement;
		}

		if ( ! previousSelectedItem && selectedItem && dataViewsState.type === 'list' ) {
			window.setTimeout(
				() => scrollContainerRef.current?.querySelector( 'li.is-selected' )?.scrollIntoView(),
				300
			);
			return;
		}

		if ( previousDataViewsState?.page !== dataViewsState.page ) {
			scrollContainerRef.current?.scrollTo( 0, 0 );
		}
	}, [
		dataViewsState.type,
		dataViewsState.page,
		selectedItem,
		previousDataViewsState,
		previousSelectedItem,
	] );

	// By default, DataViews is in an "uncontrolled" mode, meaning the current selection is handled internally.
	// However, each time a site is selected, the URL changes, so, the component is remounted and the current selection is lost.
	// To prevent that, we want to use DataViews in "controlled" mode, so that we can pass an initial selection during initial mount.
	//
	// To do that, we need to pass a required `onSelectionChange` callback to signal that it is being used in controlled mode.
	// The current selection is a derived value which is [selectedItem.ID] (see getSelection()).
	const onSelectionChange = useCallback(
		( selectedSiteIds: string[] ) => {
			// In table view, when a row is clicked, the item is selected for a bulk action, so the panel should not open.
			if ( dataViewsState.type !== 'list' ) {
				return;
			}
			if ( selectedSiteIds.length === 0 ) {
				return;
			}
			const site = sites.find( ( s ) => s.ID === Number( selectedSiteIds[ 0 ] ) );
			if ( site ) {
				openSitePreviewPane( site, 'list_row_click' );
			}
		},
		[ dataViewsState.type, openSitePreviewPane, sites ]
	);
	const getSelection = useCallback(
		() => ( selectedItem ? [ selectedItem.ID.toString() ] : undefined ),
		[ selectedItem ]
	);

	const siteStatusGroups = useSiteStatusGroups();

	// Generate DataViews table field-columns
	const fields = useMemo< Field< SiteExcerptData >[] >(
		() => [
			{
				id: 'site',
				label: __( 'Site' ),
				header: <span>{ __( 'Site' ) }</span>,
				getValue: ( { item }: { item: SiteExcerptData } ) => item.URL,
				render: ( { item }: { item: SiteExcerptData } ) => {
					return <SiteField site={ item } openSitePreviewPane={ openSitePreviewPane } />;
				},
				enableHiding: false,
				enableSorting: true,
			},
			{
				id: 'plan',
				label: __( 'Plan' ),
				header: <span>{ __( 'Plan' ) }</span>,
				render: ( { item }: { item: SiteExcerptData } ) => (
					<SitePlan site={ item } userId={ userId } />
				),
				enableHiding: false,
				enableSorting: true,
			},
			{
				id: 'status',
				label: __( 'Status' ),
				render: ( { item }: { item: SiteExcerptData } ) => <SiteStatus site={ item } />,
				enableHiding: false,
				enableSorting: true,
				elements: siteStatusGroups,
				filterBy: {
					operators: [ 'is' ],
				},
			},
			{
				id: 'last-publish',
				label: __( 'Last Published' ),
				header: <span>{ __( 'Last Published' ) }</span>,
				render: ( { item }: { item: SiteExcerptData } ) =>
					item.options?.updated_at ? <TimeSince date={ item.options.updated_at } /> : '',
				enableHiding: false,
				enableSorting: true,
			},
			{
				id: 'stats',
				label: __( 'Stats' ),
				header: (
					<span className="sites-dataviews__stats-label">
						<JetpackLogo size={ 16 } />
						<span>{ __( 'Stats' ) }</span>
					</span>
				),
				render: ( { item }: { item: SiteExcerptData } ) => <SiteStats site={ item } />,
				enableHiding: false,
				enableSorting: false,
			},
			{
				id: 'last-interacted',
				label: __( 'Last Interacted' ),
				render: () => null,
				enableHiding: false,
				enableSorting: true,
				getValue: () => null,
			},
		],
		[ __, openSitePreviewPane, userId, siteStatusGroups ]
	);

	const actions = useActions( {
		openSitePreviewPane,
		viewType: dataViewsState.type,
	} );

	return (
		<div className="sites-dataviews">
			<DataViews
				data={ sites }
				fields={ fields }
				onChangeView={ ( newView ) => setDataViewsState( () => newView ) }
				view={ dataViewsState }
				actions={ actions }
				search
				searchLabel={ __( 'Search sites…' ) }
				selection={ getSelection() }
				paginationInfo={ paginationInfo }
				getItemId={ ( item ) => {
					return item.ID.toString();
				} }
				isLoading={ isLoading }
				defaultLayouts={ { table: {} } }
				onChangeSelection={ onSelectionChange }
			/>
		</div>
	);
};

export default DotcomSitesDataViews;
