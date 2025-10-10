import config from '@automattic/calypso-config';
import { withMobileBreakpoint } from '@automattic/viewport-react';
import clsx from 'clsx';
import { localize, translate } from 'i18n-calypso';
import { flowRight, memoize } from 'lodash';
import moment from 'moment';
import PropTypes from 'prop-types';
import { Component, useRef } from 'react';
import { connect } from 'react-redux';
import AsyncLoad from 'calypso/components/async-load';
import Chart from 'calypso/components/chart';
import { DEFAULT_HEARTBEAT } from 'calypso/components/data/query-site-stats/constants';
import memoizeLast from 'calypso/lib/memoize-last';
import { withPerformanceTrackerStop } from 'calypso/lib/performance-tracking';
import { recordGoogleEvent, recordTracksEvent } from 'calypso/state/analytics/actions';
import { getSiteOption } from 'calypso/state/sites/selectors';
import { requestChartCounts } from 'calypso/state/stats/chart-tabs/actions';
import { QUERY_FIELDS } from 'calypso/state/stats/chart-tabs/constants';
import { getCountRecords, getLoadingTabs } from 'calypso/state/stats/chart-tabs/selectors';
import { chartLabelformats } from 'calypso/state/stats/lists/utils';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import useCssVariable from '../hooks/use-css-variable';
import StatsEmptyState from '../stats-empty-state';
import StatsModulePlaceholder from '../stats-module/placeholder';
import StatTabs from '../stats-tabs';
import ChartHeader from './chart-header';
import { buildChartData, getQueryDate, transformChartDataToLineFormat } from './utility';

import './style.scss';

const ChartTabShape = PropTypes.shape( {
	attr: PropTypes.string,
	gridicon: PropTypes.string,
	label: PropTypes.string,
	legendOptions: PropTypes.arrayOf( PropTypes.string ),
} );

const CHART_TYPE_STORAGE_KEY = ( siteId ) => `jetpack_stats_chart_type_${ siteId }`;

const getChartType = memoize( ( siteId, isMobile = false ) => {
	if ( ! siteId ) {
		return 'bar';
	}

	const savedChartType = localStorage.getItem( CHART_TYPE_STORAGE_KEY( siteId ) );

	if ( [ 'bar', 'line' ].includes( savedChartType ) ) {
		return savedChartType;
	}

	return isMobile ? 'line' : 'bar';
} );

// Define chart type change event names
const CHART_TYPE_EVENTS = {
	jetpack_odyssey: {
		bar: 'jetpack_odyssey_stats_chart_type_bar_selected',
		line: 'jetpack_odyssey_stats_chart_type_line_selected',
	},
	calypso: {
		bar: 'calypso_stats_chart_type_bar_selected',
		line: 'calypso_stats_chart_type_line_selected',
	},
};

class StatModuleChartTabs extends Component {
	static propTypes = {
		slug: PropTypes.string,
		queryParams: PropTypes.object,
		activeLegend: PropTypes.arrayOf( PropTypes.string ),
		activeTab: ChartTabShape,
		availableLegend: PropTypes.arrayOf( PropTypes.string ),
		charts: PropTypes.arrayOf( ChartTabShape ),
		className: PropTypes.string,
		counts: PropTypes.arrayOf(
			PropTypes.shape( {
				comments: PropTypes.number,
				labelDay: PropTypes.string,
				likes: PropTypes.number,
				period: PropTypes.string,
				posts: PropTypes.number,
				visitors: PropTypes.number,
				views: PropTypes.number,
			} )
		),
		isActiveTabLoading: PropTypes.bool,
		onChangeLegend: PropTypes.func.isRequired,
		chartContainerRef: PropTypes.object,
		primaryColor: PropTypes.string,
		secondaryColor: PropTypes.string,
		siteId: PropTypes.number,
		recordTracksEvent: PropTypes.func.isRequired,
		isBreakpointActive: PropTypes.bool,
	};

	state = {
		chartType: getChartType( this.props.siteId, this.props.isBreakpointActive ),
	};

	intervalId = null;

