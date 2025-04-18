import { Button } from '@automattic/components';
import { localizeUrl } from '@automattic/i18n-utils';
import { withShoppingCart } from '@automattic/shopping-cart';
import { MAP_EXISTING_DOMAIN, INCOMING_DOMAIN_TRANSFER } from '@automattic/urls';
import { localize } from 'i18n-calypso';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import DomainProductPrice from 'calypso/components/domains/domain-product-price';
import DomainRegistrationSuggestion from 'calypso/components/domains/domain-registration-suggestion';
import FormTextInput from 'calypso/components/forms/form-text-input';
import Notice from 'calypso/components/notice';
import { getDomainPriceRule } from 'calypso/lib/cart-values/cart-items';
import { getFixedDomainSearch, getTld, checkDomainAvailability } from 'calypso/lib/domains';
import { domainAvailability } from 'calypso/lib/domains/constants';
import { getAvailabilityNotice } from 'calypso/lib/domains/registration/availability-messages';
import withCartKey from 'calypso/my-sites/checkout/with-cart-key';
import { NON_PRIMARY_DOMAINS_TO_FREE_USERS } from 'calypso/state/current-user/constants';
import { getCurrentUser, currentUserHasFlag } from 'calypso/state/current-user/selectors';
import {
	recordAddDomainButtonClickInMapDomain,
	recordFormSubmitInMapDomain,
	recordInputFocusInMapDomain,
	recordGoButtonClickInMapDomain,
} from 'calypso/state/domains/actions';
import { getSelectedSite } from 'calypso/state/ui/selectors';

import './style.scss';

const noop = () => {};

class MapDomainStep extends Component {
	static propTypes = {
		products: PropTypes.object,
		cart: PropTypes.object,
		selectedSite: PropTypes.oneOfType( [ PropTypes.object, PropTypes.bool ] ),
		isBusyMapping: PropTypes.bool,
		initialQuery: PropTypes.string,
		analyticsSection: PropTypes.string.isRequired,
		domainsWithPlansOnly: PropTypes.bool.isRequired,
		primaryWithPlansOnly: PropTypes.bool.isRequired,
		onRegisterDomain: PropTypes.func.isRequired,
		onMapDomain: PropTypes.func.isRequired,
		onSave: PropTypes.func,
	};

	static defaultProps = {
		isBusyMapping: false,
		onSave: noop,
		initialQuery: '',
	};

	state = {
		...this.props.initialState,
		searchQuery: this.props.initialQuery,
		isPendingSubmit: false,
	};

	componentWillUnmount() {
		this.props.onSave( this.state );
	}

	notice() {
		if ( this.state.notice ) {
			return (
				<Notice
					text={ this.state.notice }
					status={ `is-${ this.state.noticeSeverity }` }
					showDismiss={ false }
				/>
			);
		}
	}

	render() {
		const suggestion = get( this.props, 'products.domain_map', false )
			? {
					cost: this.props.products.domain_map.cost_display,
					product_slug: this.props.products.domain_map.product_slug,
			  }
			: { cost: null, product_slug: '' };
		const { searchQuery } = this.state;
		const { translate } = this.props;

		return (
			<div className="map-domain-step">
				{ this.notice() }
				<form className="map-domain-step__form card" onSubmit={ this.handleFormSubmit }>
					<div className="map-domain-step__domain-heading">
						{ translate( 'Map this domain to use it as your site address.', {
							context: 'Upgrades: Description in domain registration',
							comment: 'Explains how you could use a new domain name for your site address.',
						} ) }
					</div>

					<DomainProductPrice
						rule={ getDomainPriceRule(
							this.props.domainsWithPlansOnly || this.props.primaryWithPlansOnly,
							this.props.selectedSite,
							this.props.cart,
							suggestion,
							false, // isDomainOnly
							'', // flowName
							false // domainAndPlanUpsellFlow
						) }
						price={ suggestion.cost }
						isMappingProduct
					/>

					<div className="map-domain-step__add-domain" role="group">
						<FormTextInput
							className="map-domain-step__external-domain"
							value={ this.state.searchQuery }
							placeholder={ translate( 'example.com' ) }
							onBlur={ this.save }
							onChange={ this.setSearchQuery }
							onClick={ this.recordInputFocus }
							autoFocus // eslint-disable-line jsx-a11y/no-autofocus
						/>
						<Button
							busy={ this.state.isPendingSubmit || this.props.isBusyMapping }
							disabled={ ! getTld( searchQuery ) || this.state.isPendingSubmit }
							className="map-domain-step__go button is-primary"
							onClick={ this.handleAddButtonClick }
						>
							{ translate( 'Add', {
								context: 'Upgrades: Label for mapping an existing domain',
							} ) }
						</Button>
					</div>

					{ this.domainRegistrationUpsell() }

					<div className="map-domain-step__domain-text">
						{ translate(
							"We'll add your domain and help you change its settings so it points to your site. Keep your domain renewed with your current provider. (They'll remind you when it's time.) {{a}}Learn more about mapping a domain{{/a}}.",
							{
								components: {
									a: (
										<a
											href={ localizeUrl( MAP_EXISTING_DOMAIN ) }
											rel="noopener noreferrer"
											target="_blank"
										/>
									),
								},
							}
						) }
					</div>
					<div className="map-domain-step__domain-text">
						{ translate(
							"You can transfer your domain's registration to WordPress.com and renew your domain and site from the same place. {{a}}Learn more about domain transfers{{/a}}.",
							{
								components: {
									a: (
										<a
											href={ localizeUrl( INCOMING_DOMAIN_TRANSFER ) }
											rel="noopener noreferrer"
											target="_blank"
										/>
									),
								},
							}
						) }
					</div>
				</form>
			</div>
		);
	}

