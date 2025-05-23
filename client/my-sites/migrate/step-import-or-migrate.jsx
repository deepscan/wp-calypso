import {
	FEATURE_UPLOAD_THEMES_PLUGINS,
	PLAN_BUSINESS,
	getPlan,
	planHasFeature,
} from '@automattic/calypso-products';
import { Button, CompactCard } from '@automattic/components';
import { Button as WpButton } from '@wordpress/components';
import { localize } from 'i18n-calypso';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import CardHeading from 'calypso/components/card-heading';
import HeaderCake from 'calypso/components/header-cake';
import ImportTypeChoice from 'calypso/my-sites/migrate/components/import-type-choice';
import SitesBlock from 'calypso/my-sites/migrate/components/sites-block';
import { getImportSectionLocation, redirectTo } from 'calypso/my-sites/migrate/helpers';
import { recordTracksEvent } from 'calypso/state/analytics/actions';

import './section-migrate.scss';

class StepImportOrMigrate extends Component {
	static propTypes = {
		onJetpackSelect: PropTypes.func.isRequired,
		targetSite: PropTypes.object.isRequired,
		targetSiteSlug: PropTypes.string.isRequired,
	};

	state = {
		chosenImportType: null,
	};

	chooseImportType = ( type ) => {
		this.setState( { chosenImportType: type } );
	};

	onJetpackSelect = ( event ) => {
		const { isTargetSiteAtomic } = this.props;

		this.props.recordTracksEvent( 'calypso_importer_wordpress_select', {
			is_atomic: isTargetSiteAtomic,
			migration_type: 'migration',
		} );

		this.props.onJetpackSelect( event );
	};

	handleImportRedirect = () => {
		const { isTargetSiteAtomic, targetSiteSlug } = this.props;

		this.props.recordTracksEvent( 'calypso_importer_wordpress_select', {
			is_atomic: isTargetSiteAtomic,
			migration_type: 'content',
		} );

		const destinationURL = getImportSectionLocation( targetSiteSlug, isTargetSiteAtomic );

		if ( isTargetSiteAtomic ) {
			window.location.href = destinationURL;
		} else {
			redirectTo( destinationURL );
		}
	};

	isTargetSitePlanCompatible = () => {
		const { targetSite } = this.props;
		const planSlug = get( targetSite, 'plan.product_slug' );

		return planSlug && planHasFeature( planSlug, FEATURE_UPLOAD_THEMES_PLUGINS );
	};

	installJetpack = () => {
		this.props.recordTracksEvent( 'calypso_site_importer_install_jetpack' );
		const { sourceSiteInfo } = this.props;
		const sourceSiteDomain = get( sourceSiteInfo, 'site_url', '' );
		const source = 'import';
		window.open( `/jetpack/connect/?url=${ sourceSiteDomain }&source=${ source }`, '_blank' );
	};

	getJetpackOrUpgradeMessage = () => {
		const { sourceHasJetpack, isTargetSiteAtomic, translate } = this.props;

		if ( ! sourceHasJetpack ) {
			return (
				<p>
					{ translate(
						'You need to have Jetpack installed on your site to' +
							' be able to import everything.' +
							' {{jetpackInstallLink}}Install' +
							' Jetpack{{/jetpackInstallLink}}.',
						{
							components: {
								jetpackInstallLink: <WpButton isLink onClick={ this.installJetpack } />,
							},
						}
					) }
				</p>
			);
		}

		if ( ! isTargetSiteAtomic ) {
			return (
				<p>
					{ translate( 'Import your entire site with the %(planName)s plan.', {
						args: { planName: getPlan( PLAN_BUSINESS )?.getTitle() ?? '' },
					} ) }
				</p>
			);
		}
	};

	componentDidMount() {
		this.props.recordTracksEvent( 'calypso_importer_wordpress_type_viewed' );
	}

	render() {
		const { targetSite, targetSiteSlug, sourceHasJetpack, sourceSite, sourceSiteInfo, translate } =
			this.props;
		const backHref = `/migrate/${ targetSiteSlug }`;

		const everythingLabels = [];
		if ( ! this.isTargetSitePlanCompatible() ) {
			everythingLabels.push( translate( 'Upgrade' ) );
		}

		return (
			<>
				<HeaderCake backHref={ backHref }>{ translate( 'Import from WordPress' ) }</HeaderCake>

				<SitesBlock
					sourceSite={ sourceSite }
					sourceSiteInfo={ sourceSiteInfo }
					targetSite={ targetSite }
				/>

				<CompactCard>
					<CardHeading>{ translate( 'What do you want to import?' ) }</CardHeading>

					{ this.getJetpackOrUpgradeMessage() }
					{ /* TODO: is the following code in use / up to date? */ }
					<ImportTypeChoice
						onChange={ this.chooseImportType }
						radioOptions={ {
							everything: {
								title: translate( 'Everything' ),
								labels: everythingLabels,
								description: translate(
									"All your site's content, themes, plugins, users and settings."
								),
								enabled: sourceHasJetpack,
							},
							'content-only': {
								key: 'content-only',
								title: translate( 'Content only' ),
								description: translate( 'Import posts, pages, comments, and media.' ),
								enabled: true,
							},
						} }
					/>
					<div className="migrate__buttons-wrapper">
						{ this.state.chosenImportType === 'everything' ? (
							<Button primary onClick={ this.onJetpackSelect }>
								{ translate( 'Continue' ) }
							</Button>
						) : null }
						{ this.state.chosenImportType === 'content-only' ? (
							<Button primary onClick={ this.handleImportRedirect }>
								{ translate( 'Continue' ) }
							</Button>
						) : null }

						<Button className="migrate__cancel" href={ backHref }>
							{ translate( 'Cancel' ) }
						</Button>
					</div>
				</CompactCard>
			</>
		);
	}
}

export default connect( null, { recordTracksEvent } )( localize( StepImportOrMigrate ) );
