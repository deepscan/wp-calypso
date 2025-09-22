import { Badge, Gridicon } from '@automattic/components';
import { getTld, parseMatchReasons } from '@automattic/domain-search';
import { localizeUrl } from '@automattic/i18n-utils';
import { formatCurrency } from '@automattic/number-formatters';
import { HUNDRED_YEAR_DOMAIN_FLOW } from '@automattic/onboarding';
import { HTTPS_SSL } from '@automattic/urls';
import clsx from 'clsx';
import { localize } from 'i18n-calypso';
import { get, includes } from 'lodash';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import DomainSuggestion from 'calypso/components/domains/domain-suggestion';
import InfoPopover from 'calypso/components/info-popover';
import {
	shouldBundleDomainWithPlan,
	getDomainPriceRule,
	hasDomainInCart,
	isPaidDomain,
	DOMAIN_PRICE_RULE,
} from 'calypso/lib/cart-values/cart-items';
import { getDomainPrice, getDomainSalePrice } from 'calypso/lib/domains';
import { shouldUseMultipleDomainsInCart } from 'calypso/signup/steps/domains/legacy/utils';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import { getCurrentUserCurrencyCode } from 'calypso/state/currency-code/selectors';
import { getCurrentUser } from 'calypso/state/current-user/selectors';
import { getProductsList } from 'calypso/state/products-list/selectors';
import { getCurrentFlowName } from 'calypso/state/signup/flow/selectors';
import PremiumBadge from './premium-badge';

class DomainRegistrationSuggestion extends Component {
	static propTypes = {
		isDomainOnly: PropTypes.bool,
		isCartPendingUpdate: PropTypes.bool,
		isCartPendingUpdateDomain: PropTypes.object,
		isSignupStep: PropTypes.bool,
		showStrikedOutPrice: PropTypes.bool,
		isFeatured: PropTypes.bool,
		buttonStyles: PropTypes.object,
		cart: PropTypes.object,
		suggestion: PropTypes.shape( {
			domain_name: PropTypes.string.isRequired,
			product_slug: PropTypes.string,
			cost: PropTypes.string,
			match_reasons: PropTypes.arrayOf( PropTypes.string ),
			currency_code: PropTypes.string,
			policy_notices: PropTypes.arrayOf(
				PropTypes.shape( {
					type: PropTypes.string.isRequired,
					label: PropTypes.string.isRequired,
					message: PropTypes.string.isRequired,
				} )
			),
		} ).isRequired,
		suggestionSelected: PropTypes.bool,
		onButtonClick: PropTypes.func.isRequired,
		domainsWithPlansOnly: PropTypes.bool.isRequired,
		premiumDomain: PropTypes.object,
		selectedSite: PropTypes.object,
		railcarId: PropTypes.string,
		recordTracksEvent: PropTypes.func,
		uiPosition: PropTypes.number,
		fetchAlgo: PropTypes.string,
		query: PropTypes.string,
		pendingCheckSuggestion: PropTypes.object,
		unavailableDomains: PropTypes.array,
		productCost: PropTypes.string,
		renewCost: PropTypes.string,
		productSaleCost: PropTypes.string,
		hideMatchReasons: PropTypes.bool,
		domainAndPlanUpsellFlow: PropTypes.bool,
		products: PropTypes.object,
	};

	componentDidMount() {
		this.recordRender();
	}

	componentDidUpdate( prevProps ) {
		if (
			prevProps.railcarId !== this.props.railcarId ||
			prevProps.uiPosition !== this.props.uiPosition
		) {
			this.recordRender();
		}
	}

	recordRender() {
		if ( this.props.railcarId && typeof this.props.uiPosition === 'number' ) {
			let resultSuffix = '';
			if ( this.props.suggestion.isRecommended ) {
				resultSuffix = '#recommended';
			} else if ( this.props.suggestion.isBestAlternative ) {
				resultSuffix = '#best-alternative';
			}

			this.props.recordTracksEvent( 'calypso_traintracks_render', {
				railcar: this.props.railcarId,
				ui_position: this.props.uiPosition,
				fetch_algo: `${ this.props.fetchAlgo }/${ this.props.suggestion.vendor }`,
				root_vendor: this.props.suggestion.vendor,
				rec_result: `${ this.props.suggestion.domain_name }${ resultSuffix }`,
				fetch_query: this.props.query,
				domain_type: this.props.suggestion.is_premium ? 'premium' : 'standard',
				tld: getTld( this.props.suggestion.domain_name ),
				flow_name: this.props.flowName,
			} );
		}
	}

