import config from '@automattic/calypso-config';
import { Card } from '@automattic/components';
import { formatNumber } from '@automattic/number-formatters';
import { localize } from 'i18n-calypso';
import { find, includes } from 'lodash';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import QuerySiteStats from 'calypso/components/data/query-site-stats';
import { withLocalizedMoment } from 'calypso/components/localized-moment';
import SectionHeader from 'calypso/components/section-header';
import PromoCards from 'calypso/my-sites/stats/promo-cards';
import ErrorPanel from 'calypso/my-sites/stats/stats-error';
import StatsModulePlaceholder from 'calypso/my-sites/stats/stats-module/placeholder';
import { getSiteSlug } from 'calypso/state/sites/selectors';
import { getSiteStatsNormalizedData } from 'calypso/state/stats/lists/selectors';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import './style.scss';

class AnnualSiteStats extends Component {
	static propTypes = {
		requesting: PropTypes.bool,
		years: PropTypes.array,
		translate: PropTypes.func,
		moment: PropTypes.func,
		isWidget: PropTypes.bool,
		siteId: PropTypes.number,
		siteSlug: PropTypes.string,
	};

	static defaultProps = {
		isWidget: false,
	};

	renderWidgetContent( data, strings ) {
		return (
			<div className="annual-site-stats__content">
				<div className="annual-site-stats__stat is-year">
					<div className="annual-site-stats__stat-title">{ strings.year }</div>
					<div className="annual-site-stats__stat-figure is-large">{ data.year }</div>
				</div>
				<div className="annual-site-stats__stat">
					<div className="annual-site-stats__stat-title">{ strings.total_posts }</div>
					<div className="annual-site-stats__stat-figure is-large">
						{ formatNumber( data.total_posts ) }
					</div>
				</div>
				<div className="annual-site-stats__stat">
					<div className="annual-site-stats__stat-title">{ strings.total_comments }</div>
					<div className="annual-site-stats__stat-figure">
						{ formatNumber( data.total_comments ) }
					</div>
				</div>
				<div className="annual-site-stats__stat">
					<div className="annual-site-stats__stat-title">{ strings.avg_comments }</div>
					<div className="annual-site-stats__stat-figure">
						{ formatNumber( data.avg_comments ) }
					</div>
				</div>
				<div className="annual-site-stats__stat">
					<div className="annual-site-stats__stat-title">{ strings.total_likes }</div>
					<div className="annual-site-stats__stat-figure">{ formatNumber( data.total_likes ) }</div>
				</div>
				<div className="annual-site-stats__stat">
					<div className="annual-site-stats__stat-title">{ strings.avg_likes }</div>
					<div className="annual-site-stats__stat-figure">{ formatNumber( data.avg_likes ) }</div>
				</div>
				<div className="annual-site-stats__stat">
					<div className="annual-site-stats__stat-title">{ strings.total_words }</div>
					<div className="annual-site-stats__stat-figure">{ formatNumber( data.total_words ) }</div>
				</div>
				<div className="annual-site-stats__stat">
					<div className="annual-site-stats__stat-title">{ strings.avg_words }</div>
					<div className="annual-site-stats__stat-figure">{ formatNumber( data.avg_words ) }</div>
				</div>
			</div>
		);
	}

	formatTableValue( key, value ) {
		const singleDecimal = [ 'avg_comments', 'avg_likes' ];

		if ( includes( singleDecimal, key ) ) {
			return formatNumber( value, { decimals: 1 } );
		}
		if ( 'year' === key ) {
			return value;
		}
		return formatNumber( value );
	}

