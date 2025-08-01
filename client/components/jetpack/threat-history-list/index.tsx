import page from '@automattic/calypso-router';
import { useMobileBreakpoint } from '@automattic/viewport-react';
import { useTranslate } from 'i18n-calypso';
import { useCallback, useMemo, useState } from 'react';
import * as React from 'react';
import QueryJetpackScanHistory from 'calypso/components/data/query-jetpack-scan-history';
import QueryJetpackScanThreatCounts from 'calypso/components/data/query-jetpack-scan-threat-counts';
import { Threat } from 'calypso/components/jetpack/threat-item/types';
import ThreatListHeader from 'calypso/components/jetpack/threat-list-header';
import Pagination from 'calypso/components/pagination';
import { useDispatch, useSelector } from 'calypso/state';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import getSiteScanHistory from 'calypso/state/selectors/get-site-scan-history';
import getSiteScanThreatCounts, {
	JetpackScanThreatCounts,
} from 'calypso/state/selectors/get-site-scan-threat-counts';
import isRequestingJetpackScanHistory from 'calypso/state/selectors/is-requesting-jetpack-scan-history';
import isRequestingJetpackScanThreatCounts from 'calypso/state/selectors/is-requesting-jetpack-scan-threat-counts';
import { getSelectedSiteId, getSelectedSiteSlug } from 'calypso/state/ui/selectors';
import ListItems, { ListItemsPlaceholder } from './list-items';
import ThreatStatusFilter, { FilterValue, FilterOption } from './threat-status-filter';

const THREATS_PER_PAGE = 10;

const trackFilterChange = ( siteId: number, filter: string ) =>
	recordTracksEvent( 'calypso_jetpack_scan_history_filter', {
		site_id: siteId,
		filter,
	} );

const getFilteredThreatCount = (
	threatCounts: JetpackScanThreatCounts,
	filter: FilterValue
): number => {
	// In the context of threat history, "All" means "fixed or ignored"
	if ( ! filter || filter === 'all' ) {
		return ( threatCounts.fixed || 0 ) + ( threatCounts.ignored || 0 );
	}

	return threatCounts[ filter ] || 0;
};

const getNoThreatsMessage = (
	translate: ReturnType< typeof useTranslate >,
	filter: undefined | string
) => {
	if ( ! filter || filter === '' ) {
		return translate( 'So far, there are no archived threats on your site.' );
	}

	if ( filter === 'fixed' ) {
		return translate( 'So far, there are no fixed threats on your site.', {
			comment: '"fixed," as in the past tense of "to fix"',
		} );
	}

	if ( filter === 'ignored' ) {
		return translate( 'So far, there are no ignored threats on your site.' );
	}

	return null;
};

const ThreatHistoryList: React.FC< ThreatHistoryListProps > = ( { filter } ) => {
	const translate = useTranslate();
	const isMobile = useMobileBreakpoint();

	const dispatch = useDispatch();
	const siteId = useSelector( getSelectedSiteId ) as number;
	const siteSlug = useSelector( getSelectedSiteSlug );

	const isRequestingThreatCounts = useSelector( ( state ) =>
		isRequestingJetpackScanThreatCounts( state, siteId )
	);
	const threatCounts = useSelector( ( state ) => getSiteScanThreatCounts( state, siteId ) );
	const hasThreatsInHistory =
		threatCounts && Object.values( threatCounts ).some( ( c ) => c && c > 0 );
	const filteredThreatCount = getFilteredThreatCount( threatCounts, filter );

	const isRequestingThreatHistory = useSelector( ( state ) =>
		isRequestingJetpackScanHistory( state, siteId )
	);

	const threats = useSelector( ( state ) => getSiteScanHistory( state, siteId ) as Threat[] );
	const [ currentPage, setCurrentPage ] = useState( 1 );
	const showPagination = ! isRequestingThreatCounts && filteredThreatCount > THREATS_PER_PAGE;

	const filteredThreats = useMemo( () => {
		if ( ! filter || filter === 'all' ) {
			return threats;
		}

		return threats.filter( ( entry ) => entry.status === filter );
	}, [ filter, threats ] );

	const onFilterChange = useCallback(
		( selected: FilterOption ) => {
			if ( selected?.value === filter ) {
				return;
			}

			let filterPathParam: FilterValue | '' = selected.value;
			if ( filterPathParam === 'all' ) {
				filterPathParam = '';
			}

			setCurrentPage( 1 );

			dispatch( trackFilterChange( siteId, filterPathParam ) );
			page.show( `/scan/history/${ siteSlug }/${ filterPathParam }` );
		},
		[ filter, dispatch, siteId, siteSlug ]
	);

	const currentPageThreats = filteredThreats.slice(
		( currentPage - 1 ) * THREATS_PER_PAGE,
		currentPage * THREATS_PER_PAGE
	);

	return (
		<div className="threat-history-list">
			<QueryJetpackScanThreatCounts siteId={ siteId } />
			<QueryJetpackScanHistory siteId={ siteId } />

			{ /* Loading threat counts should be pretty quick,
			     so no need to show any indicators while it's happening
			*/ }

			{
				// We can safely show the filter selector without having specific threat info
				! isRequestingThreatCounts && hasThreatsInHistory && (
					<div className="threat-history-list__filters-wrapper">
						<ThreatStatusFilter initialSelected={ filter } onSelect={ onFilterChange } />
					</div>
				)
			}

			{ ! isRequestingThreatCounts && filteredThreatCount === 0 && (
				<p className="threat-history-list__no-entries">
					{ getNoThreatsMessage( translate, filter ) }
				</p>
			) }

			{ ! isRequestingThreatCounts && filteredThreatCount > 0 && (
				<div className="threat-history-list__entries">
					{ isRequestingThreatHistory && (
						<ListItemsPlaceholder count={ filteredThreatCount } perPage={ THREATS_PER_PAGE } />
					) }
					{ ! isRequestingThreatHistory && (
						<>
							{ showPagination && (
								<Pagination
									compact={ isMobile }
									className="threat-history-list__pagination--top"
									total={ threats.length }
									perPage={ THREATS_PER_PAGE }
									page={ currentPage }
									pageClick={ setCurrentPage }
									nextLabel={ translate( 'Older' ) }
									prevLabel={ translate( 'Newer' ) }
								/>
							) }

							<ThreatListHeader />

							<div className="threat-history-list__threats">
								<ListItems items={ currentPageThreats } />
							</div>

							{ showPagination && (
								<Pagination
									compact={ isMobile }
									className="threat-history-list__pagination--bottom"
									total={ threats.length }
									perPage={ THREATS_PER_PAGE }
									page={ currentPage }
									pageClick={ setCurrentPage }
									nextLabel={ translate( 'Older' ) }
									prevLabel={ translate( 'Newer' ) }
								/>
							) }
						</>
					) }
				</div>
			) }
		</div>
	);
};

type ThreatHistoryListProps = {
	filter: FilterValue;
};

export default ThreatHistoryList;