	componentDidMount() {
		if ( this.props.query ) {
			this.startQueryInterval();
		}
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.query && prevProps.queryKey !== this.props.queryKey ) {
			this.startQueryInterval();
		}
	}

	onLegendClick = ( chartItem ) => {
		const activeLegend = this.props.activeLegend.slice();
		const chartIndex = activeLegend.indexOf( chartItem );
		let gaEventAction;
		if ( -1 === chartIndex ) {
			activeLegend.push( chartItem );
			gaEventAction = ' on';
		} else {
			activeLegend.splice( chartIndex );
			gaEventAction = ' off';
		}
		this.props.recordGoogleEvent(
			'Stats',
			`Toggled Nested Chart ${ chartItem } ${ gaEventAction }`
		);
		this.props.onChangeLegend( activeLegend );
	};

	startQueryInterval() {
		// NOTE: Unpredictable behavior will arise if DEFAULT_HEARTBEAT < request duration!
		Number.isFinite( this.intervalId ) && clearInterval( this.intervalId );
		this.makeQuery();
		this.intervalId = setInterval( this.makeQuery, DEFAULT_HEARTBEAT );
	}

	makeQuery = () => {
		this.props.requestChartCounts( this.props.query );
		this.props.queryComp && this.props.requestChartCounts( this.props.queryComp );
		this.props.queryDay && this.props.requestChartCounts( this.props.queryDay );
		this.props.queryDayComp && this.props.requestChartCounts( this.props.queryDayComp );
	};

	handleChartTypeChange = ( newType ) => {
		const { siteId } = this.props;
		const isOdysseyStats = config.isEnabled( 'is_running_in_jetpack_site' );
		const event_from = isOdysseyStats ? 'jetpack_odyssey' : 'calypso';

		this.setState( { chartType: newType } );
		if ( siteId ) {
			localStorage.setItem( CHART_TYPE_STORAGE_KEY( siteId ), newType );
			getChartType.cache.clear(); // Clear memoization cache when type changes
		}

		// Record the chart type change event
		this.props.recordTracksEvent( CHART_TYPE_EVENTS[ event_from ][ newType ] );
	};

	formatLineChartTimeTick = ( date ) => {
		// Align the format with the original chart data parser.
		const timeformat = chartLabelformats[ this.props.selectedPeriod ];

		// Use browser's timezone offset to display the correct datetime.
		return moment( date ).format( timeformat );
	};

	render() {
		const {
			siteId,
			slug,
			queryParams,
			selectedPeriod,
			isActiveTabLoading,
			className,
			countsComp,
			primaryColor,
			secondaryColor,
			chartContainerRef,
			gmtOffset,
		} = this.props;
		const { chartType } = this.state;

		const chartData = this.props.chartData.map( ( record ) => {
			record.className = record.className?.replaceAll( 'is-selected', '' );
			return record;
		} );

		const classes = [
			'is-chart-tabs',
			className,
			{
				'is-loading': isActiveTabLoading,
				'has-less-than-three-bars': this.props.chartData.length < 3,
			},
		];

		//Transform the data to the format required by the line chart.
		const lineChartData = transformChartDataToLineFormat(
			chartData,
			this.props.activeLegend,
			this.props.activeTab,
			primaryColor,
			secondaryColor,
			gmtOffset
		);

		const emptyState = (
			<StatsEmptyState
				headingText={ selectedPeriod === 'hour' ? translate( 'No hourly data available' ) : null }
				infoText={
					selectedPeriod === 'hour' ? translate( 'Try selecting a different time frame.' ) : null
				}
			/>
		);

		/* pass bars count as `key` to disable transitions between tabs with different column count */
		return (
			<div className={ clsx( ...classes ) } ref={ chartContainerRef }>
				<ChartHeader
					activeLegend={ this.props.activeLegend }
					activeTab={ this.props.activeTab }
					availableLegend={ this.props.availableLegend }
					onLegendClick={ this.onLegendClick }
					charts={ this.props.charts }
					siteId={ siteId }
					slug={ slug }
					period={ selectedPeriod }
					queryParams={ queryParams }
					chartType={ chartType }
					onChartTypeChange={ this.handleChartTypeChange }
				/>
				<StatsModulePlaceholder className="is-chart" isLoading={ isActiveTabLoading } />
				{ chartType === 'bar' || lineChartData.length === 0 ? (
					<Chart barClick={ this.props.barClick } data={ chartData } minBarWidth={ 20 }>
						{ emptyState }
					</Chart>
				) : (
					<AsyncLoad
						require="calypso/my-sites/stats/components/line-chart"
						className="stats-chart-tabs__line-chart"
						chartData={ lineChartData }
						curveType="monotone" // can use smooth, linear, monotone
						height={ 224 }
						moment={ moment }
						onClick={ this.props.barClick }
						formatTimeTick={ this.formatLineChartTimeTick }
						placeholder={
							<StatsModulePlaceholder className="is-chart" isLoading={ isActiveTabLoading } />
						}
						emptyState={ emptyState }
					/>
				) }
				<StatTabs
					data={ this.props.counts }
					previousData={ countsComp }
					tabCountsAlt={ this.props.tabCountsAlt }
					tabCountsAltComp={ this.props.tabCountsAltComp }
					tabs={ this.props.charts }
					switchTab={ this.props.switchTab }
					selectedTab={ this.props.chartTab }
					activeIndex={ this.props.queryDate }
					activeKey="period"
					aggregate
				/>
			</div>
		);
	}
}

const NO_SITE_STATE = {
	siteId: null,
	counts: [],
	chartData: [],
};

