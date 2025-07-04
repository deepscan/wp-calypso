import config from '@automattic/calypso-config';
import { SimplifiedSegmentedControl, StatsCard } from '@automattic/components';
import { postList } from '@wordpress/icons';
import { useTranslate } from 'i18n-calypso';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import QuerySiteStats from 'calypso/components/data/query-site-stats';
import InlineSupportLink from 'calypso/components/inline-support-link';
import StatsInfoArea from 'calypso/my-sites/stats/features/modules/shared/stats-info-area';
import { trackStatsAnalyticsEvent } from 'calypso/my-sites/stats/utils';
import { isJetpackSite } from 'calypso/state/sites/selectors';
import getEnvStatsFeatureSupportChecks from 'calypso/state/sites/selectors/get-env-stats-feature-supports';
import {
	isRequestingSiteStatsForQuery,
	getSiteStatsNormalizedData,
} from 'calypso/state/stats/lists/selectors';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import EmptyModuleCard from '../../../components/empty-module-card/empty-module-card';
import { useShouldGateStats } from '../../../hooks/use-should-gate-stats';
import StatsModule from '../../../stats-module';
import { StatsEmptyActionAI, StatsEmptyActionSocial } from '../shared';
import StatsCardSkeleton from '../shared/stats-card-skeleton';
import useOptionLabels, {
	MAIN_STAT_TYPE,
	SUB_STAT_TYPE,
	StatType,
	StatsModulePostsProps,
	getValidQueryViewType,
} from './use-option-labels';
import type { StatsStateProps } from '../types';

type StatTypeOptionType = {
	value: StatType;
	label: string;
	mainItemLabel: string;
	analyticsId: string;
	disabled?: boolean;
};

