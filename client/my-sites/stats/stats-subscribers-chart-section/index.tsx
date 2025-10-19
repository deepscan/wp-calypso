import config from '@automattic/calypso-config';
import { Icon, people, currencyDollar } from '@wordpress/icons';
import { useTranslate } from 'i18n-calypso';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Intervals from 'calypso/blocks/stats-navigation/intervals';
import AsyncLoad from 'calypso/components/async-load';
import UplotChart from 'calypso/components/chart-uplot';
import useSubscribersQuery from 'calypso/my-sites/stats/hooks/use-subscribers-query';
import { formatDate } from 'calypso/my-sites/stats/stats-chart-tabs/utility';
import { useSelector } from 'calypso/state';
import isAtomicSite from 'calypso/state/selectors/is-site-wpcom-atomic';
import { isJetpackSite } from 'calypso/state/sites/selectors';
import useCssVariable from '../hooks/use-css-variable';
import StatsModulePlaceholder from '../stats-module/placeholder';
import StatsPeriodHeader from '../stats-period-header';
import { parseLocalDate } from '../utils';
import { hideFractionNumber } from './chart-utils';
import SubscribersNavigationArrows from './subscribers-navigation-arrows';
import type uPlot from 'uplot';

import './style.scss';
interface SubscribersData {
	period: PeriodType;
	subscribers: number;
	subscribers_change: number;
	subscribers_paid: number;
}

interface SubscribersDataResult {
	data: SubscribersData[];
	unit: string;
	date: string;
}

interface QuantityDefaultType {
	day: number;
	week: number;
	month: number;
	year: number;
}

export type PeriodType = 'day' | 'week' | 'month' | 'year';

// New Subscriber Stats
function transformUplotData(
	data: SubscribersData[],
	hasAddedPaidSubscriptionProduct: boolean
): uPlot.AlignedData {
	// Transform the data into the format required by uPlot.
	//
	// Note that the incoming data is ordered ascending (newest to oldest)
	// but uPlot expects descending in its deafult configuration.
	const x: number[] = data.map( ( point ) => Number( new Date( point.period ) ) / 1000 ).reverse();
	// Reserve null values for points with no data.
	const y1: Array< number | null > = data
		.map( ( point ) => ( point.subscribers === null ? null : Number( point.subscribers ) ) )
		.reverse();

	// Add a second line for paid subscribers to the chart when users have added a paid subscription product.
	if ( hasAddedPaidSubscriptionProduct ) {
		const y2: Array< number | null > = data
			.map( ( point ) =>
				point.subscribers_paid === null ? null : Number( point.subscribers_paid )
			)
			.reverse();

		return [ x, y1, y2 ];
	}

	return [ x, y1 ];
}

type ChartDataPoint = {
	date: Date;
	value: number;
	label?: string | null;
};

const formatDateLabel = ( date: Date, period: PeriodType ): string => {
	switch ( period ) {
		case 'week':
		case 'day':
			return date.toLocaleDateString( undefined, {
				month: 'short',
				day: 'numeric',
			} );
		case 'month':
			return date.toLocaleDateString( undefined, {
				month: 'short',
				year: 'numeric',
			} );
		case 'year':
			return date.getFullYear().toString();
		default:
			return date.toLocaleDateString( undefined, {
				month: 'short',
				day: 'numeric',
			} );
	}
};

const transformLineChartData = (
	data: SubscribersData[],
	hasAddedPaidSubscriptionProduct: boolean,
	period: PeriodType
): ChartDataPoint[][] => {
	const subscribersData: ChartDataPoint[] = [];
	const paidSubscribersData: ChartDataPoint[] = [];
	data?.map( ( point ) => {
		const dateObj = parseLocalDate( point.period );
		if ( isNaN( dateObj.getTime() ) ) {
			return null;
		}

		subscribersData.push( {
			date: dateObj,
			value: point.subscribers ?? 0,
			label: formatDate( point.period, period ),
		} );

		if ( hasAddedPaidSubscriptionProduct ) {
			paidSubscribersData.push( {
				date: dateObj,
				value: point.subscribers_paid ?? 0,
			} );
		}
	} );
	return [ subscribersData, paidSubscribersData ];
};

