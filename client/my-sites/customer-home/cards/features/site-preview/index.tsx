import { Button, ExternalLink } from '@automattic/components';
import { useMobileBreakpoint } from '@automattic/viewport-react';
import { useI18n } from '@wordpress/react-i18n';
import { addQueryArgs } from '@wordpress/url';
import clsx from 'clsx';
import { ReactNode } from 'react';
import withIsFSEActive from 'calypso/data/themes/with-is-fse-active';
import { recordTracksEvent } from 'calypso/lib/analytics/tracks';
import { Truncated } from 'calypso/sites-dashboard/components/sites-site-url';
import { useSelector } from 'calypso/state';
import { canCurrentUser } from 'calypso/state/selectors/can-current-user';
import { createSiteDomainObject } from 'calypso/state/sites/domains/assembler';
import { getDomainsBySiteId } from 'calypso/state/sites/domains/selectors';
import { getSelectedSite } from 'calypso/state/ui/selectors';
import { SitePreviewEllipsisMenu } from './site-preview-ellipsis-menu';
import './style.scss';

interface ThumbnailWrapperProps {
	showEditSite: boolean;
	editSiteURL: string;
	children?: ReactNode;
}
const ThumbnailWrapper = ( { showEditSite, editSiteURL, children }: ThumbnailWrapperProps ) => {
	const classes = clsx( 'home-site-preview__thumbnail-wrapper', {
		'home-site-preview__remove-pointer': ! showEditSite,
	} );

	if ( ! showEditSite ) {
		return <div className={ classes }> { children } </div>;
	}

	return (
		<a
			onClick={ ( event ) => {
				event.preventDefault();

				recordTracksEvent( 'calypso_customer_home_site_preview_clicked', {
					context: 'customer-home',
				} );

				window.location.href = event.currentTarget.href;
			} }
			className={ classes }
			href={ editSiteURL }
		>
			{ children }
		</a>
	);
};

interface SitePreviewProps {
	isFSEActive: boolean;
	showEditSite?: boolean;
	showSiteDetails?: boolean;
}

const SitePreview = ( {
	isFSEActive,
	showEditSite = true,
	showSiteDetails = true,
}: SitePreviewProps ): JSX.Element => {
	const { __ } = useI18n();
	const selectedSite = useSelector( getSelectedSite );
	const canManageSite = useSelector( ( state ) =>
		canCurrentUser( state, selectedSite?.ID ?? 0, 'manage_options' )
	);
	const isMobile = useMobileBreakpoint();

	const customDomains = useSelector( ( state ) =>
		getDomainsBySiteId( state, selectedSite?.ID ?? 0 )
	);

	if ( isMobile ) {
		return <></>;
	}

	const shouldShowEditSite =
		Boolean( selectedSite ) && isFSEActive && showEditSite && canManageSite;

	const editSiteURL = selectedSite
		? addQueryArgs( `/site-editor/${ selectedSite.slug }`, {
				canvas: 'edit',
		  } )
		: '#';

	const domains = customDomains.map( createSiteDomainObject );

	const nonWpcomDomains = domains.filter( ( domain ) => ! domain.isWPCOMDomain );

	const siteDomain = nonWpcomDomains?.length ? nonWpcomDomains[ 0 ].domain : selectedSite?.slug;

	// We use an iframe rather than mShot to not cache changes.
	const iframeSrcKeepHomepage = selectedSite
		? `//${ selectedSite.slug }/?hide_banners=true&preview_overlay=true&preview=true&iframe=true`
		: '#';

	const selectedSiteURL = selectedSite ? selectedSite.URL : '#';
	const selectedSiteName = selectedSite ? selectedSite.name : '&nbsp;';

	return (
		<div className="home-site-preview customer-home__card is-full-width">
			<ThumbnailWrapper showEditSite={ shouldShowEditSite } editSiteURL={ editSiteURL }>
				{ shouldShowEditSite && (
					<Button primary className="home-site-preview__thumbnail-label">
						{ __( 'Edit site' ) }
					</Button>
				) }
				<div className="home-site-preview__thumbnail">
					{ selectedSite ? (
						<iframe
							// Enabling sandbox disables most features, such as autoplay,
							// alerts, popups, fullscreen, etc.
							sandbox="allow-scripts allow-same-origin"
							// Officially deprecated, but still widely supported. Hides
							// scrollbars in case they are set to always visible.
							scrolling="no"
							loading="lazy"
							// @ts-expect-error For some reason there's no inert type.
							inert="true"
							title={ __( 'Site Preview' ) }
							src={ iframeSrcKeepHomepage }
						/>
					) : (
						<div className="home-site-preview__thumbnail-placeholder" />
					) }
				</div>
			</ThumbnailWrapper>
			{ showSiteDetails && (
				<div className="home-site-preview__action-bar">
					<div className="home-site-preview__site-info">
						<h2 className="home-site-preview__info-title">{ selectedSiteName }</h2>
						<ExternalLink
							href={ selectedSiteURL }
							className="home-site-preview__info-domain"
							localizeUrl={ false }
						>
							<Truncated>{ siteDomain }</Truncated>
						</ExternalLink>
					</div>
					<SitePreviewEllipsisMenu />
				</div>
			) }
		</div>
	);
};

export default withIsFSEActive( SitePreview );
