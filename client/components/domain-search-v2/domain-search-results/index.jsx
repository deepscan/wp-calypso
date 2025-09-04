import {
	DomainSuggestionsList,
	DomainSuggestion,
	DomainSearchSkipSuggestion,
	getRootDomain,
	isSubdomain,
} from '@automattic/domain-search';
import { __experimentalVStack as VStack } from '@wordpress/components';
import { localize } from 'i18n-calypso';
import { get, times } from 'lodash';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import { isDomainMappingFree, isNextDomainFree } from 'calypso/lib/cart-values/cart-items';
import { domainAvailability } from 'calypso/lib/domains/constants';
import { DESIGN_TYPE_STORE } from 'calypso/signup/constants';
import { getCurrentUserCurrencyCode } from 'calypso/state/currency-code/selectors';
import { getDesignType } from 'calypso/state/signup/steps/design-type/selectors';
import DomainRegistrationSuggestion from '../domain-registration-suggestion';
import DomainSkipSuggestion from '../domain-skip-suggestion';
import FeaturedDomainSuggestions from '../featured-domain-suggestions';

class DomainSearchResults extends Component {
	static propTypes = {
		isDomainOnly: PropTypes.bool,
		domainsWithPlansOnly: PropTypes.bool.isRequired,
		lastDomainIsTransferrable: PropTypes.bool,
		lastDomainStatus: PropTypes.string,
		lastDomainSearched: PropTypes.string,
		cart: PropTypes.object,
		isCartPendingUpdate: PropTypes.bool,
		isCartPendingUpdateDomain: PropTypes.object,
		premiumDomains: PropTypes.object,
		products: PropTypes.object,
		selectedSite: PropTypes.object,
		availableDomain: PropTypes.oneOfType( [ PropTypes.object, PropTypes.bool ] ),
		suggestions: PropTypes.array,
		isLoadingSuggestions: PropTypes.bool.isRequired,
		isLoadingSubdomainSuggestions: PropTypes.bool,
		placeholderQuantity: PropTypes.number.isRequired,
		buttonLabel: PropTypes.string,
		mappingSuggestionLabel: PropTypes.string,
		offerUnavailableOption: PropTypes.bool,
		showAlreadyOwnADomain: PropTypes.bool,
		onAddMapping: PropTypes.func,
		onAddTransfer: PropTypes.func,
		onClickMapping: PropTypes.func,
		onClickUseYourDomain: PropTypes.func,
		showSkipButton: PropTypes.bool,
		onSkip: PropTypes.func,
		isSignupStep: PropTypes.bool,
		showStrikedOutPrice: PropTypes.bool,
		railcarId: PropTypes.string,
		fetchAlgo: PropTypes.string,
		pendingCheckSuggestion: PropTypes.object,
		unavailableDomains: PropTypes.array,
		domainAndPlanUpsellFlow: PropTypes.bool,
		useProvidedProductsList: PropTypes.bool,
		wpcomSubdomainSelected: PropTypes.oneOfType( [ PropTypes.object, PropTypes.bool ] ),
		flowName: PropTypes.string,
	};