	onButtonClick = ( previousState ) => {
		const { suggestion, railcarId, uiPosition } = this.props;

		if ( this.isUnavailableDomain( suggestion.domain_name ) ) {
			return;
		}

		if ( railcarId ) {
			this.props.recordTracksEvent( 'calypso_traintracks_interact', {
				railcar: railcarId,
				action: 'domain_added_to_cart',
				domain: suggestion.domain_name,
				root_vendor: suggestion.vendor,
			} );
		}

		this.props.onButtonClick( suggestion, uiPosition, previousState );
	};

	isUnavailableDomain = ( domain ) => {
		return includes( this.props.unavailableDomains, domain );
	};

	getSelectDomainAriaLabel() {
		const { suggestion, translate, productCost, productSaleCost } = this.props;
		const priceRule = this.getPriceRule();

		const baseLabel = translate( 'Select domain %(domainName)s', {
			args: { domainName: suggestion.domain_name },
			context: 'Accessible label for domain selection button. %(domainName)s is the domain name.',
		} );

		switch ( priceRule ) {
			case DOMAIN_PRICE_RULE.ONE_TIME_PRICE:
				return translate( '%(baseLabel)s. %(price)s one-time', {
					args: {
						baseLabel,
						price: productCost,
					},
					comment:
						'Accessible label for one-time priced domain (e.g. domain with 100-year plan). %(baseLabel)s is the base label (e.g. "Select domain testing.com"). %(price)s is the price.',
				} );
			case DOMAIN_PRICE_RULE.FREE_DOMAIN:
				return translate( '%(baseLabel)s. Free', {
					args: {
						baseLabel,
					},
					comment:
						'Accessible label for free domain. %(baseLabel)s is the base label (e.g. "Select domain testing.com").',
				} );
			case DOMAIN_PRICE_RULE.FREE_FOR_FIRST_YEAR:
				return translate( '%(baseLabel)s. Free for the first year, then %(price)s per year', {
					args: {
						baseLabel,
						price: productCost,
					},
					comment:
						'Accessible label for domain free for the first year. %(baseLabel)s is the base label (e.g. "Select domain testing.com"). %(price)s is the price.',
				} );
			case DOMAIN_PRICE_RULE.FREE_WITH_PLAN:
				return translate(
					'%(baseLabel)s. Free for the first year with annual paid plans, then %(price)s per year',
					{
						args: {
							baseLabel,
							price: productCost,
						},
						comment:
							'Accessible label for free domain with normal price. %(baseLabel)s is the base label (e.g. "Select domain testing.com"). %(price)s is the price.',
					}
				);
			case DOMAIN_PRICE_RULE.UPGRADE_TO_HIGHER_PLAN_TO_BUY:
				return translate( '%(baseLabel)s. Plan upgrade required to register this domain.', {
					args: {
						baseLabel,
					},
					comment:
						'Accessible label for domain that requires a plan upgrade. %(baseLabel)s is the base label (e.g. "Select domain testing.com").',
				} );
			case DOMAIN_PRICE_RULE.INCLUDED_IN_HIGHER_PLAN:
				return translate( '%(baseLabel)s. Included in paid plans', {
					args: {
						baseLabel,
					},
					comment:
						'Accessible label for domain included in higher plans. %(baseLabel)s is the base label (e.g. "Select domain testing.com").',
				} );
			case DOMAIN_PRICE_RULE.DOMAIN_MOVE_PRICE:
				return translate( '%(baseLabel)s. %(price)s one-time', {
					args: {
						baseLabel,
						price: productCost,
					},
					comment:
						'Accessible label for domain move price. %(baseLabel)s is the base label (e.g. "Select domain testing.com"). %(price)s is the price.',
				} );
			case DOMAIN_PRICE_RULE.PRICE:
				if ( productSaleCost && productCost ) {
					return translate(
						'%(baseLabel)s. %(salePrice)s for the first year, then %(price)s per year',
						{
							args: {
								baseLabel,
								salePrice: productSaleCost,
								price: productCost,
							},
							comment:
								'Accessible label for domain with sale price. %(baseLabel)s is the base label (e.g. "Select domain testing.com"). %(salePrice)s is the sale price. %(price)s is the price.',
						}
					);
				}
				if ( productCost ) {
					return translate( '%(baseLabel)s. %(price)s per year', {
						args: {
							baseLabel,
							price: productCost,
						},
						comment:
							'Accessible label for regularly priced domain. %(baseLabel)s is the base label (e.g. "Select domain testing.com"). %(price)s is the price.',
					} );
				}
				return baseLabel;
			default:
				return baseLabel;
		}
	}

