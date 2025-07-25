import { isEnabled } from '@automattic/calypso-config';
import { localize } from 'i18n-calypso';
import { isEqual, merge } from 'lodash';
import { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import titlecase from 'to-title-case';
import QueryMedia from 'calypso/components/data/query-media';
import JetpackColophon from 'calypso/components/jetpack-colophon';
import AnnualSiteStats from 'calypso/my-sites/stats/annual-site-stats';
import Main from 'calypso/my-sites/stats/components/stats-main';
import StatsModuleAuthors from 'calypso/my-sites/stats/features/modules/stats-authors';
import StatsModuleClicks from 'calypso/my-sites/stats/features/modules/stats-clicks';
import StatsModuleCountries from 'calypso/my-sites/stats/features/modules/stats-countries';
import StatsModuleDownloads from 'calypso/my-sites/stats/features/modules/stats-downloads';
import StatsModuleReferrers from 'calypso/my-sites/stats/features/modules/stats-referrers';
import StatsModuleSearch from 'calypso/my-sites/stats/features/modules/stats-search';
import StatsModuleTopPosts from 'calypso/my-sites/stats/features/modules/stats-top-posts';
import {
	useStatsNavigationHistory,
	recordCurrentScreen,
} from 'calypso/my-sites/stats/hooks/use-stats-navigation-history';
import getMediaItem from 'calypso/state/selectors/get-media-item';
import getEnvStatsFeatureSupportChecks from 'calypso/state/sites/selectors/get-env-stats-feature-supports';
import { getSelectedSiteId, getSelectedSiteSlug } from 'calypso/state/ui/selectors';
import PageHeader from '../components/headers/page-header';
import { STATS_FEATURE_DOWNLOAD_CSV } from '../constants';
import StatsModuleLocations from '../features/modules/stats-locations';
import LocationsNavTabs from '../features/modules/stats-locations/locations-nav-tabs';
import { GEO_MODES } from '../features/modules/stats-locations/types';
import PostsNavTabs from '../features/modules/stats-top-posts/nav-tabs';
import {
	getValidQueryViewType,
	SUB_STAT_TYPE as TOP_POSTS_SUB_STAT_TYPE,
	MAIN_STAT_TYPE as TOP_POSTS_MAIN_STAT_TYPE,
} from '../features/modules/stats-top-posts/use-option-labels';
import StatsModuleUTM from '../features/modules/stats-utm';
import { shouldGateStats } from '../hooks/use-should-gate-stats';
import useStatsStrings from '../hooks/use-stats-strings';
import { StatsGlobalValuesContext } from '../pages/providers/global-provider';
import DownloadCsv from '../stats-download-csv';
import DownloadCsvUpsell from '../stats-download-csv-upsell';
import AllTimeNav from '../stats-module/all-time-nav';
import PageViewTracker from '../stats-page-view-tracker';
import VideoPlayDetails from '../stats-video-details';
import StatsVideoSummary from '../stats-video-summary';
import VideoPressStatsModule from '../videopress-stats-module';

import './style.scss';

class StatsSummary extends Component {
	componentDidMount() {
		window.scrollTo( 0, 0 );

		const { context, period } = this.props;
		const { module } = context.params;
		const { query } = context;

		recordCurrentScreen( module, {
			queryParams: query,
			period: period?.period,
		} );
	}

	componentDidUpdate( prevProps ) {
		if ( ! isEqual( prevProps.context.query, this.props.context.query ) ) {
			const { context, period } = this.props;
			const { module } = context.params;
			const { query } = context;

			recordCurrentScreen( module, {
				queryParams: query,
				period: period?.period,
			} );
		}
	}

	getPath( statType, path ) {
		if ( statType === 'statsCountryViews' ) {
			const geoMode = this.props.context.query.geoMode;
			const geoModeLabel =
				geoMode && Object.prototype.hasOwnProperty.call( GEO_MODES, geoMode )
					? GEO_MODES[ geoMode ]
					: 'country';

			return `${ path }-${ geoModeLabel }`;
		}

		switch ( statType ) {
			case TOP_POSTS_MAIN_STAT_TYPE:
				return 'posts';

			case TOP_POSTS_SUB_STAT_TYPE:
				return 'archives';

			default:
				return path;
		}
	}

	renderSummaryHeader( path, statType, hideNavigation, query ) {
		const period = this.props.period;

		const headerCSVButton = (
			<div className="stats-module__header-nav-button">
				<DownloadCsv
					statType={ statType }
					query={ query }
					path={ this.getPath( statType, path ) }
					period={ period }
				/>
			</div>
		);

		return (
			<AllTimeNav
				path={ path }
				query={ query }
				period={ period }
				hideNavigation={ hideNavigation }
				navigationSwap={ headerCSVButton }
				context={ this.props.context }
			/>
		);
	}

	render() {
		const {
			translate,
			statsQueryOptions,
			siteId,
			supportsUTMStats,
			supportsArchiveStats,
			shouldGateStatsCsvDownload,
			lastScreen,
			statsStrings,
		} = this.props;

		const summaryViews = [];
		let title;
		let summaryView;
		let chartTitle;
		let barChart;
		let path;
		let statType;

		const isArchiveBreakdownEnabled =
			isEnabled( 'stats/archive-breakdown' ) && supportsArchiveStats;

		const { period, endOf } = this.props.period;
		const query = {
			period: period,
			date: endOf.format( 'YYYY-MM-DD' ),
			max: 0,
		};

		// Update query with date range if it provided.
		// Note that we force the period to 'day' for custom date ranges as other periods do not make sense
		// in the context of our updated Traffic page and do not match the results as shown there.
		const dateRange = this.props.dateRange;
		if ( dateRange ) {
			query.start_date = dateRange.startDate.format( 'YYYY-MM-DD' );
			query.date = dateRange.endDate.format( 'YYYY-MM-DD' );
			query.summarize = 1;
			query.period = 'day'; // Override for custom date ranges.
		}

		const moduleQuery = merge( {}, statsQueryOptions, query );
		// TODO: Refactor the query params for posts module.
		if ( 'posts' === this.props.context.params.module ) {
			moduleQuery.skip_archives = isArchiveBreakdownEnabled ? '1' : '0';
		}

		const urlParams = new URLSearchParams( this.props.context.querystring );
		const listItemClassName = 'stats__summary--narrow-mobile';

		switch ( this.props.context.params.module ) {
			case 'referrers':
				title = translate( 'Referrers' );
				path = 'referrers';
				statType = 'statsReferrers';
				summaryView = (
					<Fragment key="referrers-summary">
						{ this.renderSummaryHeader( path, statType, false, moduleQuery ) }
						<StatsModuleReferrers
							moduleStrings={ statsStrings.referrers }
							period={ this.props.period }
							query={ moduleQuery }
							summary
							listItemClassName={ listItemClassName }
						/>
					</Fragment>
				);
				break;

			case 'clicks':
				title = translate( 'Clicks' );
				path = 'clicks';
				statType = 'statsClicks';
				summaryView = (
					<Fragment key="clicks-summary">
						{ this.renderSummaryHeader( path, statType, false, moduleQuery ) }
						<StatsModuleClicks
							moduleStrings={ statsStrings.clicks }
							period={ this.props.period }
							query={ moduleQuery }
							summary
							listItemClassName={ listItemClassName }
						/>
					</Fragment>
				);
				break;

			case 'countryviews':
				title = translate( 'Countries' );
				path = 'countryviews';
				statType = 'statsCountryViews';
				summaryView = (
					<Fragment key="countries-summary">
						{ this.renderSummaryHeader( path, statType, false, moduleQuery ) }
						{ isEnabled( 'stats/locations' ) ? (
							<StatsModuleLocations
								moduleStrings={ statsStrings.countries }
								period={ this.props.period }
								query={ moduleQuery }
								summary
								listItemClassName={ listItemClassName }
								context={ this.props.context }
							/>
						) : (
							<StatsModuleCountries
								moduleStrings={ statsStrings.countries }
								period={ this.props.period }
								query={ moduleQuery }
								summary
								listItemClassName={ listItemClassName }
							/>
						) }
					</Fragment>
				);
				break;

			case 'locations':
				title = translate( 'Locations' );
				path = 'locations';
				statType = 'statsCountryViews';
				summaryView = (
					<Fragment key="countries-summary">
						{ this.renderSummaryHeader( path, statType, false, moduleQuery ) }
						<StatsModuleLocations
							moduleStrings={ statsStrings.countries }
							period={ this.props.period }
							query={ moduleQuery }
							summary
							listItemClassName={ listItemClassName }
							initialGeoMode={ urlParams.get( 'geoMode' ) }
							context={ this.props.context }
						/>
					</Fragment>
				);
				break;

			case 'posts':
				title = statsStrings.posts.title;
				path = 'posts';
				statType = getValidQueryViewType( moduleQuery?.viewType, supportsArchiveStats );
				summaryView = (
					<Fragment key="posts-summary">
						{ this.renderSummaryHeader( path, statType, false, moduleQuery ) }
						<StatsModuleTopPosts
							moduleStrings={ statsStrings.posts }
							period={ this.props.period }
							query={ moduleQuery }
							summary
							listItemClassName={ listItemClassName }
						/>
					</Fragment>
				);
				break;

			case 'authors':
				title = translate( 'Authors' );
				path = 'authors';
				statType = 'statsTopAuthors';
				// TODO: should be refactored so that className doesn't have to be passed in
				/* eslint-disable wpcalypso/jsx-classname-namespace */
				summaryView = (
					<Fragment key="authors-summary">
						{ this.renderSummaryHeader( path, statType, false, moduleQuery ) }
						<StatsModuleAuthors
							moduleStrings={ statsStrings.authors }
							period={ this.props.period }
							query={ moduleQuery }
							className="stats__author-views"
							summary
							listItemClassName={ listItemClassName }
						/>
					</Fragment>
				);
				/* eslint-enable wpcalypso/jsx-classname-namespace */
				break;

			case 'videoplays':
				title = translate( 'Videos' );
				path = 'videoplays';
				statType = 'statsVideoPlays';
				moduleQuery.complete_stats = 1;
				summaryView = (
					<Fragment key="videopress-stats-module">
						{ /* For CSV button to work, video page needs to pass custom data to the button.
								It can't use the shared header as long as the CSV download button stays there. */ }
						<VideoPressStatsModule
							path={ path }
							moduleStrings={ statsStrings.videoplays }
							period={ this.props.period }
							query={ query }
							statType={ statType }
							summary
							listItemClassName={ listItemClassName }
						/>
					</Fragment>
				);
				break;

			case 'filedownloads':
				title = translate( 'File Downloads' );
				path = 'filedownloads';
				statType = 'statsFileDownloads';
				summaryView = (
					<Fragment key="filedownloads-summary">
						{ this.renderSummaryHeader( path, statType, false, moduleQuery ) }
						<StatsModuleDownloads
							moduleStrings={ statsStrings.filedownloads }
							period={ this.props.period }
							query={ moduleQuery }
							summary
							listItemClassName={ listItemClassName }
						/>
					</Fragment>
				);
				break;

			case 'videodetails':
				title = translate( 'Video' );
				if ( this.props.media ) {
					title = this.props.media.title;
				}

				// TODO: a separate StatsSectionTitle component should be created
				/* eslint-disable wpcalypso/jsx-classname-namespace */
				chartTitle = (
					<h3 key="summary-title" className="stats-section-title">
						{ translate( 'Video Details' ) }
					</h3>
				);
				/* eslint-enable wpcalypso/jsx-classname-namespace */

				if ( siteId ) {
					summaryViews.push(
						<QueryMedia key="query-media" siteId={ siteId } mediaId={ this.props.postId } />
					);
				}
				summaryViews.push( chartTitle );
				barChart = (
					<StatsVideoSummary
						key="video-chart"
						postId={ this.props.postId }
						period={ this.props.period.period }
						statType={ urlParams.get( 'statType' ) }
					/>
				);

				summaryViews.push( barChart );
				summaryView = (
					<VideoPlayDetails
						key="page-embeds"
						postId={ this.props.postId }
						period={ this.props.period.period }
						statType={ urlParams.get( 'statType' ) }
					/>
				);
				break;

			case 'searchterms':
				title = translate( 'Search Terms' );
				path = 'searchterms';
				statType = 'statsSearchTerms';
				summaryView = (
					<Fragment key="search-terms-summary">
						{ this.renderSummaryHeader( path, statType, false, moduleQuery ) }
						<StatsModuleSearch
							moduleStrings={ statsStrings.search }
							period={ this.props.period }
							query={ moduleQuery }
							summary
							listItemClassName={ listItemClassName }
						/>
					</Fragment>
				);
				break;
			case 'annualstats':
				title = translate( 'Annual insights' );
				summaryView = <AnnualSiteStats key="annualstats" />;
				break;
			case 'utm': {
				title = translate( 'UTM insights' );
				path = 'utm';
				statType = 'statsUTM';
				summaryView = <></>; // done inline to use context values
				break;
			}
			case 'devices': {
				// TODO: finish after the Traffic page.
				title = translate( 'Devices' );
				path = 'devices';
				statType = 'statsDevices';

				summaryView = <></>;
				break;
			}
		}

		summaryViews.push( summaryView );

		const { module } = this.props.context.params;

		return (
			<Main fullWidthLayout>
				<PageViewTracker
					path={ `/stats/${ period }/${ module }/:site` }
					title={ `Stats > ${ titlecase( period ) } > ${ titlecase( module ) }` }
				/>
				<div className="stats stats-summary-view">
					<PageHeader
						className="stats__section-header modernized-header"
						titleProps={ { title, titleLogo: null } }
						backLinkProps={ {
							url: lastScreen.url,
							text: lastScreen.text,
						} }
						rightSection={
							<div className="stats-module__header-nav-button">
								{ shouldGateStatsCsvDownload ? (
									<DownloadCsvUpsell siteId={ siteId } borderless />
								) : (
									<DownloadCsv
										statType={ statType }
										query={ moduleQuery }
										path={ this.getPath( statType, path ) }
										period={ this.props.period }
										skipQuery
										hideIfNoData
									/>
								) }
							</div>
						}
					/>

					{ this.props.context.params.module === 'locations' && (
						<div className="stats-navigation stats-navigation--improved">
							<LocationsNavTabs
								period={ this.props.period }
								query={ moduleQuery }
								givenSiteId={ siteId }
							/>
						</div>
					) }

					{ /* TODO: Refactor to use the same component for both locations and posts */ }
					{ isArchiveBreakdownEnabled && this.props.context.params.module === 'posts' && (
						<div className="stats-navigation stats-navigation--improved">
							<PostsNavTabs query={ moduleQuery } />
						</div>
					) }

					<div id="my-stats-content" className="stats-summary-view stats-summary__positioned">
						{ this.props.context.params.module === 'utm' ? (
							<StatsGlobalValuesContext.Consumer>
								{ ( isInternal ) => (
									<>
										{ supportsUTMStats || isInternal ? (
											<>
												{ this.renderSummaryHeader( path, statType, false, moduleQuery ) }
												<StatsModuleUTM
													siteId={ siteId }
													period={ this.props.period }
													query={ moduleQuery }
													summary
													context={ this.props.context }
												/>
											</>
										) : (
											<div>{ translate( 'This path is not available.' ) }</div>
										) }
									</>
								) }
							</StatsGlobalValuesContext.Consumer>
						) : (
							summaryViews
						) }
						<JetpackColophon />
					</div>
				</div>
			</Main>
		);
	}
}

const StatsSummaryWrapper = ( props ) => {
	const lastScreen = useStatsNavigationHistory();
	const statsStrings = useStatsStrings( { supportsArchiveStats: props.supportsArchiveStats } );

	return <StatsSummary { ...props } lastScreen={ lastScreen } statsStrings={ statsStrings } />;
};

export default connect( ( state, { context, postId } ) => {
	const siteId = getSelectedSiteId( state );

	const { supportsUTMStats, supportsArchiveStats } = getEnvStatsFeatureSupportChecks(
		state,
		siteId
	);

	return {
		siteId: getSelectedSiteId( state ),
		siteSlug: getSelectedSiteSlug( state, siteId ),
		media: context.params.module === 'videodetails' ? getMediaItem( state, siteId, postId ) : false,
		supportsUTMStats,
		supportsArchiveStats,
		shouldGateStatsCsvDownload: shouldGateStats( state, siteId, STATS_FEATURE_DOWNLOAD_CSV ),
	};
} )( localize( StatsSummaryWrapper ) );
