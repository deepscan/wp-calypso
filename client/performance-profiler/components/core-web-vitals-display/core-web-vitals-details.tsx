import { useDesktopBreakpoint } from '@automattic/viewport-react';
import { Button } from '@wordpress/components';
import { useTranslate } from 'i18n-calypso';
import {
	Metrics,
	PerformanceMetricsHistory,
	PerformanceMetricsItemQueryResponse,
} from 'calypso/data/site-profiler/types';
import {
	metricsNames,
	metricsTresholds,
	mapThresholdsToStatus,
	metricValuations,
	filterRecommendations,
} from 'calypso/performance-profiler/utils/metrics';
import { updateQueryParams } from 'calypso/performance-profiler/utils/query-params';
import HistoryChart from '../charts/history-chart';
import { MetricScale } from '../metric-scale';
import { StatusIndicator } from '../status-indicator';

type CoreWebVitalsDetailsProps = Record< Metrics, number > & {
	history: PerformanceMetricsHistory;
	activeTab: Metrics | null;
	audits: Record< string, PerformanceMetricsItemQueryResponse >;
	recommendationsRef: React.RefObject< HTMLDivElement > | null;
};

export const CoreWebVitalsDetails: React.FC< CoreWebVitalsDetailsProps > = ( {
	activeTab,
	history,
	audits,
	recommendationsRef,
	...metrics
} ) => {
	const translate = useTranslate();
	const isMobile = ! useDesktopBreakpoint();

	if ( ! activeTab ) {
		return null;
	}

	const { name: displayName } = metricsNames[ activeTab ];
	const value = metrics[ activeTab ];
	const valuation = mapThresholdsToStatus( activeTab, value );

	const { good, needsImprovement } = metricsTresholds[ activeTab ];

	const formatUnit = ( value: number | string ) => {
		const num = parseFloat( value as string );
		if ( [ 'lcp', 'fcp', 'ttfb' ].includes( activeTab ) ) {
			return +( num / 1000 ).toFixed( 2 );
		}
		return num;
	};

	const displayUnit = () => {
		if ( [ 'lcp', 'fcp', 'ttfb' ].includes( activeTab ) ) {
			return translate( 's', { comment: 'Used for displaying a time range in seconds, eg. 1-2s' } );
		}
		if ( [ 'inp', 'tbt' ].includes( activeTab ) ) {
			return translate( 'ms', {
				comment: 'Used for displaying a range in milliseconds, eg. 100-200ms',
			} );
		}
		return '';
	};

	// Add leading zero to date values. Safari expects the date string to follow the ISO 8601 format (i.e., YYYY-MM-DD)
	const addLeadingZero = ( value: number ) => {
		if ( value < 10 ) {
			return `0${ value }`;
		}
		return value;
	};

	let metricsData: number[] = history?.metrics[ activeTab ] ?? [];
	let dates = history?.collection_period ?? [];

	const weeksToShow = isMobile ? 6 : 8;
	metricsData = metricsData.slice( -weeksToShow );
	dates = dates.slice( -weeksToShow );

	// the comparison is inverse here because the last value is the most recent
	const positiveTendency = metricsData[ metricsData.length - 1 ] < metricsData[ 0 ];

	const dataAvailable = metricsData.length > 0 && metricsData.some( ( item ) => item !== null );
	const historicalData = metricsData.map( ( item, index ) => {
		let formattedDate: unknown;
		const date = dates[ index ];
		if ( 'string' === typeof date ) {
			formattedDate = date;
		} else {
			const { year, month, day } = date;
			formattedDate = `${ year }-${ addLeadingZero( month ) }-${ addLeadingZero( day ) }`;
		}

		return {
			date: formattedDate,
			value: formatUnit( item ),
		};
	} );

	const numberOfAuditsForMetric = Object.keys( audits ).filter( ( key ) =>
		filterRecommendations( activeTab, audits[ key ] )
	).length;

	return (
		<div className="core-web-vitals-display__details">
			<div className="core-web-vitals-display__description">
				<span className="core-web-vitals-display__description-subheading">
					{ metricValuations[ activeTab ][ valuation ] }
				</span>
				<MetricScale metricName={ activeTab } value={ value } valuation={ valuation } />
				<div className="core-web-vitals-display__ranges">
					<div className="range">
						<StatusIndicator speed="good" />
						<div className="range-description">
							<div className="range-heading">{ translate( 'Excellent' ) }</div>
							<div className="range-subheading">
								{ translate( '0-%(to)s%(unit)s', {
									args: { to: formatUnit( good ), unit: displayUnit() },
									comment: 'Displaying a time range, eg. 0-1s',
								} ) }
							</div>
						</div>
					</div>
					<div className="range">
						<StatusIndicator speed="needsImprovement" />
						<div className="range-description">
							<div className="range-heading">{ translate( 'Needs Improvement' ) }</div>
							<div className="range-subheading">
								{ translate( '%(from)s-%(to)s%(unit)s', {
									args: {
										from: formatUnit( good ),
										to: formatUnit( needsImprovement ),
										unit: displayUnit(),
									},
									comment: 'Displaying a time range, eg. 2-3s',
								} ) }
							</div>
						</div>
					</div>
					<div className="range">
						<StatusIndicator speed="bad" />
						<div className="range-description">
							<div className="range-heading">{ translate( 'Poor' ) }</div>
							<div className="range-subheading">
								{ translate( '>%(from)s%(unit)s', {
									args: {
										from: formatUnit( needsImprovement ),
										unit: displayUnit(),
									},
									comment: 'Displaying a time range, eg. >2s',
								} ) }
							</div>
						</div>
					</div>
				</div>
				<span className="core-web-vitals-display__description-subheading">
					{ metricValuations[ activeTab ].heading }&nbsp;
				</span>
				<span className="core-web-vitals-display__description-aka">
					{ metricValuations[ activeTab ].aka }
				</span>
				<p>
					{ metricValuations[ activeTab ].explanation }
					&nbsp;
					<a href={ `https://web.dev/articles/${ activeTab }` }>{ translate( 'Learn more ↗' ) }</a>
				</p>

				{ !! numberOfAuditsForMetric && (
					<div className="core-web-vitals-display__recommendations">
						<div>
							<div className="core-web-vitals-display__recommendations-title">
								{ translate( 'How to improve %s?', { args: [ displayName ] } ) }
							</div>
							<div className="core-web-vitals-display__recommendations-subtitle">
								{ translate(
									"We have found %(numberOfAudits)d ways to improve your site's %(metricName)s.",
									{
										args: { numberOfAudits: numberOfAuditsForMetric, metricName: displayName },
									}
								) }
							</div>
						</div>
						<div>
							<Button
								variant="secondary"
								onClick={ () => {
									updateQueryParams( { filter: activeTab }, true );
									recommendationsRef?.current?.scrollIntoView( {
										behavior: 'smooth',
										block: 'start',
									} );
								} }
								className="recommendations-anchor"
							>
								{ translate( 'View recommendations' ) }
							</Button>
						</div>
					</div>
				) }
			</div>
			<div className="core-web-vitals-display__history-graph">
				{ dataAvailable && (
					<span className="core-web-vitals-display__description-subheading">
						{ positiveTendency
							? translate( '%(displayName)s has improved over the past %(weeksToShow)d weeks', {
									args: { displayName, weeksToShow },
							  } )
							: translate( '%(displayName)s has declined over the past %(weeksToShow)d weeks', {
									args: { displayName, weeksToShow },
							  } ) }
					</span>
				) }
				<HistoryChart
					data={ dataAvailable && historicalData }
					range={ [
						formatUnit( metricsTresholds[ activeTab ].good ),
						formatUnit( metricsTresholds[ activeTab ].needsImprovement ),
					] }
					height={ 300 }
					d3Format="%b %d"
					isMobile={ isMobile }
				/>
			</div>
		</div>
	);
};
