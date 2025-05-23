import { CompactCard } from '@automattic/components';
import { formatCurrency } from '@automattic/number-formatters';
import { useTranslate } from 'i18n-calypso';
import { useEffect, useState } from 'react';
import SiteIcon from 'calypso/blocks/site-icon';
import { useLocalizedMoment } from 'calypso/components/localized-moment';
import { MembershipSubscription } from 'calypso/lib/purchases/types';

import 'calypso/me/purchases/style.scss';

export const MembershipTerms = ( { subscription }: { subscription: MembershipSubscription } ) => {
	const translate = useTranslate();
	const moment = useLocalizedMoment();

	if ( subscription.end_date === null ) {
		return <>{ translate( 'Never expires' ) }</>;
	}

	return (
		<>
			{ subscription.renew_interval === null
				? translate( 'Expires on %(date)s', {
						args: {
							date: moment( subscription.end_date ).format( 'LL' ),
						},
				  } )
				: translate( 'Renews at %(amount)s on %(date)s', {
						args: {
							amount: formatCurrency( Number( subscription.renewal_price ), subscription.currency ),
							date: moment( subscription.end_date ).format( 'LL' ),
						},
				  } ) }
		</>
	);
};

export const SiteLink = ( { subscription }: { subscription: MembershipSubscription } ) => {
	const translate = useTranslate();
	const siteUrl = subscription.site_url.replace( /^https?:\/\//, '' );

	return (
		<button
			className="membership-item__site-name purchase-item__link"
			onClick={ ( event ) => {
				event.stopPropagation();
				event.preventDefault();
				window.location.href = subscription.site_url;
			} }
			title={ String(
				translate( 'Visit %(siteUrl)s', {
					args: {
						siteUrl: subscription.site_url,
					},
				} )
			) }
		>
			{ siteUrl }
		</button>
	);
};

export const MembershipType = ( { subscription }: { subscription: MembershipSubscription } ) => {
	const translate = useTranslate();

	if ( subscription.end_date === null ) {
		return (
			<>
				{ translate( 'Purchased from {{site}}{{/site}}', {
					components: {
						site: <SiteLink subscription={ subscription } />,
					},
				} ) }
			</>
		);
	}

	return (
		<>
			{ translate( 'Subscription to {{site}}{{/site}}', {
				components: {
					site: <SiteLink subscription={ subscription } />,
				},
			} ) }
		</>
	);
};

export const Icon = ( { subscription }: { subscription: MembershipSubscription } ) => {
	const [ hasError, setErrors ] = useState( false );
	const [ site, setSite ] = useState< { icon?: { ico: string } } >();
	const siteId = subscription.site_id;

	useEffect( () => {
		async function fetchData() {
			const data = await fetch( 'https://public-api.wordpress.com/rest/v1.1/sites/' + siteId );

			data
				.json()
				.then( ( data ) => {
					setSite( data );
				} )
				.catch( ( err ) => setErrors( err ) );
		}

		fetchData();
	}, [ siteId ] );

	if ( site && ! hasError && site.icon ) {
		return <img src={ site.icon.ico } width="36" height="36" alt="" />;
	}

	return <SiteIcon size={ 36 } />;
};

export default function MembershipItem( {
	subscription,
}: {
	subscription: MembershipSubscription;
} ) {
	const translate = useTranslate();

	return (
		<CompactCard
			className="membership-item"
			key={ subscription.ID }
			href={ '/me/purchases/other/' + subscription.ID }
		>
			<div className="membership-item__wrapper purchases-layout__wrapper">
				<div className="membership-item__site purchases-layout__site">
					<Icon subscription={ subscription } />
				</div>

				<div className="membership-item__information purchase-item__information purchases-layout__information">
					<div className="membership-item__title purchase-item__title">{ subscription.title }</div>
					<div className="membership-item__purchase-type purchase-item__purchase-type">
						<MembershipType subscription={ subscription } />
					</div>
				</div>

				<div className="membership-item__status purchase-item__status purchases-layout__status">
					<MembershipTerms subscription={ subscription } />
				</div>

				<div className="membership-item__payment-method purchase-item__payment-method purchases-layout__payment-method">
					{ translate( 'Credit card' ) }
				</div>
			</div>
		</CompactCard>
	);
}