	renderTable( data, strings ) {
		const keys = Object.keys( strings );
		/* eslint-disable wpcalypso/jsx-classname-namespace */
		return (
			<div className="module-content-table is-fixed-row-header">
				<div className="module-content-table-scroll">
					<table cellPadding="0" cellSpacing="0">
						<thead>
							<tr>
								{ keys.map( ( key ) => (
									<th scope="col" key={ key }>
										{ strings[ key ] }
									</th>
								) ) }
							</tr>
						</thead>
						<tbody>
							{ data.map( ( row, i ) => (
								<tr key={ i }>
									{ keys.map( ( key, j ) => {
										const Cell = j === 0 ? 'th' : 'td';
										return (
											<Cell scope={ j === 0 ? 'row' : null } key={ j }>
												{ this.formatTableValue( key, row[ key ] ) }
											</Cell>
										);
									} ) }
								</tr>
							) ) }
						</tbody>
					</table>
				</div>
			</div>
		);
		/* eslint-enable wpcalypso/jsx-classname-namespace */
	}

	getStrings() {
		const { translate } = this.props;
		return {
			year: translate( 'Year' ),
			total_posts: translate( 'Total posts' ),
			total_comments: translate( 'Total comments' ),
			avg_comments: translate( 'Avg comments per post' ),
			total_likes: translate( 'Total likes' ),
			avg_likes: translate( 'Avg likes per post' ),
			total_words: translate( 'Total words' ),
			avg_words: translate( 'Avg words per post' ),
		};
	}

	render() {
		const { isOdysseyStats, isWidget, moment, siteId, siteSlug, translate, years } = this.props;
		const strings = this.getStrings();
		const now = moment();
		const currentYear = now.format( 'YYYY' );
		let previousYear = null;
		if ( now.month() === 0 ) {
			previousYear = now.subtract( 1, 'months' ).format( 'YYYY' );
		}
		const currentYearData = years && find( years, ( y ) => y.year === currentYear );
		const previousYearData =
			previousYear && years && find( years, ( y ) => y.year === previousYear );
		const isLoading = ! years;
		const isError = ! isLoading && years.errors;
		const hasData = isWidget ? currentYearData || previousYearData : years;
		const noData = ! isLoading && ! isError && ! hasData;
		const noDataMsg = isWidget
			? translate( 'No annual stats recorded for this year' )
			: translate( 'No annual stats recorded' );
		const viewAllLink = `/stats/annualstats/${ siteSlug }`;
		/* eslint-disable wpcalypso/jsx-classname-namespace */
		return (
			<div>
				{ ! isWidget && siteId && <QuerySiteStats siteId={ siteId } statType="statsInsights" /> }
				{ isWidget && (
					<SectionHeader
						href={ viewAllLink }
						label={ translate( 'Annual insights', { args: [ currentYear ] } ) }
					/>
				) }
				{ ! isWidget && (
					<h1 className="highlight-cards-heading">{ translate( 'All-time annual insights' ) }</h1>
				) }
				<Card className="stats-module">
					<StatsModulePlaceholder isLoading={ isLoading } />
					{ isError && <ErrorPanel message={ translate( 'Oops! Something went wrong.' ) } /> }
					{ noData && <ErrorPanel message={ noDataMsg } /> }
					{ isWidget && currentYearData && this.renderWidgetContent( currentYearData, strings ) }
					{ isWidget && previousYearData && this.renderWidgetContent( previousYearData, strings ) }
					{ ! isWidget && years && this.renderTable( years, strings ) }
					{ isWidget && years && years.length !== 0 && (
						<div className="module-expand">
							<a href={ viewAllLink }>
								{ translate( 'View all', { context: 'Stats: Button label to expand a panel' } ) }
								<span className="right" />
							</a>
						</div>
					) }
				</Card>
				<PromoCards
					isOdysseyStats={ isOdysseyStats }
					pageSlug="annual-insights"
					slug={ siteSlug }
				/>
			</div>
		);
		/* eslint-enable wpcalypso/jsx-classname-namespace */
	}
}

export default connect( ( state ) => {
	const statType = 'statsInsights';
	const siteId = getSelectedSiteId( state );
	const insights = getSiteStatsNormalizedData( state, siteId, statType, {} );

	return {
		isOdysseyStats: config.isEnabled( 'is_running_in_jetpack_site' ),
		siteId,
		siteSlug: getSiteSlug( state, siteId ),
		years: insights.years,
	};
} )( localize( withLocalizedMoment( AnnualSiteStats ) ) );
