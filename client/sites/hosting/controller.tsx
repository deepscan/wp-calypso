import { isEnabled } from '@automattic/calypso-config';
import { FEATURE_SFTP } from '@automattic/calypso-products';
import { CalloutOverlay } from 'calypso/dashboard/components/callout-overlay';
import PageLayout from 'calypso/dashboard/components/page-layout';
import PageViewTracker from 'calypso/lib/analytics/page-view-tracker';
import { getSelectedSite } from 'calypso/state/ui/selectors';
import { getRouteFromContext } from 'calypso/utils';
import { HostingActivationCallout, HostingUpsellCallout } from './components/hosting-callout';
import HostingFeatures from './components/hosting-features';
import { areHostingFeaturesSupported } from './features';
import type { Context, Context as PageJSContext } from '@automattic/calypso-router';
import type { ComponentType } from 'react';

export function hostingFeatures( context: PageJSContext, next: () => void ) {
	const state = context.store.getState();
	const site = getSelectedSite( state );

	let content;
	if ( isEnabled( 'hosting/hosting-features-callout' ) && site ) {
		const hasSftpFeature =
			! site.plan?.expired && site.plan?.features.active.includes( FEATURE_SFTP );
		const shouldShowActivationCallout = ! site.is_wpcom_atomic && hasSftpFeature;

		let redirectUrl = context.query.redirect_to;
		if ( redirectUrl ) {
			redirectUrl = hasSftpFeature ? `/hosting-config/${ site.slug }` : `/overview/${ site.slug }`;
		}

		content = (
			<>
				<PageViewTracker title="Sites > Hosting Features" path={ getRouteFromContext( context ) } />
				<PageLayout>
					<CalloutOverlay
						showCallout
						callout={
							shouldShowActivationCallout ? (
								<HostingActivationCallout siteId={ site.ID } redirectUrl={ redirectUrl } />
							) : (
								<HostingUpsellCallout siteSlug={ site.slug } />
							)
						}
						main={ null }
					/>
				</PageLayout>
			</>
		);
	} else {
		content = <HostingFeatures />;
	}

	context.primary = (
		<>
			<PageViewTracker title="Sites > Hosting Features" path={ getRouteFromContext( context ) } />
			{ content }
		</>
	);

	next();
}

export function hostingFeaturesCallout(
	CalloutComponent: ComponentType< {
		siteSlug: string;
		titleAs?: React.ElementType | keyof JSX.IntrinsicElements;
	} >
) {
	return ( context: Context, next: () => void ) => {
		const state = context.store.getState();
		const site = getSelectedSite( state );

		if (
			site &&
			! areHostingFeaturesSupported( site ) &&
			isEnabled( 'hosting/hosting-features-callout' )
		) {
			const callout =
				! site.is_wpcom_atomic &&
				! site.plan?.expired &&
				site.plan?.features.active.includes( FEATURE_SFTP ) ? (
					<HostingActivationCallout siteId={ site.ID } />
				) : (
					<CalloutComponent siteSlug={ site.slug } titleAs="h3" />
				);

			context.primary = (
				<PageLayout>
					<CalloutOverlay showCallout callout={ callout } main={ null } />
				</PageLayout>
			);
		}

		next();
	};
}
