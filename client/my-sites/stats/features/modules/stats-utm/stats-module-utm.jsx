import page from '@automattic/calypso-router';
import { StatsCard } from '@automattic/components';
import { trendingUp } from '@wordpress/icons';
import clsx from 'clsx';
import { useTranslate } from 'i18n-calypso';
import { useState, useEffect, useMemo } from 'react';
import InlineSupportLink from 'calypso/components/inline-support-link';
import StatsInfoArea from 'calypso/my-sites/stats/features/modules/shared/stats-info-area';
import { useSelector, useDispatch } from 'calypso/state';
import { getSiteSlug, isJetpackSite } from 'calypso/state/sites/selectors';
import { receiveSiteStats } from 'calypso/state/stats/lists/actions';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import EmptyModuleCard from '../../../components/empty-module-card/empty-module-card';
import useUTMMetricsQuery from '../../../hooks/use-utm-metrics-query';
import ErrorPanel from '../../../stats-error';
import StatsListCard from '../../../stats-list/stats-list-card';
import UTMBuilder from '../../../stats-module-utm-builder';
import { StatsEmptyActionUTMBuilder } from '../shared';
import StatsCardSkeleton from '../shared/stats-card-skeleton';
import UTMDropdown from './stats-module-utm-dropdown';
import '../../../stats-module/style.scss';
import '../../../stats-list/style.scss';

const OPTION_KEYS = {
	SOURCE_MEDIUM: 'utm_source,utm_medium',
	CAMPAIGN_SOURCE_MEDIUM: 'utm_campaign,utm_source,utm_medium',
	SOURCE: 'utm_source',
	MEDIUM: 'utm_medium',
	CAMPAIGN: 'utm_campaign',
};

const UTM_QUERY_PARAM = 'utmParam';