	getButtonProps() {
		const {
			cart,
			domainsWithPlansOnly,
			isSignupStep,
			selectedSite,
			suggestion,
			suggestionSelected,
			translate,
			pendingCheckSuggestion,
			premiumDomain,
			isCartPendingUpdateDomain,
			flowName,
			temporaryCart,
			domainRemovalQueue,
		} = this.props;
		const { domain_name: domain } = suggestion;

		let isAdded =
			suggestionSelected ||
			hasDomainInCart( cart, domain ) ||
			( temporaryCart && temporaryCart.some( ( item ) => item.meta === domain ) );

		// If we're removing this domain, let's instantly show that for the user
		if (
			domainRemovalQueue?.length > 0 &&
			domainRemovalQueue.some( ( item ) => item.meta === domain ) &&
			! ( temporaryCart && temporaryCart.some( ( item ) => item.meta === domain ) )
		) {
			isAdded = false;
		}

		let buttonContent;
		let ariaLabel;
		let buttonStyles = this.props.buttonStyles;

		if ( isAdded ) {
			buttonContent = translate( '{{checkmark/}} In Cart', {
				context: 'Domain is already added to shopping cart',
				components: { checkmark: <Gridicon icon="checkmark" /> },
			} );
			ariaLabel = translate( 'Domain %(domainName)s is already added to shopping cart', {
				args: { domainName: suggestion.domain_name },
				context:
					'Accessible label for domain that is already added to shopping cart. %(domainName)s is the domain name.',
			} );

			buttonStyles = { ...buttonStyles, primary: false };

			if ( shouldUseMultipleDomainsInCart( flowName ) ) {
				buttonStyles = { ...buttonStyles, borderless: true };

				buttonContent = translate( '{{checkmark/}} Selected', {
					context: 'Domain is already added to shopping cart',
					components: { checkmark: <Gridicon style={ { height: 21 } } icon="checkmark" /> },
				} );
				ariaLabel = translate( 'Selected domain %(domainName)s', {
					args: { domainName: suggestion.domain_name },
					context:
						'Accessible label for domain that is selected. %(domainName)s is the domain name.',
				} );
			}
		} else {
			const shouldUpgrade =
				! isSignupStep &&
				shouldBundleDomainWithPlan( domainsWithPlansOnly, selectedSite, cart, suggestion );

			if ( shouldUpgrade ) {
				buttonContent = translate( 'Upgrade', {
					context: 'Domain mapping suggestion button with plan upgrade',
				} );
				ariaLabel = translate( 'Upgrade plan to add domain %(domainName)s', {
					args: { domainName: suggestion.domain_name },
					context:
						'Accessible label for domain mapping suggestion button with plan upgrade. %(domainName)s is the domain name.',
				} );
			} else {
				buttonContent = translate( 'Select', {
					context: 'Domain mapping suggestion button',
				} );
				ariaLabel = this.getSelectDomainAriaLabel();
			}
		}

		if ( premiumDomain?.pending ) {
			buttonStyles = { ...buttonStyles, disabled: true };
		} else if ( premiumDomain?.is_price_limit_exceeded ) {
			buttonStyles = { ...buttonStyles, disabled: true };
			buttonContent = translate( 'Restricted', {
				context: 'Premium domain is not available for registration',
			} );
			ariaLabel = translate( 'Premium domain %(domainName)s is not available for registration', {
				args: { domainName: suggestion.domain_name },
				context: 'Accessible label for restricted premium domain',
			} );
		} else if ( this.isUnavailableDomain( suggestion.domain_name ) ) {
			buttonStyles = { ...buttonStyles, disabled: true };
			buttonContent = translate( 'Unavailable', {
				context: 'Domain suggestion is not available for registration',
			} );
			ariaLabel = translate( 'Domain %(domainName)s is not available for registration', {
				args: { domainName: suggestion.domain_name },
				context: 'Accessible label for unavailable domain',
			} );
		} else if (
			pendingCheckSuggestion?.domain_name === domain ||
			( this.props.isCartPendingUpdate && isCartPendingUpdateDomain?.domain_name === domain )
		) {
			buttonStyles = { ...buttonStyles, busy: true, disabled: true };
		} else if (
			pendingCheckSuggestion ||
			( this.props.isCartPendingUpdate && isCartPendingUpdateDomain?.domain_name !== domain )
		) {
			buttonStyles = { ...buttonStyles, disabled: true };
		}

		if ( shouldUseMultipleDomainsInCart( flowName ) ) {
			buttonStyles = { ...buttonStyles, primary: false, busy: false, disabled: false };
		}

		return {
			buttonContent,
			buttonStyles,
			isAdded,
			ariaLabel,
		};
	}

