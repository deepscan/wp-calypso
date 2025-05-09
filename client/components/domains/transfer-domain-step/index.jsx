import { PLAN_PERSONAL, getPlan, isPlan } from '@automattic/calypso-products';
import page from '@automattic/calypso-router';
import { Button } from '@automattic/components';
import { localizeUrl } from '@automattic/i18n-utils';
import { withShoppingCart } from '@automattic/shopping-cart';
import { INCOMING_DOMAIN_TRANSFER } from '@automattic/urls';
import clsx from 'clsx';
import { localize } from 'i18n-calypso';
import { get, isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import { stringify } from 'qs';
import { Component } from 'react';
import { connect } from 'react-redux';
import UpsellNudge from 'calypso/blocks/upsell-nudge';
import QueryProducts from 'calypso/components/data/query-products-list';
import DomainRegistrationSuggestion from 'calypso/components/domains/domain-registration-suggestion';
import TransferRestrictionMessage from 'calypso/components/domains/transfer-domain-step/transfer-restriction-message';
import FormTextInput from 'calypso/components/forms/form-text-input';
import HeaderCake from 'calypso/components/header-cake';
import Notice from 'calypso/components/notice';
import {
	isDomainBundledWithPlan,
	isNextDomainFree,
	hasToUpgradeToPayForADomain,
} from 'calypso/lib/cart-values/cart-items';
import {
	checkAuthCode,
	checkDomainAvailability,
	checkInboundTransferStatus,
	getDomainPrice,
	getDomainProductSlug,
	getDomainTransferSalePrice,
	getFixedDomainSearch,
	getTld,
	startInboundTransfer,
} from 'calypso/lib/domains';
import { domainAvailability } from 'calypso/lib/domains/constants';
import { getAvailabilityNotice } from 'calypso/lib/domains/registration/availability-messages';
import withCartKey from 'calypso/my-sites/checkout/with-cart-key';
import { domainManagementTransferIn } from 'calypso/my-sites/domains/paths';
import {
	composeAnalytics,
	recordGoogleEvent,
	recordTracksEvent,
} from 'calypso/state/analytics/actions';
import { getCurrentUserCurrencyCode } from 'calypso/state/currency-code/selectors';
import { getCurrentUser } from 'calypso/state/current-user/selectors';
import { errorNotice } from 'calypso/state/notices/actions';
import { getProductsList } from 'calypso/state/products-list/selectors';
import getCurrentRoute from 'calypso/state/selectors/get-current-route';
import { fetchSiteDomains } from 'calypso/state/sites/domains/actions';
import { getSelectedSite } from 'calypso/state/ui/selectors';
import TransferDomainPrecheck from './transfer-domain-precheck';

import './style.scss';

const noop = () => {};

class TransferDomainStep extends Component {
	static propTypes = {
		analyticsSection: PropTypes.string.isRequired,
		basePath: PropTypes.string,
		cart: PropTypes.object,
		domainsWithPlansOnly: PropTypes.bool,
		goBack: PropTypes.func,
		initialQuery: PropTypes.string,
		isSignupStep: PropTypes.bool,
		mapDomainUrl: PropTypes.string,
		onRegisterDomain: PropTypes.func,
		onTransferDomain: PropTypes.func,
		onSave: PropTypes.func,
		selectedSite: PropTypes.oneOfType( [ PropTypes.object, PropTypes.bool ] ),
		forcePrecheck: PropTypes.bool,
	};

	static defaultProps = {
		analyticsSection: 'domains',
		onSave: noop,
	};

	state = this.getDefaultState();

	getDefaultState() {
		const forcePrecheck = get( this.props, 'forcePrecheck', false );
		return {
			authCodeValid: null,
			domain: null,
			domainsWithPlansOnly: false,
			inboundTransferStatus: {},
			isTransferable: forcePrecheck,
			precheck: forcePrecheck,
			searchQuery: this.props.initialQuery || '',
			submittingAuthCodeCheck: false,
			submittingAvailability: false,
			submittingWhois: forcePrecheck,
			supportsPrivacy: false,
		};
	}

	// @TODO: Please update https://github.com/Automattic/wp-calypso/issues/58453 if you are refactoring away from UNSAFE_* lifecycle methods!
	UNSAFE_componentWillMount() {
		if ( this.props.initialState ) {
			this.setState( Object.assign( {}, this.props.initialState, this.getDefaultState() ) );
		}

		if ( this.props.forcePrecheck && isEmpty( this.inboundTransferStatus ) ) {
			this.getInboundTransferStatus();
		}
	}

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

	canInitiateTransfer = () => {
		const { cart, selectedSite } = this.props;
		const { searchQuery } = this.state;
		return (
			getTld( searchQuery ) && ! hasToUpgradeToPayForADomain( selectedSite, cart, searchQuery )
		);
	};

	getMapDomainUrl() {
		const { basePath, mapDomainUrl, selectedSite } = this.props;
		if ( mapDomainUrl ) {
			return mapDomainUrl;
		}

		let buildMapDomainUrl;
		const basePathForMapping = basePath?.endsWith( '/transfer' )
			? basePath.substring( 0, basePath.length - 9 )
			: basePath;

		buildMapDomainUrl = `${ basePathForMapping }/mapping`;
		if ( selectedSite ) {
			const query = stringify( { initialQuery: this.state.searchQuery.trim() } );
			buildMapDomainUrl += `/${ selectedSite.slug }?${ query }`;
		}

		return buildMapDomainUrl;
	}

	goToMapDomainStep = ( event ) => {
		event.preventDefault();

		this.props.recordMapDomainButtonClick( this.props.analyticsSection );

		page( this.getMapDomainUrl() );
	};

	renderPriceText = () => {
		const {
			cart,
			currencyCode,
			translate,
			domainsWithPlansOnly,
			isSignupStep,
			productsList,
			selectedSite,
		} = this.props;
		const { searchQuery } = this.state;
		const productSlug = getDomainProductSlug( searchQuery );
		const isFreewithPlan =
			isNextDomainFree( cart, searchQuery ) || isDomainBundledWithPlan( cart, searchQuery );
		const domainsWithPlansOnlyButNoPlan =
			domainsWithPlansOnly && ( ( selectedSite && ! isPlan( selectedSite.plan ) ) || isSignupStep );

		const domainProductPrice = getDomainPrice( productSlug, productsList, currencyCode );
		const domainProductSalePrice = getDomainTransferSalePrice(
			productSlug,
			productsList,
			currencyCode
		);

		let domainProductPriceCost = translate( '%(cost)s {{small}}/year{{/small}}', {
			args: { cost: domainProductPrice },
			components: { small: <small /> },
		} );
		if ( isFreewithPlan || domainsWithPlansOnlyButNoPlan || domainProductSalePrice ) {
			domainProductPriceCost = translate(
				'Renews in one year at: %(cost)s {{small}}/year{{/small}}',
				{
					args: { cost: domainProductPrice },
					components: { small: <small /> },
				}
			);
		}

		let domainProductPriceText;
		if ( isFreewithPlan ) {
			domainProductPriceText = translate(
				'Adds one year of domain registration for free with your plan.'
			);
		} else if ( domainsWithPlansOnlyButNoPlan ) {
			domainProductPriceText = translate(
				'One additional year of domain registration included in annual paid plans.'
			);
		} else if ( domainProductSalePrice ) {
			domainProductPriceText = translate( 'Sale price is %(cost)s', {
				args: { cost: domainProductSalePrice },
			} );
		}

		if ( ! currencyCode ) {
			return null;
		}

		return (
			<div
				className={ clsx( 'transfer-domain-step__price', {
					'is-free-with-plan': isFreewithPlan || domainsWithPlansOnlyButNoPlan,
					'is-sale-price':
						domainProductSalePrice && ! ( isFreewithPlan || domainsWithPlansOnlyButNoPlan ),
				} ) }
			>
				<div className="transfer-domain-step__price-text">{ domainProductPriceText }</div>
				{ domainProductPrice && (
					<div className="transfer-domain-step__price-cost">{ domainProductPriceCost }</div>
				) }
			</div>
		);
	};

	addTransfer() {
		const { translate } = this.props;
		const { searchQuery, submittingAvailability, submittingWhois } = this.state;
		const submitting = submittingAvailability || submittingWhois;

		return (
			<div>
				<QueryProducts />
				{ this.notice() }
				<form className="transfer-domain-step__form card" onSubmit={ this.handleFormSubmit }>
					<div className="transfer-domain-step__domain-description">
						<div className="transfer-domain-step__domain-heading">
							{ translate( 'Manage your domain and site together on WordPress.com.' ) }
						</div>
						{ this.renderPriceText() }
					</div>

					<div className="transfer-domain-step__add-domain" role="group">
						<FormTextInput
							// eslint-disable-next-line jsx-a11y/no-autofocus
							autoFocus
							value={ searchQuery }
							placeholder={ translate( 'example.com' ) }
							onBlur={ this.save }
							onChange={ this.setSearchQuery }
							onFocus={ this.recordInputFocus }
						/>
						<Button
							disabled={ submitting || ! this.canInitiateTransfer() }
							busy={ submitting }
							className="transfer-domain-step__go button is-primary"
							onClick={ this.handleFormSubmit }
						>
							{ translate( 'Transfer' ) }
						</Button>
					</div>
					{ this.domainRegistrationUpsell() }

					<div className="transfer-domain-step__domain-text">
						{ translate(
							'Transfer your domain away from your current provider to WordPress.com so you can update settings, ' +
								"renew your domain, and more \u2013 right in your dashboard. We'll renew it for another year " +
								'when the transfer is successful. {{a}}Learn more about domain transfers.{{/a}}',
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

	startPendingInboundTransfer = ( domain, authCode ) => {
		const { currentRoute, selectedSite, translate } = this.props;

		startInboundTransfer( selectedSite.ID, domain, authCode )
			.then( () => {
				this.props.fetchSiteDomains( selectedSite.ID );
				page( domainManagementTransferIn( selectedSite.slug, domain, currentRoute ) );
			} )
			.catch( () => {
				this.props.errorNotice( translate( 'We were unable to start the transfer.' ) );
			} );
	};

	getTransferDomainPrecheck() {
		const {
			authCodeValid,
			domain,
			inboundTransferStatus,
			submittingAuthCodeCheck,
			submittingWhois,
			searchQuery,
		} = this.state;

		const onSetValid = this.props.forcePrecheck
			? this.startPendingInboundTransfer
			: this.props.onTransferDomain;

		return (
			<TransferDomainPrecheck
				authCodeValid={ authCodeValid }
				checkAuthCode={ this.getAuthCodeStatus }
				domain={ domain || searchQuery }
				loading={ submittingWhois || submittingAuthCodeCheck }
				losingRegistrar={ inboundTransferStatus.losingRegistrar }
				losingRegistrarIanaId={ inboundTransferStatus.losingRegistrarIanaId }
				refreshStatus={ this.getInboundTransferStatus }
				selectedSiteSlug={ get( this.props, 'selectedSite.slug', null ) }
				setValid={ onSetValid }
				supportsPrivacy={ this.state.supportsPrivacy }
				unlocked={ inboundTransferStatus.unlocked }
			/>
		);
	}

	transferIsRestricted = () => {
		const { submittingAvailability, submittingWhois } = this.state;
		const submitting = submittingAvailability || submittingWhois;
		const transferRestrictionStatus = get(
			this.state,
			'inboundTransferStatus.transferRestrictionStatus',
			false
		);

		return (
			! submitting && transferRestrictionStatus && 'not_restricted' !== transferRestrictionStatus
		);
	};

	getTransferRestrictionMessage() {
		const { domain, inboundTransferStatus } = this.state;
		const { creationDate, termMaximumInYears, transferEligibleDate, transferRestrictionStatus } =
			inboundTransferStatus;

		return (
			<TransferRestrictionMessage
				basePath={ this.props.basePath }
				creationDate={ creationDate }
				domain={ domain }
				goBack={ this.goBack }
				mapDomainUrl={ this.getMapDomainUrl() }
				selectedSiteSlug={ get( this.props, 'selectedSite.slug', null ) }
				termMaximumInYears={ termMaximumInYears }
				transferEligibleDate={ transferEligibleDate }
				transferRestrictionStatus={ transferRestrictionStatus }
			/>
		);
	}

	goBack = () => {
		if ( this.state.domain ) {
			this.setState( {
				domain: null,
				inboundTransferStatus: {},
				isTransferable: false,
				precheck: false,
				notice: null,
				searchQuery: '',
				supportsPrivacy: false,
			} );
		} else {
			this.props.goBack();
		}
	};

	render() {
		let content;
		const { precheck, searchQuery } = this.state;
		const { isSignupStep, translate, cart, selectedSite } = this.props;
		const transferIsRestricted = this.transferIsRestricted();

		if ( transferIsRestricted ) {
			content = this.getTransferRestrictionMessage();
		} else if ( precheck && ! isSignupStep ) {
			content = this.getTransferDomainPrecheck();
		} else {
			content = this.addTransfer();
		}

		if ( hasToUpgradeToPayForADomain( selectedSite, cart, searchQuery ) ) {
			content = (
				<div>
					<UpsellNudge
						description={ translate(
							// translators: %s is the Starter/Personal plan name
							'Only .blog domains are included with your plan, to use a different tld upgrade to a %(planName)s plan.',
							{
								args: {
									planName: getPlan( PLAN_PERSONAL )?.getTitle(),
								},
							}
						) }
						plan={ PLAN_PERSONAL }
						title={
							// translators: %s is the Starter/Personal plan name
							translate( '%(planName)s plan required', {
								args: {
									planName: getPlan( PLAN_PERSONAL )?.getTitle(),
								},
							} )
						}
						showIcon
						event="domains_transfer_plan_required"
					/>
					{ content }
				</div>
			);
		}

		const header = ! isSignupStep && (
			<HeaderCake onClick={ this.goBack }>
				{ this.props.translate( 'Use My Own Domain' ) }
			</HeaderCake>
		);

		return (
			<div className="transfer-domain-step">
				{ header }
				<div>{ content }</div>
			</div>
		);
	}

	domainRegistrationUpsell() {
		const { suggestion } = this.state;
		const { onRegisterDomain } = this.props;
		if ( ! suggestion || ! onRegisterDomain ) {
			return;
		}

		return (
			<div className="transfer-domain-step__domain-availability">
				<DomainRegistrationSuggestion
					cart={ this.props.cart }
					isCartPendingUpdate={ this.props.shoppingCartManager.isPendingUpdate }
					domainsWithPlansOnly={ this.props.domainsWithPlansOnly }
					key={ suggestion.domain_name }
					onButtonClick={ this.registerSuggestedDomain }
					selectedSite={ this.props.selectedSite }
					suggestion={ suggestion }
				/>
			</div>
		);
	}

	registerSuggestedDomain = () => {
		this.props.recordAddDomainButtonClickInTransferDomain(
			this.state.suggestion.domain_name,
			this.props.analyticsSection,
			this.props.flowName
		);

		return this.props.onRegisterDomain( this.state.suggestion );
	};

	recordInputFocus = () => {
		this.props.recordInputFocusInTransferDomain( this.state.searchQuery );
	};

	setSearchQuery = ( event ) => {
		this.setState( { searchQuery: event.target.value } );
	};

	handleFormSubmit = ( event ) => {
		event.preventDefault();

		// Check for a keyboard-driven submission of invalid data.
		if ( ! this.canInitiateTransfer() ) {
			return;
		}

		const { analyticsSection, searchQuery } = this.state;
		const domain = getFixedDomainSearch( searchQuery );

		this.props.recordFormSubmitInTransferDomain( searchQuery );

		this.setState( {
			isTransferable: false,
			notice: null,
			suggestion: null,
			submittingAvailability: true,
		} );

		this.props.recordGoButtonClickInTransferDomain( searchQuery, analyticsSection );

		Promise.all( [ this.getInboundTransferStatus(), this.getAvailability() ] ).then( () => {
			this.setState( ( prevState ) => {
				const { isTransferable, submittingAvailability, submittingWhois, suggestion } = prevState;

				return {
					domain,
					precheck:
						prevState.domain !== null &&
						isTransferable &&
						! suggestion &&
						! submittingAvailability &&
						! submittingWhois,
				};
			} );

			if (
				this.props.isSignupStep &&
				this.state.domain &&
				! this.transferIsRestricted() &&
				this.state.isTransferable
			) {
				this.props.onTransferDomain( domain );
			}
		} );
	};

	getAvailability = () => {
		const domain = getFixedDomainSearch( this.state.searchQuery );

		return new Promise( ( resolve ) => {
			checkDomainAvailability(
				{ domainName: domain, blogId: get( this.props, 'selectedSite.ID', null ) },
				( error, result ) => {
					const status = get( result, 'status', error );
					const tld = result.tld || getTld( domain );
					switch ( status ) {
						case domainAvailability.AVAILABLE:
							this.setState( { suggestion: result } );
							break;
						case domainAvailability.TRANSFERRABLE:
						case domainAvailability.MAPPED_SAME_SITE_TRANSFERRABLE:
							this.setState( {
								domain,
								isTransferable: true,
								supportsPrivacy: get( result, 'supports_privacy', false ),
							} );
							break;
						case domainAvailability.TLD_NOT_SUPPORTED: {
							this.setState( {
								notice: this.props.translate(
									'This domain appears to be available for registration, however we do not offer registrations or accept transfers for domains ending in {{strong}}.%(tld)s{{/strong}}. ' +
										'If you register it elsewhere, you can {{a}}connect it{{/a}} to your WordPress.com site instead.',
									{
										args: { tld },
										components: {
											strong: <strong />,
											a: <a href="#" onClick={ this.goToMapDomainStep } />, // eslint-disable-line jsx-a11y/anchor-is-valid
										},
									}
								),
								noticeSeverity: 'info',
							} );
							break;
						}
						case domainAvailability.MAPPABLE:
						case domainAvailability.TLD_NOT_SUPPORTED_TEMPORARILY:
						case domainAvailability.TLD_NOT_SUPPORTED_AND_DOMAIN_NOT_AVAILABLE: {
							this.setState( {
								notice: this.props.translate(
									"We don't support transfers for domains ending with {{strong}}.%(tld)s{{/strong}}, " +
										'but you can {{a}}map it{{/a}} instead.',
									{
										args: { tld },
										components: {
											strong: <strong />,
											a: <a href="#" onClick={ this.goToMapDomainStep } />, // eslint-disable-line jsx-a11y/anchor-is-valid
										},
									}
								),
								noticeSeverity: 'info',
							} );
							break;
						}
						case domainAvailability.RECENT_REGISTRATION_LOCK_NOT_TRANSFERRABLE:
							this.setState( {
								notice: this.props.translate(
									"This domain can't be transferred because it was registered less than 60 days ago."
								),
								noticeSeverity: 'info',
							} );
							break;
						case domainAvailability.SERVER_TRANSFER_PROHIBITED_NOT_TRANSFERRABLE:
							this.setState( {
								notice: this.props.translate(
									"This domain can't be transferred due to a transfer lock at the registry."
								),
								noticeSeverity: 'info',
							} );
							break;
						case domainAvailability.UNKNOWN: {
							const mappableStatus = get( result, 'mappable', error );

							if ( domainAvailability.MAPPABLE === mappableStatus ) {
								this.setState( {
									notice: this.props.translate(
										"{{strong}}%(domain)s{{/strong}} can't be transferred. " +
											'You can {{a}}manually connect it{{/a}} if you still want to use it for your site.',
										{
											args: { domain },
											components: {
												strong: <strong />,
												a: <a href="#" onClick={ this.goToMapDomainStep } />, // eslint-disable-line jsx-a11y/anchor-is-valid
											},
										}
									),
									noticeSeverity: 'info',
								} );
								break;
							}
						}
						default: {
							let site = get( result, 'other_site_domain', null );
							if ( ! site ) {
								site = get( this.props, 'selectedSite.slug', null );
							}

							const maintenanceEndTime = get( result, 'maintenance_end_time', null );
							const { message, severity } = getAvailabilityNotice( domain, status, {
								site,
								maintenanceEndTime,
							} );
							this.setState( { notice: message, noticeSeverity: severity } );
						}
					}

					this.setState( { submittingAvailability: false } );
					resolve();
				}
			);
		} );
	};

	getInboundTransferStatus = () => {
		this.setState( { submittingWhois: true } );

		return checkInboundTransferStatus( getFixedDomainSearch( this.state.searchQuery ) )
			.then( ( result ) => {
				const inboundTransferStatus = {
					creationDate: result.creation_date,
					email: result.admin_email,
					loading: false,
					losingRegistrar: result.registrar,
					losingRegistrarIanaId: result.registrar_iana_id,
					privacy: result.privacy,
					termMaximumInYears: result.term_maximum_in_years,
					transferEligibleDate: result.transfer_eligible_date,
					transferRestrictionStatus: result.transfer_restriction_status,
					unlocked: result.unlocked,
				};
				this.setState( { submittingWhois: false, inboundTransferStatus } );
				return { inboundTransferStatus };
			} )
			.catch( () => {
				this.setState( { submittingWhois: false } );
			} );
	};

	getAuthCodeStatus = ( domain, authCode ) => {
		this.setState( { submittingAuthCodeCheck: true } );

		return new Promise( ( resolve ) => {
			checkAuthCode( domain, authCode, ( error, result ) => {
				this.setState( { submittingAuthCodeCheck: false } );

				if ( ! isEmpty( error ) ) {
					const message = get( error, 'message' );
					if ( message ) {
						this.props.errorNotice( message );
					}
					resolve();
					return;
				}

				const authCodeValid = result.success;

				this.setState( { authCodeValid } );
				resolve( { authCodeValid } );
			} );
		} );
	};
}

const recordAddDomainButtonClickInTransferDomain = ( domain_name, section ) =>
	recordTracksEvent( 'calypso_transfer_domain_add_suggested_domain_click', {
		domain_name,
		section,
	} );

const recordFormSubmitInTransferDomain = ( domain_name ) =>
	recordTracksEvent( 'calypso_transfer_domain_form_submit', { domain_name } );

const recordInputFocusInTransferDomain = ( domain_name ) =>
	recordTracksEvent( 'calypso_transfer_domain_input_focus', { domain_name } );

const recordGoButtonClickInTransferDomain = ( domain_name, section ) =>
	recordTracksEvent( 'calypso_transfer_domain_go_click', { domain_name, section } );

const recordMapDomainButtonClick = ( section ) =>
	composeAnalytics(
		recordGoogleEvent( 'Transfer Domain', 'Clicked "Map it" Button' ),
		recordTracksEvent( 'calypso_transfer_domain_mapping_button_click', { section } )
	);

export default connect(
	( state ) => ( {
		currentRoute: getCurrentRoute( state ),
		currentUser: getCurrentUser( state ),
		currencyCode: getCurrentUserCurrencyCode( state ),
		selectedSite: getSelectedSite( state ),
		productsList: getProductsList( state ),
	} ),
	{
		errorNotice,
		fetchSiteDomains,
		recordAddDomainButtonClickInTransferDomain,
		recordFormSubmitInTransferDomain,
		recordInputFocusInTransferDomain,
		recordGoButtonClickInTransferDomain,
		recordMapDomainButtonClick,
	}
)( withCartKey( withShoppingCart( localize( TransferDomainStep ) ) ) );
