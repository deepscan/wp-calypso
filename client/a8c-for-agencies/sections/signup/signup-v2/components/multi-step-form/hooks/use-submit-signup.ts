import { isEnabled } from '@automattic/calypso-config';
import page from '@automattic/calypso-router';
import { useCallback, useEffect } from 'react';
import { ONBOARDING_TOUR_HASH } from 'calypso/a8c-for-agencies/components/hoc/with-onboarding-tour/hooks/use-onboarding-tour';
import { A4A_OVERVIEW_LINK } from 'calypso/a8c-for-agencies/components/sidebar-menu/lib/constants';
import useCreateAgencyMutation from 'calypso/a8c-for-agencies/sections/signup/agency-details-form/hooks/use-create-agency-mutation';
import { saveSignupDataToLocalStorage } from 'calypso/a8c-for-agencies/sections/signup/lib/signup-data-to-local-storage';
import { useHandleWPCOMRedirect } from 'calypso/a8c-for-agencies/sections/signup/signup-form/hooks/use-handle-wpcom-redirect';
import { AgencyDetailsSignupPayload } from 'calypso/a8c-for-agencies/sections/signup/types';
import { useDispatch, useSelector } from 'calypso/state';
import { fetchAgencies } from 'calypso/state/a8c-for-agencies/agency/actions';
import { getActiveAgency } from 'calypso/state/a8c-for-agencies/agency/selectors';
import { APIError } from 'calypso/state/a8c-for-agencies/types';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import { isUserLoggedIn } from 'calypso/state/current-user/selectors';
import { errorNotice, removeNotice } from 'calypso/state/notices/actions';

export default function useSubmitSignup() {
	const dispatch = useDispatch();

	const notificationId = 'a4a-agency-signup-form';

	const queryParams = new URLSearchParams( window.location.search );
	const referer = queryParams.get( 'ref' );
	const userLoggedIn = useSelector( isUserLoggedIn );
	const shouldRedirectToWPCOM = ! userLoggedIn;
	const handleWPCOMRedirect = useHandleWPCOMRedirect();

	const currentAgency = useSelector( getActiveAgency );

	const createAgency = useCreateAgencyMutation( {
		onSuccess: () => {
			dispatch( fetchAgencies() );
		},
		onError: ( error: APIError ) => {
			dispatch( errorNotice( error?.message, { id: notificationId } ) );
		},
	} );

	useEffect( () => {
		if ( currentAgency ) {
			if ( isEnabled( 'a4a-unified-onboarding-tour' ) ) {
				page.redirect( `${ A4A_OVERVIEW_LINK }${ ONBOARDING_TOUR_HASH }` );
			} else {
				page.redirect( A4A_OVERVIEW_LINK );
			}
		}
	}, [ createAgency.isSuccess, currentAgency, dispatch ] );

	return useCallback(
		async ( payload: AgencyDetailsSignupPayload ) => {
			dispatch( removeNotice( notificationId ) );
			const data = {
				...payload,
				referer,
				phone: { phoneNumberFull: payload.phoneNumber, phoneNumber: payload.phoneNumber },
			};

			if ( shouldRedirectToWPCOM ) {
				saveSignupDataToLocalStorage( data );
				handleWPCOMRedirect( data );
				return;
			}

			createAgency.mutate( data );

			dispatch(
				recordTracksEvent( 'calypso_a4a_create_agency_submit', {
					first_name: payload.firstName,
					last_name: payload.lastName,
					name: payload.agencyName,
					business_url: payload.agencyUrl,
					agency_size: payload.agencySize,
					managed_sites: payload.managedSites,
					user_type: payload.userType,
					initial_source: payload.initialSource,
					services_offered: ( payload.servicesOffered || [] ).join( ',' ),
					products_offered: ( payload.productsOffered || [] ).join( ',' ),
					products_to_offer: ( payload.productsToOffer || [] ).join( ',' ),
					expansion_planned: payload.plansToOfferProducts,
					city: payload.city,
					line1: payload.line1,
					line2: payload.line2,
					country: payload.country,
					postal_code: payload.postalCode,
					state: payload.state,
					referer,
					phone_number: payload.phoneNumber ?? '',
				} )
			);
		},
		[ dispatch, shouldRedirectToWPCOM, createAgency, referer, handleWPCOMRedirect ]
	);
}