const StatsModuleUTM = ( {
	path,
	className,
	useShortLabel,
	moduleStrings,
	summary,
	period,
	metricLabel,
	hideSummaryLink,
	isLoading,
	query,
	postId,
	summaryUrl,
	context,
} ) => {
	const siteId = useSelector( getSelectedSiteId );
	const siteSlug = useSelector( ( state ) => getSiteSlug( state, siteId ) );
	const translate = useTranslate();
	const dispatch = useDispatch();
	const [ selectedOption, setSelectedOption ] = useState( () => {
		const utmQueryParam = context.query[ UTM_QUERY_PARAM ];
		return Object.values( OPTION_KEYS ).includes( utmQueryParam )
			? utmQueryParam
			: OPTION_KEYS.SOURCE_MEDIUM;
	} );
	const queryParams = useMemo( () => {
		let urlParams;

		if ( summaryUrl ) {
			urlParams = new URLSearchParams( summaryUrl?.split( '?' )[ 1 ] || '' );
		} else {
			urlParams = new URLSearchParams( context.query );
		}

		return urlParams;
	}, [ summaryUrl, context.query ] );

	const basePath = useMemo(
		() => `/stats/${ period.period }/${ path }/${ siteSlug }`,
		[ period.period, path, siteSlug ]
	);

	useEffect( () => {
		if ( ! summary ) {
			return;
		}

		const utmParam = context.query[ UTM_QUERY_PARAM ];
		const isValidUtmParam = utmParam && Object.values( OPTION_KEYS ).includes( utmParam );

		if ( ! isValidUtmParam ) {
			return;
		}

		// If URL has valid param and it's different from state, update state
		if ( utmParam !== selectedOption ) {
			const updatedQuery = { ...context.query, [ UTM_QUERY_PARAM ]: selectedOption };
			const queryString = new URLSearchParams( updatedQuery ).toString();
			page( `${ basePath }?${ queryString }` );
		}
	}, [ context.query, selectedOption, basePath, summary ] );

	const optionLabels = {
		[ OPTION_KEYS.SOURCE_MEDIUM ]: {
			selectLabel: translate( 'Source / Medium' ),
			headerLabel: translate( 'Posts by Source / Medium' ),
			isGrouped: true, // display in a group on top of the dropdown
		},
		[ OPTION_KEYS.CAMPAIGN_SOURCE_MEDIUM ]: {
			selectLabel: translate( 'Campaign / Source / Medium' ),
			headerLabel: translate( 'Posts by Campaign / Source / Medium' ),
			isGrouped: true,
		},
		[ OPTION_KEYS.SOURCE ]: {
			selectLabel: translate( 'Source' ),
			headerLabel: translate( 'Posts by Source' ),
		},
		[ OPTION_KEYS.MEDIUM ]: {
			selectLabel: translate( 'Medium' ),
			headerLabel: translate( 'Posts by Medium' ),
		},
		[ OPTION_KEYS.CAMPAIGN ]: {
			selectLabel: translate( 'Campaign' ),
			headerLabel: translate( 'Posts by Campaign' ),
		},
	};

	// Fetch UTM metrics with switched UTM parameters.
	const { isFetching: isFetchingUTM, metrics: data } = useUTMMetricsQuery(
		siteId,
		selectedOption,
		query,
		postId
	);

	// Use ref to track previous data and avoid unnecessary dispatches when data is the same.
	useEffect( () => {
		if ( data ) {
			dispatch( receiveSiteStats( siteId, 'statsUTM', query, data, Date.now() ) );
		}
	}, [ data, query, siteId, dispatch ] );

	// Show error and loading based on the query
	const hasError = false;
	const displaySummaryLink = data && ! hideSummaryLink;
	const showLoader = isLoading || isFetchingUTM;

	const getHref = useMemo( () => {
		return () => {
			const clonedParams = new URLSearchParams( queryParams );
			clonedParams.set( UTM_QUERY_PARAM, selectedOption );

			// Some modules do not have view all abilities
			if ( ! summary && period && path && siteSlug ) {
				if ( ! clonedParams.has( 'startDate' ) ) {
					clonedParams.set( 'startDate', period.startOf.format( 'YYYY-MM-DD' ) );
				}
				if ( ! clonedParams.has( 'endDate' ) ) {
					clonedParams.set( 'endDate', period.endOf.format( 'YYYY-MM-DD' ) );
				}

				return `${ basePath }?${ clonedParams.toString() }`;
			}
		};
	}, [ path, siteSlug, queryParams, selectedOption, period, basePath, summary ] );

	const isSiteJetpackNotAtomic = useSelector( ( state ) =>
		isJetpackSite( state, siteId, { treatAtomicAsJetpackSite: false } )
	);

	const supportContext = isSiteJetpackNotAtomic ? 'stats-utm-jetpack' : 'stats-utm';

	const titleNodes = (
		<StatsInfoArea>
			{ translate(
				'Track your campaign {{link}}UTM performance data{{/link}}. Generate URL codes with our builder.',
				{
					comment: '{{link}} links to support documentation.',
					components: {
						link: <InlineSupportLink supportContext={ supportContext } showIcon={ false } />,
					},
					context: 'Stats: Popover information when the UTM module has data',
				}
			) }
		</StatsInfoArea>
	);

	return (
		<>
			{ showLoader && (
				<StatsCardSkeleton
					isLoading={ isFetchingUTM }
					className={ className }
					title={ moduleStrings.title }
					type={ 3 }
				/>
			) }
			{ ! showLoader &&
				! data?.length && ( // no data and new empty state enabled
					<StatsCard
						className={ className }
						title={ moduleStrings.title }
						titleNodes={ <StatsInfoArea /> }
						isEmpty
						emptyMessage={
							<EmptyModuleCard
								icon={ trendingUp }
								description={ translate(
									'Your {{link}}campaign UTM performance data{{/link}} will display here once readers click on your URLs with UTM codes. Get started!',
									{
										comment: '{{link}} links to support documentation.',
										components: {
											link: (
												<InlineSupportLink supportContext={ supportContext } showIcon={ false } />
											),
										},
										context: 'Stats: Info box label when the UTM module is empty',
									}
								) }
								cards={ <UTMBuilder trigger={ <StatsEmptyActionUTMBuilder /> } /> }
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
			{ ! showLoader &&
				!! data?.length && ( // show when new empty state is disabled or data is available
					<StatsListCard
						className={ clsx( className, 'stats-module__card', path ) }
						moduleType={ path }
						data={ data }
						useShortLabel={ useShortLabel }
						title={ moduleStrings?.title }
						titleNodes={ titleNodes }
						emptyMessage={ <div>{ moduleStrings.empty }</div> }
						metricLabel={ metricLabel }
						showMore={
							displaySummaryLink && ! summary
								? {
										url: getHref(),
										label:
											data.length >= 10
												? translate( 'View all', {
														context: 'Stats: Button link to show more detailed stats information',
												  } )
												: translate( 'View details', {
														context: 'Stats: Button label to see the detailed content of a panel',
												  } ),
								  }
								: undefined
						}
						error={ hasError && <ErrorPanel /> }
						splitHeader
						mainItemLabel={ optionLabels[ selectedOption ]?.headerLabel }
						toggleControl={
							<div className="stats-module__extended-toggle">
								<UTMBuilder />
								<UTMDropdown
									buttonLabel={ optionLabels[ selectedOption ].selectLabel }
									onSelect={ setSelectedOption }
									selectOptions={ optionLabels }
									selected={ selectedOption }
								/>
							</div>
						}
					/>
				) }
		</>
	);
};

export { StatsModuleUTM as default, OPTION_KEYS };