	getPriceRule() {
		const {
			cart,
			isDomainOnly,
			domainsWithPlansOnly,
			selectedSite,
			suggestion,
			flowName,
			domainAndPlanUpsellFlow,
		} = this.props;
		return getDomainPriceRule(
			domainsWithPlansOnly,
			selectedSite,
			cart,
			suggestion,
			isDomainOnly,
			flowName,
			domainAndPlanUpsellFlow
		);
	}

	/**
	 * Splits a domain into name and tld. Everything after the "first dot"
	 * becomes the tld. This is not very comprehensive since there can be
	 * subdomains which would fail this test. However, for our purpose of
	 * highlighting the TLD in domain suggestions, this is good enough.
	 * @param {string} domain The domain to be parsed
	 */
	getDomainParts( domain ) {
		const parts = domain.split( '.' );
		const name = parts[ 0 ];
		const tld = `.${ parts.slice( 1 ).join( '.' ) }`;
		return {
			name,
			tld,
		};
	}

	getFormattedDomainName( name ) {
		if ( name.length <= 24 ) {
			return name;
		}

		return (
			<abbr title={ name }>
				{ name.slice( 0, 8 ) }…{ name.slice( -8 ) }
			</abbr>
		);
	}

	renderDomain( hasBadges = false ) {
		const {
			suggestion: { domain_name: domain },
		} = this.props;

		const { name, tld } = this.getDomainParts( domain );

		const wrapperClassName = clsx( 'domain-registration-suggestion__title-info', {
			'has-badges': hasBadges,
		} );
		const titleWrapperClassName = clsx( 'domain-registration-suggestion__title-wrapper', {
			'domain-registration-suggestion__title-domain':
				this.props.showStrikedOutPrice && ! this.props.isFeatured,
			'domain-registration-suggestion__larger-domain': name.length > 15 ? true : false,
		} );

		return (
			<div className={ wrapperClassName }>
				<div className={ titleWrapperClassName }>
					<div className="domain-registration-suggestion__title">
						<div className="domain-registration-suggestion__domain-title">
							<h3 aria-label={ domain }>
								<span className="domain-registration-suggestion__domain-title-name">
									{ this.getFormattedDomainName( name ) }
								</span>
								<span className="domain-registration-suggestion__domain-title-tld">{ tld }</span>
							</h3>
						</div>
					</div>
				</div>
			</div>
		);
	}

	getPolicyNoticeMessage( notice ) {
		const { translate } = this.props;

		if ( notice.type === 'hsts' ) {
			return translate(
				'%(message)s When you host this domain at WordPress.com, an SSL ' +
					'certificate is included. {{a}}Learn more{{/a}}.',
				{
					args: {
						message: notice.message,
					},
					components: {
						a: (
							<a
								href={ localizeUrl( HTTPS_SSL ) }
								target="_blank"
								rel="noopener noreferrer"
								onClick={ ( event ) => {
									event.stopPropagation();
								} }
							/>
						),
					},
				}
			);
		}

		return notice.message;
	}

	renderBadges() {
		const {
			suggestion: {
				isRecommended,
				isBestAlternative,
				is_premium: isPremium,
				policy_notices: policyNotices,
			},
			translate,
			isFeatured,
			productSaleCost,
			premiumDomain,
		} = this.props;
		const badges = [];

		if ( isRecommended && isFeatured ) {
			badges.push(
				<Badge key="recommended" type="info-green">
					{ translate( 'Recommended' ) }
				</Badge>
			);
		} else if ( isBestAlternative && isFeatured ) {
			badges.push(
				<Badge key="best-alternative" type="info-purple">
					{ translate( 'Best Alternative' ) }
				</Badge>
			);
		}

		if ( policyNotices ) {
			policyNotices.forEach( ( notice ) => {
				badges.push(
					<Badge
						key={ notice.type }
						type="info"
						className="domain-registration-suggestion__info-badge"
					>
						{ notice.label }
						<InfoPopover iconSize={ 16 } showOnHover>
							{ this.getPolicyNoticeMessage( notice ) }
						</InfoPopover>
					</Badge>
				);
			} );
		}

		const paidDomain = isPaidDomain( this.getPriceRule() );
		if ( productSaleCost && paidDomain ) {
			const saleBadgeText = translate( 'Sale', {
				comment: 'Shown next to a domain that has a special discounted sale price',
			} );
			badges.push( <Badge key="sale">{ saleBadgeText }</Badge> );
		}

		if ( isPremium ) {
			badges.push(
				<PremiumBadge
					key="premium"
					restrictedPremium={ premiumDomain?.is_price_limit_exceeded }
					domainName={ this.props.suggestion.domain_name }
				/>
			);
		}

		if ( badges.length > 0 ) {
			return <div className="domain-registration-suggestion__badges">{ badges }</div>;
		}
	}