	domainRegistrationUpsell() {
		const { suggestion } = this.state;
		if ( ! suggestion ) {
			return;
		}

		return (
			<div className="map-domain-step__domain-availability">
				<DomainRegistrationSuggestion
					suggestion={ suggestion }
					selectedSite={ this.props.selectedSite }
					domainsWithPlansOnly={ this.props.domainsWithPlansOnly }
					key={ suggestion.domain_name }
					cart={ this.props.cart }
					isCartPendingUpdate={ this.props.shoppingCartManager.isPendingUpdate }
					onButtonClick={ this.registerSuggestedDomain }
				/>
			</div>
		);
	}

	registerSuggestedDomain = () => {
		this.props.recordAddDomainButtonClickInMapDomain(
			this.state.suggestion.domain_name,
			this.props.analyticsSection,
			this.props.flowName
		);

		return this.props.onRegisterDomain( this.state.suggestion );
	};

	recordInputFocus = () => {
		this.props.recordInputFocusInMapDomain( this.state.searchQuery );
	};

	recordGoButtonClick = () => {
		this.props.recordGoButtonClickInMapDomain(
			this.state.searchQuery,
			this.props.analyticsSection
		);
	};

	setSearchQuery = ( event ) => {
		this.setState( { searchQuery: event.target.value } );
	};

	handleAddButtonClick = ( event ) => {
		this.recordGoButtonClick();
		this.handleFormSubmit( event );
	};

	handleFormSubmit = ( event ) => {
		event.preventDefault();

		const domain = getFixedDomainSearch( this.state.searchQuery );
		this.props.recordFormSubmitInMapDomain( this.state.searchQuery );
		this.setState( { suggestion: null, notice: null, isPendingSubmit: true } );

		checkDomainAvailability(
			{ domainName: domain, blogId: get( this.props, 'selectedSite.ID', null ) },
			( error, result ) => {
				const mappableStatus = get( result, 'mappable', error );
				const status = get( result, 'status', error );
				const { AVAILABLE, AVAILABILITY_CHECK_ERROR, MAPPABLE, MAPPED, NOT_REGISTRABLE, UNKNOWN } =
					domainAvailability;

				if ( status === AVAILABLE ) {
					this.setState( { suggestion: result, isPendingSubmit: false } );
					return;
				}

				if (
					! [ AVAILABILITY_CHECK_ERROR, NOT_REGISTRABLE ].includes( status ) &&
					[ MAPPABLE, UNKNOWN ].includes( mappableStatus )
				) {
					this.props.onMapDomain( domain );
					this.setState( { isPendingSubmit: false } );
					return;
				}

				let site = get( result, 'other_site_domain', null );
				if ( ! site ) {
					site = get( this.props, 'selectedSite.slug', null );
				}

				const availabilityStatus = MAPPED === mappableStatus ? mappableStatus : status;

				const maintenanceEndTime = get( result, 'maintenance_end_time', null );
				const { message, severity } = getAvailabilityNotice( domain, availabilityStatus, {
					site,
					maintenanceEndTime,
				} );
				this.setState( { notice: message, noticeSeverity: severity, isPendingSubmit: false } );
			}
		);
	};
}

export default connect(
	( state ) => ( {
		currentUser: getCurrentUser( state ),
		selectedSite: getSelectedSite( state ),
		primaryWithPlansOnly: getCurrentUser( state )
			? currentUserHasFlag( state, NON_PRIMARY_DOMAINS_TO_FREE_USERS )
			: false,
	} ),
	{
		recordAddDomainButtonClickInMapDomain,
		recordFormSubmitInMapDomain,
		recordInputFocusInMapDomain,
		recordGoButtonClickInMapDomain,
	}
)( withCartKey( withShoppingCart( localize( MapDomainStep ) ) ) );
