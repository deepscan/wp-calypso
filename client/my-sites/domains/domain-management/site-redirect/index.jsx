import page from '@automattic/calypso-router';
import { CompactCard as Card, FormLabel } from '@automattic/components';
import { SITE_REDIRECT } from '@automattic/urls';
import { createHigherOrderComponent } from '@wordpress/compose';
import clsx from 'clsx';
import { localize } from 'i18n-calypso';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect, useSelector } from 'react-redux';
import FormButton from 'calypso/components/forms/form-button';
import FormFieldset from 'calypso/components/forms/form-fieldset';
import FormTextInputWithAffixes from 'calypso/components/forms/form-text-input-with-affixes';
import Main from 'calypso/components/main';
import Notice from 'calypso/components/notice';
import SectionHeader from 'calypso/components/section-header';
import { withoutHttp } from 'calypso/lib/url';
import Header from 'calypso/my-sites/domains/domain-management/components/header';
import {
	domainManagementSiteRedirect,
	domainManagementRedirectSettings,
} from 'calypso/my-sites/domains/paths';
import {
	composeAnalytics,
	recordGoogleEvent,
	recordTracksEvent,
} from 'calypso/state/analytics/actions';
import {
	closeSiteRedirectNotice,
	fetchSiteRedirect,
	updateSiteRedirect,
} from 'calypso/state/domains/site-redirect/actions';
import { getSiteRedirectLocation } from 'calypso/state/domains/site-redirect/selectors';
import getCurrentRoute from 'calypso/state/selectors/get-current-route';
import { getSelectedSite } from 'calypso/state/ui/selectors';

import './style.scss';

class SiteRedirect extends Component {
	static propTypes = {
		location: PropTypes.object.isRequired,
		selectedDomainName: PropTypes.string.isRequired,
		selectedSite: PropTypes.object.isRequired,
	};

	state = {
		redirectUrl: this.props.location.value,
	};

	componentDidMount() {
		this.props.fetchSiteRedirect( this.props.selectedSite.domain );
	}

	componentWillUnmount() {
		this.closeRedirectNotice();
	}

	closeRedirectNotice = () => {
		this.props.closeSiteRedirectNotice( this.props.selectedSite.domain );
	};

	handleChange = ( event ) => {
		const redirectUrl = withoutHttp( event.target.value );

		this.setState( { redirectUrl } );
	};

	handleClick = () => {
		this.props
			.updateSiteRedirect( this.props.selectedSite.domain, this.state.redirectUrl )
			.then( ( success ) => {
				this.props.recordUpdateSiteRedirectClick(
					this.props.selectedDomainName,
					this.state.redirectUrl,
					success
				);

				if ( success ) {
					page(
						domainManagementRedirectSettings(
							this.props.selectedSite.slug,
							this.state.redirectUrl.replace( /\/+$/, '' ).trim(),
							this.props.currentRoute
						)
					);
				}
			} );
	};

	handleFocus = () => {
		this.props.recordLocationFocus( this.props.selectedDomainName );
	};

	getNoticeStatus( notice ) {
		if ( notice?.error ) {
			return 'is-error';
		}
		if ( notice?.success ) {
			return 'is-success';
		}
		return 'is-info';
	}

	render() {
		const { location, translate } = this.props;
		const { isUpdating, notice } = location;
		const isFetching = location.isFetching;

		const classes = clsx( 'site-redirect-card', { fetching: isFetching } );

		return (
			<div>
				<Main>
					<Header onClick={ this.goToEdit } selectedDomainName={ this.props.selectedDomainName }>
						{ translate( 'Redirect Settings' ) }
					</Header>

					{ notice && (
						<Notice
							onDismissClick={ this.closeRedirectNotice }
							status={ this.getNoticeStatus( notice ) }
							text={ notice.text }
						/>
					) }

					<SectionHeader label={ translate( 'Redirect Settings' ) } />

					<Card className={ classes }>
						<form>
							<FormFieldset>
								<FormLabel htmlFor="site-redirect__input">{ translate( 'Redirect to' ) }</FormLabel>

								<FormTextInputWithAffixes
									disabled={ isFetching || isUpdating }
									name="destination"
									noWrap
									onChange={ this.handleChange }
									onFocus={ this.handleFocus }
									prefix="http://"
									value={ this.state.redirectUrl }
									id="site-redirect__input"
								/>

								<p className="site-redirect__explanation">
									{ translate(
										'All domains on this site will redirect here as long as this domain is set as your primary domain. ' +
											'{{learnMoreLink}}Learn more{{/learnMoreLink}}',
										{
											components: {
												learnMoreLink: (
													<a href={ SITE_REDIRECT } target="_blank" rel="noopener noreferrer" />
												),
											},
										}
									) }
								</p>
							</FormFieldset>

							<div>
								<FormButton disabled={ isFetching || isUpdating } onClick={ this.handleClick }>
									{ translate( 'Update Site Redirect' ) }
								</FormButton>

								<FormButton
									disabled={ isFetching || isUpdating }
									type="button"
									isPrimary={ false }
									onClick={ this.goToEdit }
								>
									{ translate( 'Cancel' ) }
								</FormButton>
							</div>
						</form>
					</Card>
				</Main>
			</div>
		);
	}

	goToEdit = () => {
		const { selectedDomainName, selectedSite, currentRoute } = this.props;

		this.props.recordCancelClick( selectedDomainName );
		page( domainManagementSiteRedirect( selectedSite.slug, selectedDomainName, currentRoute ) );
	};
}

const recordCancelClick = ( domainName ) =>
	composeAnalytics(
		recordGoogleEvent(
			'Domain Management',
			'Clicked "Cancel" Button in Site Redirect',
			'Domain Name',
			domainName
		),
		recordTracksEvent( 'calypso_domain_management_site_redirect_cancel_click', {
			domain_name: domainName,
		} )
	);

const recordLocationFocus = ( domainName ) =>
	composeAnalytics(
		recordGoogleEvent(
			'Domain Management',
			'Focused On "Location" Input in Site Redirect',
			'Domain Name',
			domainName
		),
		recordTracksEvent( 'calypso_domain_management_site_redirect_location_focus', {
			domain_name: domainName,
		} )
	);

const recordUpdateSiteRedirectClick = ( domainName, location, success ) =>
	composeAnalytics(
		recordGoogleEvent(
			'Domain Management',
			'Clicked "Update Site Redirect" Button in Site Redirect',
			'Domain Name',
			domainName
		),
		recordTracksEvent( 'calypso_domain_management_site_redirect_update_site_redirect_click', {
			domain_name: domainName,
			location,
			success,
		} )
	);

// eslint-disable-next-line react/display-name
const withLocationAsKey = createHigherOrderComponent( ( Wrapped ) => ( props ) => {
	const selectedSite = useSelector( getSelectedSite );
	const location = useSelector( ( state ) =>
		getSiteRedirectLocation( state, selectedSite?.domain )
	);

	return <Wrapped { ...props } key={ `redirect-${ location.value }` } />;
} );

export default connect(
	( state ) => {
		const selectedSite = getSelectedSite( state );
		const location = getSiteRedirectLocation( state, selectedSite.domain );
		const currentRoute = getCurrentRoute( state );
		return { selectedSite, location, currentRoute };
	},
	{
		fetchSiteRedirect,
		updateSiteRedirect,
		closeSiteRedirectNotice,
		recordCancelClick,
		recordLocationFocus,
		recordUpdateSiteRedirectClick,
	}
)( localize( withLocationAsKey( SiteRedirect ) ) );