	renderMatchReason() {
		const {
			suggestion: { domain_name: domain },
		} = this.props;

		if ( ! Array.isArray( this.props.suggestion.match_reasons ) ) {
			return <div className="domain-registration-suggestion__match-reasons"></div>;
		}

		const matchReasons = parseMatchReasons( domain, this.props.suggestion.match_reasons );

		return (
			<div className="domain-registration-suggestion__match-reasons">
				{ matchReasons.map( ( phrase, index ) => (
					<div className="domain-registration-suggestion__match-reason" key={ index }>
						<Gridicon icon="checkmark" size={ 18 } />
						{ phrase }
					</div>
				) ) }
			</div>
		);
	}

	render() {
		const {
			domainsWithPlansOnly,
			isFeatured,
			suggestion: { domain_name: domain },
			productCost,
			renewCost,
			productSaleCost,
			premiumDomain,
			showStrikedOutPrice,
			hideMatchReasons,
		} = this.props;

		const isUnavailableDomain = this.isUnavailableDomain( domain );

		const extraClasses = clsx( {
			'featured-domain-suggestion': isFeatured,
			'is-unavailable': isUnavailableDomain,
		} );

		const badges = this.renderBadges();

		return (
			<DomainSuggestion
				extraClasses={ extraClasses }
				premiumDomain={ premiumDomain }
				priceRule={ this.getPriceRule() }
				price={ productCost }
				renewPrice={ renewCost }
				salePrice={ productSaleCost }
				domain={ domain }
				domainsWithPlansOnly={ domainsWithPlansOnly }
				onButtonClick={ this.onButtonClick }
				{ ...this.getButtonProps() }
				isFeatured={ isFeatured }
				showStrikedOutPrice={ showStrikedOutPrice }
				hideMatchReasons={ hideMatchReasons }
			>
				{ badges }
				{ this.renderDomain( !! badges ) }
				{ ! hideMatchReasons && isFeatured && this.renderMatchReason() }
			</DomainSuggestion>
		);
	}
}

const mapStateToProps = ( state, props ) => {
	const productSlug = get( props, 'suggestion.product_slug' );
	const productsList = props.products ?? getProductsList( state );
	const currentUserCurrencyCode =
		props.suggestion.currency_code || getCurrentUserCurrencyCode( state );
	const stripZeros = props.showStrikedOutPrice ? true : false;
	const isPremium = props.premiumDomain?.is_premium || props.suggestion?.is_premium;
	const flowName = getCurrentFlowName( state );

	let productCost;
	let productSaleCost;
	let renewCost;

	if ( isPremium ) {
		productCost = props.premiumDomain?.cost;
		renewCost = props.premiumDomain?.renew_cost;
		if ( props.premiumDomain?.sale_cost ) {
			productSaleCost = formatCurrency( props.premiumDomain?.sale_cost, currentUserCurrencyCode, {
				stripZeros,
			} );
		}
	} else if ( HUNDRED_YEAR_DOMAIN_FLOW === flowName ) {
		productCost = props.suggestion.cost;
		renewCost = props.suggestion.renew_cost;
	} else {
		productCost = getDomainPrice( productSlug, productsList, currentUserCurrencyCode, stripZeros );
		// Renew cost is the same as the product cost for non-premium domains
		renewCost = productCost;
		productSaleCost = getDomainSalePrice(
			productSlug,
			productsList,
			currentUserCurrencyCode,
			stripZeros
		);
	}

	return {
		productCost,
		renewCost,
		productSaleCost,
		flowName,
		currentUser: getCurrentUser( state ),
	};
};

export default connect( mapStateToProps, { recordTracksEvent } )(
	localize( DomainRegistrationSuggestion )
);
