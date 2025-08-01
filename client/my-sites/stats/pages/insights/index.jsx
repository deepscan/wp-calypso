import config from '@automattic/calypso-config';
import clsx from 'clsx';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import StatsNavigation from 'calypso/blocks/stats-navigation';
import DocumentHead from 'calypso/components/data/document-head';
import JetpackColophon from 'calypso/components/jetpack-colophon';
import PageHeader from 'calypso/my-sites/stats/components/headers/page-header';
import Main from 'calypso/my-sites/stats/components/stats-main';
import { STATS_FEATURE_PAGE_INSIGHTS, STATS_PRODUCT_NAME } from 'calypso/my-sites/stats/constants';
import StatsModuleComments from 'calypso/my-sites/stats/features/modules/stats-comments';
import StatShares from 'calypso/my-sites/stats/features/modules/stats-shares';
import StatsModuleTags from 'calypso/my-sites/stats/features/modules/stats-tags';
import usePlanUsageQuery from 'calypso/my-sites/stats/hooks/use-plan-usage-query';
import { useShouldGateStats } from 'calypso/my-sites/stats/hooks/use-should-gate-stats';
import { recordCurrentScreen } from 'calypso/my-sites/stats/hooks/use-stats-navigation-history';
import { useSelector } from 'calypso/state';
import { STATS_PLAN_USAGE_RECEIVE } from 'calypso/state/action-types';
import { isJetpackSite } from 'calypso/state/sites/selectors';
import { getSelectedSiteId, getSelectedSiteSlug } from 'calypso/state/ui/selectors';
import useStatsStrings from '../../hooks/use-stats-strings';
import AllTimeHighlightsSection from '../../sections/all-time-highlights-section';
import AllTimeViewsSection from '../../sections/all-time-views-section';
import AnnualHighlightsSection from '../../sections/annual-highlights-section';
import PostingActivity from '../../sections/posting-activity-section';
import PageViewTracker from '../../stats-page-view-tracker';
import StatsUpsell from '../../stats-upsell/insights-upsell';
import StatsModuleListing from '../shared/stats-module-listing';

function StatsInsights( { context } ) {
	const siteId = useSelector( ( state ) => getSelectedSiteId( state ) );
	const siteSlug = useSelector( ( state ) => getSelectedSiteSlug( state, siteId ) );
	const isJetpack = useSelector( ( state ) => isJetpackSite( state, siteId ) );
	const moduleStrings = useStatsStrings();
	const { isPending, data: usageInfo } = usePlanUsageQuery( siteId );
	const reduxDispatch = useDispatch();

	// Dispatch the plan usage data to the Redux store for monthly views check in shouldGateStats.
	useEffect( () => {
		if ( ! isPending ) {
			reduxDispatch( {
				type: STATS_PLAN_USAGE_RECEIVE,
				siteId,
				data: usageInfo,
			} );
		}
	}, [ reduxDispatch, isPending, siteId, usageInfo ] );

	const shouldGateInsights = useShouldGateStats( STATS_FEATURE_PAGE_INSIGHTS );
	const shouldRendeUpsell = config.isEnabled( 'stats/paid-wpcom-v3' ) && shouldGateInsights;

	useEffect(
		() =>
			// Necessary to properly configure the fixed navigation headers.
			sessionStorage.setItem( 'jp-stats-last-tab', 'insights' ),
		[]
	); // Track the last viewed tab.

	useEffect( () => {
		const query = context.query;
		recordCurrentScreen(
			'insights',
			{
				queryParams: query,
				period: null,
			},
			true
		);
	}, [ context.query ] );

	const isWPAdmin = config.isEnabled( 'is_odyssey' );
	const insightsPageClasses = clsx( 'stats', { 'is-odyssey-stats': isWPAdmin } );

	// TODO: should be refactored into separate components
	/* eslint-disable wpcalypso/jsx-classname-namespace */
	return (
		<Main fullWidthLayout>
			<DocumentHead title={ STATS_PRODUCT_NAME } />
			<PageViewTracker path="/stats/insights/:site" title="Stats > Insights" />
			<div className={ insightsPageClasses }>
				<PageHeader />
				<StatsNavigation selectedItem="insights" siteId={ siteId } slug={ siteSlug } />
				{ shouldRendeUpsell ? (
					<div id="my-stats-content" className="stats-content">
						<StatsUpsell siteId={ siteId } />
					</div>
				) : (
					<>
						<AnnualHighlightsSection siteId={ siteId } />
						<AllTimeHighlightsSection siteId={ siteId } siteSlug={ siteSlug } />
						<PostingActivity siteId={ siteId } />
						<AllTimeViewsSection siteId={ siteId } slug={ siteSlug } />
						<StatsModuleListing className="stats__module-list--insights" siteId={ siteId }>
							<StatsModuleTags
								moduleStrings={ moduleStrings.tags }
								hideSummaryLink
								className={ clsx(
									{
										'stats__flexible-grid-item--half': isJetpack,
										'stats__flexible-grid-item--full--large': isJetpack,
									},
									{
										'stats__flexible-grid-item--full': ! isJetpack,
									}
								) }
							/>

							<StatsModuleComments
								className={ clsx(
									'stats__flexible-grid-item--half',
									'stats__flexible-grid-item--full--large'
								) }
							/>

							{ /** TODO: The feature depends on Jetpack Sharing module and is disabled for all Jetpack Sites for now. */ }
							{ ! isJetpack && (
								<StatShares
									siteId={ siteId }
									className={ clsx(
										'stats__flexible-grid-item--half',
										'stats__flexible-grid-item--full--large'
									) }
								/>
							) }
						</StatsModuleListing>
						<JetpackColophon />
					</>
				) }
			</div>
		</Main>
	);
	/* eslint-enable wpcalypso/jsx-classname-namespace */
}

export default StatsInsights;