const memoizedQuery = memoizeLast(
	( chartTab, date, period, quantity, siteId, chartStart = '' ) => ( {
		chartTab,
		date,
		chartStart,
		period,
		quantity,
		siteId,
		statFields: QUERY_FIELDS,
	} )
);

const connectComponent = connect(
	(
		state,
		{ activeLegend, period: { period }, chartTab, queryDate, customQuantity, customRange }
	) => {
		const siteId = getSelectedSiteId( state );
		if ( ! siteId ) {
			return NO_SITE_STATE;
		}

		// Set up quantity for API call.
		const defaultQuantity = 'year' === period ? 10 : 30;
		const quantity = customQuantity ? customQuantity : defaultQuantity;
		const timezoneOffset = getSiteOption( state, siteId, 'gmt_offset' ) || 0;

		// If not provided we compute the value. (maintains previous behaviour)
		const date = customRange
			? customRange.chartEnd
			: getQueryDate( queryDate, timezoneOffset, period, quantity );
		const chartStart = customRange?.chartStart || '';

		const queryKey = `${ date }-${ period }-${ quantity }-${ siteId }`;
		const query = memoizedQuery( chartTab, date, period, quantity, siteId, chartStart );

		let countsComp = null;
		let queryComp = null;
		if ( customRange ) {
			const dateComp = moment( date )
				.subtract( customRange.daysInRange, 'day' )
				.format( 'YYYY-MM-DD' );
			const chartStartComp = moment( chartStart )
				.subtract( customRange.daysInRange, 'day' )
				.format( 'YYYY-MM-DD' );
			queryComp = memoizedQuery( chartTab, dateComp, period, quantity, siteId, chartStartComp );
			countsComp = getCountRecords(
				state,
				siteId,
				queryComp.date,
				queryComp.period,
				queryComp.quantity
			);
		}

		// Query single day stats for the display of visitors, likes, and comments, as we don't have hourly data for them at the moment.
		let queryDay = null;
		let tabCountsAlt = null;
		if ( period === 'hour' && date === chartStart ) {
			queryDay = {
				...query,
				period: 'day',
				quantity: 1,
				statFields: [ 'visitors', 'likes', 'comments' ],
			};
			tabCountsAlt = getCountRecords(
				state,
				siteId,
				queryDay.date,
				queryDay.period,
				queryDay.quantity
			);
		}

		// Query single day stats for the display of visitors, likes, and comments, as we don't have hourly data for them at the moment.
		let queryDayComp = null;
		let tabCountsAltComp = null;
		if ( period === 'hour' && date === chartStart ) {
			const previousDate = moment( date ).subtract( 1, 'day' ).format( 'YYYY-MM-DD' );
			queryDayComp = {
				...query,
				date: previousDate,
				period: 'day',
				quantity: 1,
				statFields: [ 'visitors', 'likes', 'comments' ],
			};
			tabCountsAltComp = getCountRecords(
				state,
				siteId,
				queryDayComp.date,
				queryDayComp.period,
				queryDayComp.quantity
			);
		}

		const counts = getCountRecords( state, siteId, query.date, query.period, query.quantity );
		const chartData = buildChartData(
			activeLegend,
			chartTab,
			counts,
			period,
			queryDate,
			customRange
		);
		const loadingTabs = getLoadingTabs( state, siteId, query.date, query.period, query.quantity );
		const isActiveTabLoading = loadingTabs.includes( chartTab ) || chartData.length < quantity;

		return {
			chartData,
			counts,
			countsComp,
			isActiveTabLoading,
			query,
			queryComp,
			queryKey,
			siteId,
			selectedPeriod: period,
			queryDay,
			tabCountsAlt: tabCountsAlt?.[ 0 ],
			queryDayComp,
			tabCountsAltComp: tabCountsAltComp?.[ 0 ],
			gmtOffset: timezoneOffset,
		};
	},
	{ recordGoogleEvent, recordTracksEvent, requestChartCounts }
);

// TODO: let's convert it to a function component and remove all the hassle.
const withCssColors = ( WrappedComponent ) => {
	const WithCssColorsComponent = ( props ) => {
		const chartContainerRef = useRef( null );

		const primaryColor = useCssVariable( '--color-primary-light', chartContainerRef.current );
		const secondaryColor = useCssVariable( '--color-primary-dark', chartContainerRef.current );

		return (
			<WrappedComponent
				{ ...props }
				primaryColor={ primaryColor }
				secondaryColor={ secondaryColor }
				chartContainerRef={ chartContainerRef }
			/>
		);
	};

	WithCssColorsComponent.displayName = `WithCssColors(${
		WrappedComponent.displayName || WrappedComponent.name || 'Component'
	})`;

	return WithCssColorsComponent;
};

export default flowRight(
	localize,
	connectComponent
)( withMobileBreakpoint( withPerformanceTrackerStop( withCssColors( StatModuleChartTabs ) ) ) );