	renderDomainAvailability() {
		const {
			availableDomain,
			lastDomainIsTransferrable,
			lastDomainStatus,
			lastDomainSearched,
			lastDomainTld,
			selectedSite,
			isDomainOnly,
		} = this.props;
		const suggestions = this.props.suggestions || [];
		const {
			MAPPABLE,
			MAPPED,
			RECENT_REGISTRATION_LOCK_NOT_TRANSFERRABLE,
			SERVER_TRANSFER_PROHIBITED_NOT_TRANSFERRABLE,
			TLD_NOT_SUPPORTED,
			TLD_NOT_SUPPORTED_AND_DOMAIN_NOT_AVAILABLE,
			TLD_NOT_SUPPORTED_TEMPORARILY,
			TRANSFERRABLE,
			TRANSFERRABLE_PREMIUM,
			UNKNOWN,
		} = domainAvailability;

		const domain = get( availableDomain, 'domain_name', lastDomainSearched );

		if (
			domain &&
			suggestions.length !== 0 &&
			[
				TRANSFERRABLE,
				TRANSFERRABLE_PREMIUM,
				MAPPABLE,
				MAPPED,
				RECENT_REGISTRATION_LOCK_NOT_TRANSFERRABLE,
				SERVER_TRANSFER_PROHIBITED_NOT_TRANSFERRABLE,
				TLD_NOT_SUPPORTED,
				TLD_NOT_SUPPORTED_AND_DOMAIN_NOT_AVAILABLE,
				TLD_NOT_SUPPORTED_TEMPORARILY,
				UNKNOWN,
			].includes( lastDomainStatus ) &&
			get( this.props, 'products.domain_map', false )
		) {
			const unavailableDomainProps = {};

			// If the domain is available we shouldn't offer to let people purchase mappings for it.
			if (
				[ TLD_NOT_SUPPORTED, TLD_NOT_SUPPORTED_AND_DOMAIN_NOT_AVAILABLE ].includes(
					lastDomainStatus
				)
			) {
				if ( isDomainMappingFree( selectedSite ) || isNextDomainFree( this.props.cart ) ) {
					unavailableDomainProps.onTransferClick = this.handleAddMapping;
				} else {
					unavailableDomainProps.onTransferClick = this.handleAddMapping;
				}
			}

			// Domain Mapping not supported for Store NUX yet.
			if ( this.props.siteDesignType === DESIGN_TYPE_STORE ) {
				unavailableDomainProps.onTransferClick = null;
			}

			const domainArgument = ! isSubdomain( domain ) ? domain : getRootDomain( domain );

			if ( [ TLD_NOT_SUPPORTED, UNKNOWN ].includes( lastDomainStatus ) ) {
				unavailableDomainProps.tld = lastDomainTld;
				unavailableDomainProps.reason = 'tld-not-supported';
				unavailableDomainProps.onTransferClick = null;
				unavailableDomainProps.transferLink = null;
			} else {
				const [ domainName, ...tld ] = domain.split( '.' );

				unavailableDomainProps.domain = domainName;
				unavailableDomainProps.tld = tld.join( '.' );
				unavailableDomainProps.reason = 'already-registered';
				unavailableDomainProps.onTransferClick = this.props.onClickUseYourDomain;
				unavailableDomainProps.transferLink = null;
			}

			if (
				isSubdomain( domain ) &&
				! [ TLD_NOT_SUPPORTED, UNKNOWN ].includes( lastDomainStatus )
			) {
				const rootDomain = getRootDomain( domain );
				const [ domainName, ...tld ] = rootDomain.split( '.' );

				unavailableDomainProps.domain = domainName;
				unavailableDomainProps.tld = tld.join( '.' );
				unavailableDomainProps.reason = 'already-registered';
				unavailableDomainProps.onTransferClick = this.props.onClickUseYourDomain;
				unavailableDomainProps.transferLink = null;
			}

			if ( isDomainOnly && ! [ TLD_NOT_SUPPORTED, UNKNOWN ].includes( lastDomainStatus ) ) {
				const [ domainName, ...tld ] = domainArgument.split( '.' );

				unavailableDomainProps.domain = domainName;
				unavailableDomainProps.tld = tld.join( '.' );
				unavailableDomainProps.reason = 'already-registered';
				unavailableDomainProps.onTransferClick = null;
				unavailableDomainProps.transferLink = `/setup/domain-transfer?new=${
					domainArgument ?? ''
				}`;
			}

			if ( TLD_NOT_SUPPORTED_TEMPORARILY === lastDomainStatus ) {
				unavailableDomainProps.domain = undefined;
				unavailableDomainProps.tld = lastDomainTld;
				unavailableDomainProps.reason = 'tld-not-supported-temporarily';
				unavailableDomainProps.onTransferClick = null;
				unavailableDomainProps.transferLink = null;
			}

			if ( this.props.offerUnavailableOption || this.props.showAlreadyOwnADomain ) {
				if ( this.props.siteDesignType !== DESIGN_TYPE_STORE && lastDomainIsTransferrable ) {
					return <DomainSuggestion.Unavailable { ...unavailableDomainProps } />;
				} else if ( lastDomainStatus !== MAPPED ) {
					return <DomainSuggestion.Unavailable { ...unavailableDomainProps } />;
				}
			} else {
				return <DomainSuggestion.Unavailable { ...unavailableDomainProps } />;
			}
		}

		return null;
	}

	handleAddMapping = ( event ) => {
		event.preventDefault();
		if ( this.props.isSignupStep ) {
			this.props.onClickUseYourDomain( event );
		} else {
			this.props.onAddMapping( this.props.lastDomainSearched );
		}
	};

	renderPlaceholders() {
		return times( this.props.placeholderQuantity, function ( n ) {
			return <DomainSuggestion.Placeholder key={ `placeholder-${ n }` } />;
		} );
	}

