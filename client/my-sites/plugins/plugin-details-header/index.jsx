import { Badge, Button } from '@automattic/components';
import { formatNumberCompact } from '@automattic/number-formatters';
import { useTranslate } from 'i18n-calypso';
import { useSelector } from 'react-redux';
import { useLocalizedMoment } from 'calypso/components/localized-moment';
import {
	useMarketplaceReviewsQuery,
	useMarketplaceReviewsStatsQuery,
} from 'calypso/data/marketplace/use-marketplace-reviews';
import { gaRecordEvent } from 'calypso/lib/analytics/ga';
import { preventWidows } from 'calypso/lib/formatting';
import PluginIcon from 'calypso/my-sites/plugins/plugin-icon/plugin-icon';
import { useLocalizedPlugins, formatPluginRating } from 'calypso/my-sites/plugins/utils';
import { getSelectedSite } from 'calypso/state/ui/selectors';
import usePluginVersionInfo from '../plugin-management-v2/hooks/use-plugin-version-info';

import './style.scss';

const PluginDetailsHeader = ( {
	plugin,
	isPlaceholder,
	isJetpackCloud,
	onReviewsClick = () => {},
	isMarketplaceProduct,
} ) => {
	const moment = useLocalizedMoment();
	const translate = useTranslate();
	const { localizePath } = useLocalizedPlugins();

	const selectedSite = useSelector( getSelectedSite );

	const { currentVersionsRange } = usePluginVersionInfo( plugin, selectedSite?.ID );

	const { data: reviewsStats } = useMarketplaceReviewsStatsQuery( {
		productType: 'plugin',
		slug: plugin.slug,
	} );

	const { data: marketplaceReviews } = useMarketplaceReviewsQuery( {
		productType: 'plugin',
		slug: plugin.slug,
	} );

	// Rating can be a valid number, 0 or null, discard undefined for easier comparison
	let rating = plugin.rating ?? null;
	if ( isMarketplaceProduct ) {
		rating = reviewsStats?.ratings_average ? ( reviewsStats.ratings_average * 100 ) / 5 : 0;
	}

	if ( isPlaceholder ) {
		return <PluginDetailsHeaderPlaceholder />;
	}

	const getMarketPlacePluginReviewsLink = () => {
		const numberOfReviews = marketplaceReviews?.length || 0;

		return (
			<Button
				borderless
				className="plugin-details-header__number-reviews-link is-link"
				onClick={ onReviewsClick }
			>
				{ numberOfReviews > 0 &&
					translate( '%(numberOfReviews)d review', '%(numberOfReviews)d reviews', {
						count: numberOfReviews,
						args: {
							numberOfReviews,
						},
					} ) }
				{ numberOfReviews === 0 && translate( 'Add a review' ) }
			</Button>
		);
	};

	const getPluginReviewsLink = () => {
		if ( plugin.num_ratings > 0 ) {
			return null;
		}

		const onClickPluginRatingsLink = () => {
			gaRecordEvent( 'Plugins', 'Clicked Add a review link', 'Plugin Name', plugin.slug );
		};

		return (
			<a
				href={ `https://wordpress.org/support/plugin/${ plugin.slug }/reviews` }
				onClick={ onClickPluginRatingsLink }
				target="_blank"
				rel="noopener noreferrer"
			>
				{ translate( 'Add a review' ) }
			</a>
		);
	};

	return (
		<div className="plugin-details-header__container">
			<div className="plugin-details-header__main-info">
				<PluginIcon className="plugin-details-header__icon" image={ plugin.icon } />
				<div className="plugin-details-header__title-container">
					<h1 className="plugin-details-header__name">{ plugin.name }</h1>
					<div className="plugin-details-header__subtitle">
						<span className="plugin-details-header__author">
							{ isJetpackCloud
								? plugin.author_name
								: translate( 'By {{author/}}', {
										components: {
											author: (
												<a
													href={ localizePath(
														`/plugins/${ selectedSite?.slug || '' }?s=developer:"${ getPluginAuthor(
															plugin
														) }"`
													) }
												>
													{ plugin.author_name }
												</a>
											),
										},
								  } ) }
						</span>

						<span className="plugin-details-header__subtitle-separator">·</span>
					</div>
				</div>
			</div>
			<div className="plugin-details-header__description">
				{ preventWidows( plugin.short_description || plugin.description ) }
			</div>
			{ ! isJetpackCloud && <Tags plugin={ plugin } /> }
			<div className="plugin-details-header__additional-info">
				{ /* We want to accept rating 0, which means no rating for Marketplace products */ }
				{ rating !== null && (
					<div className="plugin-details-header__info">
						<div className="plugin-details-header__info-title">{ translate( 'Rating' ) }</div>
						<div className="plugin-details-header__info-value">
							{ rating !== 0 && <div>{ `${ formatPluginRating( rating, true ) }/5` }</div> }
							{ isMarketplaceProduct ? getMarketPlacePluginReviewsLink() : getPluginReviewsLink() }
						</div>
					</div>
				) }
				<div className="plugin-details-header__info">
					<div className="plugin-details-header__info-title">{ translate( 'Version' ) }</div>
					<div className="plugin-details-header__info-value">
						{ /* Show the default version if plugin is not installed */ }
						{ currentVersionsRange?.min || plugin.version }
						{ currentVersionsRange?.max && ` - ${ currentVersionsRange.max }` }
					</div>
				</div>
				{ Boolean( plugin.active_installs ) && (
					<div className="plugin-details-header__info">
						<div className="plugin-details-header__info-title">
							{ translate( 'Active installations' ) }
						</div>
						<div className="plugin-details-header__info-value">
							{ formatNumberCompact( plugin.active_installs ) }
						</div>
					</div>
				) }
				<div className="plugin-details-header__info">
					<div className="plugin-details-header__info-title">{ translate( 'Last updated' ) }</div>
					<div className="plugin-details-header__info-value">
						{ moment.utc( plugin.last_updated, 'YYYY-MM-DD hh:mma' ).format( 'MMM D, YYYY' ) }
					</div>
				</div>
			</div>
		</div>
	);
};

const LIMIT_OF_TAGS = 3;
function Tags( { plugin } ) {
	const selectedSite = useSelector( getSelectedSite );
	const { localizePath } = useLocalizedPlugins();

	if ( ! plugin?.tags ) {
		return null;
	}

	const tagKeys = Object.keys( plugin.tags || {} ).slice( 0, LIMIT_OF_TAGS );

	return (
		<div className="plugin-details-header__tag-badge-container">
			{ tagKeys.map( ( tagKey ) => (
				<a
					key={ `badge-${ tagKey.replace( ' ', '' ) }` }
					className="plugin-details-header__tag-badge"
					href={ localizePath( `/plugins/browse/${ tagKey }/${ selectedSite?.slug || '' }` ) }
				>
					<Badge type="info">{ plugin.tags[ tagKey ] }</Badge>
				</a>
			) ) }
		</div>
	);
}

function PluginDetailsHeaderPlaceholder() {
	return (
		<div className="plugin-details-header__wrapper is-placeholder">
			<div className="plugin-details-header__tags">...</div>
			<div className="plugin-details-header__container">
				<h1 className="plugin-details-header__name">...</h1>
				<div className="plugin-details-header__description">...</div>
				<div className="plugin-details-header__additional-info">...</div>
			</div>
		</div>
	);
}

function getPluginAuthor( plugin ) {
	return plugin.author_name;
}

export default PluginDetailsHeader;