const StatsTopPosts: React.FC< StatsModulePostsProps > = ( {
	period,
	query: queryFromProps,
	moduleStrings,
	className,
	summaryUrl,
	summary,
	listItemClassName,
	isRealTime = false,
} ) => {
	const translate = useTranslate();
	const siteId = useSelector( getSelectedSiteId ) as number;
	const { supportsArchiveStats } = useSelector( ( state: object ) =>
		getEnvStatsFeatureSupportChecks( state, siteId )
	);

	const isArchiveBreakdownEnabled: boolean =
		config.isEnabled( 'stats/archive-breakdown' ) && supportsArchiveStats;

	const isSiteJetpackNotAtomic = useSelector( ( state ) =>
		isJetpackSite( state, siteId, { treatAtomicAsJetpackSite: false } )
	);
	const supportContext = isSiteJetpackNotAtomic
		? 'stats-top-posts-and-pages-analyze-content-performance-jetpack'
		: 'stats-top-posts-and-pages-analyze-content-performance';

	const query = useMemo( () => {
		return {
			...queryFromProps,
			skip_archives: isArchiveBreakdownEnabled ? '1' : '0',
		};
	}, [ queryFromProps, isArchiveBreakdownEnabled ] );

	const mainStatType = MAIN_STAT_TYPE;
	const subStatType = SUB_STAT_TYPE;

	const [ localStatType, setLocalStatType ] = useState< StatType | null >( null );
	const onStatTypeChange = ( option: StatTypeOptionType ) => {
		trackStatsAnalyticsEvent( 'stats_posts_module_menu_clicked', {
			stat_type: option.analyticsId,
		} );

		setLocalStatType( option.value );
	};
	// Reset the localStatType when the query changes from page navigation.
	useEffect( () => {
		setLocalStatType( null );
	}, [ query ] );

	const isRequestingTopPostsData = useSelector( ( state: StatsStateProps ) =>
		isRequestingSiteStatsForQuery( state, siteId, mainStatType, query )
	);
	const postsAndPagesData = useSelector( ( state ) =>
		getSiteStatsNormalizedData( state, siteId, mainStatType, query )
	) as Array< { id: number; label: string } >;

	const isRequestingArchivesData = useSelector( ( state: StatsStateProps ) =>
		isRequestingSiteStatsForQuery( state, siteId, subStatType, query )
	);
	// Get the archives data to check if we should disable the archives option.
	const archivesData = useSelector( ( state ) =>
		getSiteStatsNormalizedData( state, siteId, subStatType, query )
	) as Array< { id: number; label: string } >;

	const isRequestingData = isArchiveBreakdownEnabled
		? isRequestingTopPostsData || isRequestingArchivesData
		: isRequestingTopPostsData;

	const optionLabels = useOptionLabels();
	const options: StatTypeOptionType[] = useMemo(
		() =>
			Object.entries( optionLabels ).map( ( [ key, item ] ) => {
				return {
					value: key as StatType,
					label: item.tabLabel,
					mainItemLabel: item.mainItemLabel,
					analyticsId: item.analyticsId,
					// TODO: This is a temporary solution to disable the archives option when the archives data is not available.
					disabled:
						isArchiveBreakdownEnabled &&
						( ( key === subStatType && ! isRequestingArchivesData && ! archivesData.length ) ||
							( key === mainStatType &&
								! isRequestingTopPostsData &&
								! postsAndPagesData.length ) ),
				};
			} ),
		[
			optionLabels,
			isArchiveBreakdownEnabled,
			subStatType,
			isRequestingArchivesData,
			archivesData.length,
			mainStatType,
			isRequestingTopPostsData,
			postsAndPagesData.length,
		]
	);

	const availableStatTypes = options.filter( ( option ) => ! option.disabled );
	const defaultStatType =
		availableStatTypes.length === 1 ? availableStatTypes[ 0 ].value : mainStatType;
	const statType =
		localStatType ||
		getValidQueryViewType( query.viewType || defaultStatType, supportsArchiveStats );

	const data = statType === subStatType ? archivesData : postsAndPagesData;

	// Use StatsModule to display paywall upsell.
	const shouldGateStatsModule = useShouldGateStats( mainStatType );

	const hasData = !! data?.length;
	// TODO: Is there a way to show the Skeleton loader for real-time data?
	// We don't want it to show every time a rquest is being run for real-time data so it's disabled for now.
	const presentLoadingUI = isRealTime
		? isRequestingData && ! hasData && false
		: isRequestingData && ! shouldGateStatsModule;
	const presentModuleUI = isRealTime
		? hasData && ! presentLoadingUI
		: ( ! isRequestingData && hasData ) || shouldGateStatsModule;
	const presentEmptyUI = isRealTime
		? ! hasData && ! presentLoadingUI
		: ! isRequestingData && ! hasData && ! shouldGateStatsModule;

	// Query both statTypes for the Traffic page module card to avoid loading when switching between controls.
	// Only query one statType at a time to avoid loading plenty of data for the summary mode.
	const shouldQueryMainStatType = ! summary || statType === mainStatType;
	const shouldQuerySubStatType = ! summary || statType === subStatType;

	return (
		<>
			{ ! shouldGateStatsModule && siteId && shouldQueryMainStatType && (
				<QuerySiteStats statType={ mainStatType } siteId={ siteId } query={ query } />
			) }

			{ ! shouldGateStatsModule &&
				siteId &&
				isArchiveBreakdownEnabled &&
				shouldQuerySubStatType && (
					<QuerySiteStats statType={ subStatType } siteId={ siteId } query={ query } />
				) }

			{ presentLoadingUI && (
				<StatsCardSkeleton
					isLoading={ isRequestingData }
					className={ className }
					title={ moduleStrings.title }
					type={ 1 }
				/>
			) }
			{ presentModuleUI && (
				// show data or an overlay
				<StatsModule
					path="posts"
					titleNodes={
						<StatsInfoArea>
							{ isArchiveBreakdownEnabled
								? translate(
										'Most viewed {{link}}posts, pages and archive{{/link}}. Learn about what content resonates the most.',
										{
											comment: '{{link}} links to support documentation.',
											components: {
												link: (
													<InlineSupportLink supportContext={ supportContext } showIcon={ false } />
												),
											},
											context:
												'Stats: Link in a popover for the Posts & Pages when the module has data',
										}
								  )
								: translate(
										'{{link}}Posts and pages{{/link}} sorted by most visited. Learn about what content resonates the most.',
										{
											comment: '{{link}} links to support documentation.',
											components: {
												link: (
													<InlineSupportLink supportContext={ supportContext } showIcon={ false } />
												),
											},
											context:
												'Stats: Link in a popover for the Posts & Pages when the module has data',
										}
								  ) }
						</StatsInfoArea>
					}
					moduleStrings={ moduleStrings }
					period={ period }
					query={ query }
					statType={ statType }
					showSummaryLink={ !! summary }
					summaryLinkModifier={ ( link: string ) => `${ link }&viewType=${ statType }` }
					className={ className }
					summary={ summary }
					listItemClassName={ listItemClassName }
					skipQuery
					isRealTime={ isRealTime }
					toggleControl={
						isArchiveBreakdownEnabled &&
						! summary && (
							<SimplifiedSegmentedControl
								options={ options }
								initialSelected={ statType }
								onSelect={ onStatTypeChange }
							/>
						)
					}
					mainItemLabel={
						isArchiveBreakdownEnabled &&
						options.find( ( option ) => option.value === statType )?.mainItemLabel
					}
				/>
			) }
			{ presentEmptyUI && (
				// show empty state
				<StatsCard
					className={ className }
					title={ moduleStrings.title }
					isEmpty
					emptyMessage={
						<EmptyModuleCard
							icon={ postList }
							description={ translate(
								'Your top {{link}}posts and pages{{/link}} will display here to learn what content resonates the most. Start creating and sharing!',
								{
									comment: '{{link}} links to support documentation.',
									components: {
										link: (
											<InlineSupportLink supportContext={ supportContext } showIcon={ false } />
										),
									},
									context: 'Stats: Info box label when the Posts & Pages module is empty',
								}
							) }
							cards={
								<>
									<StatsEmptyActionAI from="module_top_posts" />
									<StatsEmptyActionSocial from="module_top_posts" />
								</>
							}
						/>
					}
					footerAction={
						summaryUrl
							? {
									url: summaryUrl,
									label: translate( 'View more' ),
							  }
							: undefined
					}
				/>
			) }
		</>
	);
};

export default StatsTopPosts;