	renderDomainSuggestions() {
		const { isDomainOnly, suggestions, showStrikedOutPrice, showSkipButton, selectedSite } =
			this.props;
		let featuredSuggestionElement;
		let suggestionElements;
		let domainSkipSuggestion;

		if ( ! this.props.isLoadingSuggestions && this.props.suggestions ) {
			const subdomainSuggestion = suggestions.find(
				( suggestion ) => suggestion.isSubDomainSuggestion
			);
			const regularSuggestions = suggestions.filter(
				( suggestion ) =>
					! suggestion.isRecommended &&
					! suggestion.isBestAlternative &&
					! suggestion.isSubDomainSuggestion
			);
			const featuredSuggestions = suggestions.filter(
				( suggestion ) => suggestion.isRecommended || suggestion.isBestAlternative
			);

			featuredSuggestionElement = featuredSuggestions.length > 0 && (
				<FeaturedDomainSuggestions
					cart={ this.props.cart }
					isCartPendingUpdate={ this.props.isCartPendingUpdate }
					domainsWithPlansOnly={ this.props.domainsWithPlansOnly }
					isDomainOnly={ isDomainOnly }
					fetchAlgo={ this.props.fetchAlgo }
					isSignupStep={ this.props.isSignupStep }
					showStrikedOutPrice={ showStrikedOutPrice }
					key="featured"
					premiumDomains={ this.props.premiumDomains }
					featuredSuggestions={ featuredSuggestions }
					query={ this.props.lastDomainSearched }
					railcarId={ this.props.railcarId }
					selectedSite={ this.props.selectedSite }
					pendingCheckSuggestion={ this.props.pendingCheckSuggestion }
					unavailableDomains={ this.props.unavailableDomains }
					hideMatchReasons={ this.props.hideMatchReasons }
					domainAndPlanUpsellFlow={ this.props.domainAndPlanUpsellFlow }
					products={ this.props.useProvidedProductsList ? this.props.products : undefined }
					isCartPendingUpdateDomain={ this.props.isCartPendingUpdateDomain }
					temporaryCart={ this.props.temporaryCart }
					domainRemovalQueue={ this.props.domainRemovalQueue }
					trademarkClaimsNoticeInfo={ this.props.trademarkClaimsNoticeInfo }
					onAcceptTrademarkClaim={ this.props.onAcceptTrademarkClaim }
					onRejectTrademarkClaim={ this.props.onRejectTrademarkClaim }
				/>
			);

			suggestionElements = regularSuggestions.map( ( suggestion, i ) => {
				if ( suggestion.is_placeholder ) {
					return <DomainSuggestion.Placeholder key={ `placeholder-${ i }` } />;
				}

				return (
					<DomainRegistrationSuggestion
						isCartPendingUpdate={ this.props.isCartPendingUpdate }
						isDomainOnly={ isDomainOnly }
						suggestion={ suggestion }
						suggestionSelected={
							this.props.wpcomSubdomainSelected?.domain_name === suggestion?.domain_name
						}
						key={ suggestion.domain_name }
						cart={ this.props.cart }
						isSignupStep={ this.props.isSignupStep }
						showStrikedOutPrice={ this.props.showStrikedOutPrice }
						selectedSite={ this.props.selectedSite }
						domainsWithPlansOnly={ this.props.domainsWithPlansOnly }
						railcarId={ this.props.railcarId + '-' + ( i + 2 ) }
						uiPosition={ i + 2 }
						fetchAlgo={ suggestion.fetch_algo ? suggestion.fetch_algo : this.props.fetchAlgo }
						query={ this.props.lastDomainSearched }
						premiumDomain={ this.props.premiumDomains[ suggestion.domain_name ] }
						pendingCheckSuggestion={ this.props.pendingCheckSuggestion }
						unavailableDomains={ this.props.unavailableDomains }
						hideMatchReasons={ this.props.hideMatchReasons }
						domainAndPlanUpsellFlow={ this.props.domainAndPlanUpsellFlow }
						products={ this.props.useProvidedProductsList ? this.props.products : undefined }
						isCartPendingUpdateDomain={ this.props.isCartPendingUpdateDomain }
						temporaryCart={ this.props.temporaryCart }
						domainRemovalQueue={ this.props.domainRemovalQueue }
						trademarkClaimsNoticeInfo={ this.props.trademarkClaimsNoticeInfo }
						onAcceptTrademarkClaim={ this.props.onAcceptTrademarkClaim }
						onRejectTrademarkClaim={ this.props.onRejectTrademarkClaim }
					/>
				);
			} );

			domainSkipSuggestion = showSkipButton && (
				<DomainSkipSuggestion
					selectedSite={ selectedSite }
					isLoadingSubdomainSuggestions={ this.props.isLoadingSubdomainSuggestions }
					subdomainSuggestion={ subdomainSuggestion }
					flowName={ this.props.flowName }
					query={ this.props.lastDomainSearched }
					onSkip={ this.props.onSkip }
				/>
			);
		} else {
			featuredSuggestionElement = <FeaturedDomainSuggestions showPlaceholders />;
			domainSkipSuggestion = <DomainSearchSkipSuggestion.Placeholder />;
			suggestionElements = this.renderPlaceholders();
		}

		return (
			<>
				{ featuredSuggestionElement }
				{ domainSkipSuggestion }
				{ suggestionElements?.length > 0 && (
					<DomainSuggestionsList>{ suggestionElements }</DomainSuggestionsList>
				) }
			</>
		);
	}

	render() {
		return (
			<VStack spacing={ 4 }>
				{ this.renderDomainAvailability() }
				{ this.renderDomainSuggestions() }
			</VStack>
		);
	}
}

const mapStateToProps = ( state, ownProps ) => {
	const currentUserCurrencyCode = getCurrentUserCurrencyCode( state );

	return {
		// Set site design type only if we're in signup
		siteDesignType: ownProps.isSignupStep && getDesignType( state ),
		currentUserCurrencyCode,
	};
};

export default connect( mapStateToProps )( localize( DomainSearchResults ) );