export default function SubscribersChartSection( {
	siteId,
	slug,
	period = 'month',
}: {
	siteId: number | null;
	slug?: string | null;
	period?: PeriodType;
} ) {
	const containerRef = useRef< HTMLDivElement >( null );
	const isOdysseyStats = config.isEnabled( 'is_running_in_jetpack_site' );
	const isAtomic = useSelector( ( state ) => isAtomicSite( state, siteId ) );
	const isJetpack = useSelector( ( state ) => isJetpackSite( state, siteId ) );
	const isChartLibraryEnabled = config.isEnabled( 'stats/chart-library' );
	const quantityDefault: QuantityDefaultType = {
		day: 30,
		week: 12,
		month: 6,
		year: 3,
	};
	const quantity = quantityDefault[ period as keyof QuantityDefaultType ];
	const [ queryDate, setQueryDate ] = useState( new Date() );
	const [ errorMessage, setErrorMessage ] = useState( '' );
	const legendRef = useRef< HTMLDivElement >( null );
	const translate = useTranslate();

	const formatTimeTick = useCallback(
		( timestamp: number ) => {
			const date = new Date( timestamp );

			return formatDateLabel( date, period );
		},
		[ period ]
	);

	const {
		isLoading,
		isError,
		data: dataRaw,
		// error,
		status,
	} = useSubscribersQuery( siteId, period, quantity, queryDate );
	const data = dataRaw as SubscribersDataResult | undefined;

	const handleDateChange = useCallback(
		( newDate: Date ) => setQueryDate( new Date( newDate.getTime() ) ), // unless new Date is created, the component won't rerender
		[ setQueryDate ]
	);

	// reset the date when changing periods
	useEffect( () => {
		setQueryDate( new Date() );
	}, [ period, setQueryDate ] );

	useEffect( () => {
		if ( isError ) {
			setErrorMessage( 'There was an error!' ); //TODO: check if error has a `message` property and how to handle `error`'s type
		}
	}, [ status, isError ] );

	const subscriberLineStroke = useCssVariable( '--color-primary-light', containerRef.current );
	const products = useSelector( ( state ) => state.memberships?.productList?.items[ siteId ?? 0 ] );

	// Products with an undefined value rather than an empty array means the API call has not been completed yet.
	const isPaidSubscriptionProductsLoading = ! products;
	const isChartLoading = isLoading || isPaidSubscriptionProductsLoading;

	const hasAddedPaidSubscriptionProduct = products && products.length > 0;

	// Prepare data for both chart libraries
	const uplotData = useMemo(
		() => transformUplotData( data?.data || [], hasAddedPaidSubscriptionProduct ),
		[ data?.data, hasAddedPaidSubscriptionProduct ]
	);
	const [ subscribersData, paidSubscribersData ] = useMemo(
		() => transformLineChartData( data?.data || [], hasAddedPaidSubscriptionProduct, period ),
		[ data?.data, hasAddedPaidSubscriptionProduct, period ]
	);

	const lineChartData = [
		{
			label: translate( 'Subscribers' ),
			icon: <Icon className="gridicon" icon={ people } />,
			options: {
				stroke: subscriberLineStroke,
			},
			data: subscribersData,
		},
		{
			label: translate( 'Paid Subscribers' ),
			icon: <Icon className="gridicon" icon={ currencyDollar } />,
			options: {
				stroke: 'rgb(230, 139, 40)',
			},
			data: paidSubscribersData,
		},
	].filter( ( series ) => series.data.length > 0 );

	const subscribers = {
		label: 'Subscribers',
		path: '/stats/subscribers/',
	};

	const slugPath = slug ? `/${ slug }` : '';
	const pathTemplate = `${ subscribers.path }{{ interval }}${ slugPath }`;

	const subscribersUrl =
		isAtomic || isJetpack
			? `https://cloud.jetpack.com/subscribers/${ slug }`
			: `https://wordpress.com/subscribers/${ slug }`;

	return (
		<div ref={ containerRef } className="subscribers-section">
			{ /* TODO: Remove highlight-cards class and use a highlight cards heading component instead. */ }
			<div className="subscribers-section-heading highlight-cards">
				<h1 className="highlight-cards-heading">
					{ translate( 'Subscribers' ) }{ ' ' }
					<small>
						<a className="highlight-cards-heading-wrapper" href={ subscribersUrl }>
							{ translate( 'View all subscribers' ) }
						</a>
					</small>
				</h1>
				<div className="subscribers-section-heading__chart-controls">
					<SubscribersNavigationArrows
						date={ queryDate }
						period={ period }
						quantity={ quantity }
						onDateChange={ handleDateChange }
					/>
					<div className="subscribers-section-duration-control-with-legend">
						<StatsPeriodHeader>
							<Intervals selected={ period } pathTemplate={ pathTemplate } compact />
						</StatsPeriodHeader>
					</div>
				</div>
			</div>
			{ isChartLoading && <StatsModulePlaceholder className="is-chart" isLoading /> }
			{ ! isChartLoading && uplotData.length === 0 && (
				<p className="subscribers-section__no-data">
					{ translate( 'No data available for the specified period.' ) }
				</p>
			) }
			{ errorMessage && <div>Error: { errorMessage }</div> }
			{ ! isChartLoading && uplotData.length !== 0 && (
				<>
					<div className="subscribers-section-legend" ref={ legendRef }></div>
					{ isChartLibraryEnabled ? (
						<AsyncLoad
							require="calypso/my-sites/stats/components/line-chart"
							chartData={ lineChartData }
							height={ 300 }
							curveType="monotone" // can use smooth, linear, monotone
							EmptyState={ () => null }
							zeroBaseline={ lineChartData.length > 1 }
							formatTimeTick={ formatTimeTick }
							placeholder={ <StatsModulePlaceholder className="is-chart" isLoading /> }
						/>
					) : (
						<UplotChart
							data={ uplotData }
							legendContainer={ legendRef }
							period={ period }
							mainColor={ isOdysseyStats ? '#069e08' : undefined }
							fillColorFrom={ isOdysseyStats ? 'rgba(6, 158, 8, 0.4)' : undefined }
							fillColorTo={ isOdysseyStats ? 'rgba(6, 158, 8, 0)' : undefined }
							yAxisFilter={ hideFractionNumber }
						/>
					) }
				</>
			) }
		</div>
	);
}
