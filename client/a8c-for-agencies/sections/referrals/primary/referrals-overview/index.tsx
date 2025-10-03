import { useDesktopBreakpoint } from '@automattic/viewport-react';
import { Button } from '@wordpress/components';
import clsx from 'clsx';
import { useTranslate } from 'i18n-calypso';
import { useCallback, useRef, useState, useMemo } from 'react';
import {
	DATAVIEWS_TABLE,
	initialDataViewsState,
} from 'calypso/a8c-for-agencies/components/items-dashboard/constants';
import { DataViewsState } from 'calypso/a8c-for-agencies/components/items-dashboard/items-dataviews/interfaces';
import { LayoutWithGuidedTour as Layout } from 'calypso/a8c-for-agencies/components/layout/layout-with-guided-tour';
import LayoutTop from 'calypso/a8c-for-agencies/components/layout/layout-with-payment-notification';
import MobileSidebarNavigation from 'calypso/a8c-for-agencies/components/sidebar/mobile-sidebar-navigation';
import { A4A_MARKETPLACE_PRODUCTS_LINK } from 'calypso/a8c-for-agencies/components/sidebar-menu/lib/constants';
import {
	NEW_REFERRAL_ORDER_EMAIL_QUERY_PARAM_KEY,
	NEW_REFERRAL_ORDER_CHECKOUT_URL_QUERY_PARAM_KEY,
	NEW_REFERRAL_ORDER_FLOW_TYPE_QUERY_PARAM_KEY,
} from 'calypso/a8c-for-agencies/constants';
import useUrlQueryParam from 'calypso/a8c-for-agencies/hooks/use-url-query-param';
import {
	MARKETPLACE_TYPE_SESSION_STORAGE_KEY,
	MARKETPLACE_TYPE_REFERRAL,
} from 'calypso/a8c-for-agencies/sections/marketplace/hoc/with-marketplace-type';
import LayoutBody from 'calypso/layout/hosting-dashboard/body';
import LayoutColumn from 'calypso/layout/hosting-dashboard/column';
import LayoutHeader, {
	LayoutHeaderTitle as Title,
	LayoutHeaderActions as Actions,
} from 'calypso/layout/hosting-dashboard/header';
import { useDispatch, useSelector } from 'calypso/state';
import { hasApprovedAgencyStatus } from 'calypso/state/a8c-for-agencies/agency/selectors';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import MissingPaymentSettingsNotice from '../../common/missing-payment-settings-notice';
import useFetchReferrals from '../../hooks/use-fetch-referrals';
import useGetTipaltiPayee from '../../hooks/use-get-tipalti-payee';
import ReferralDetails from '../../referral-details';
import { ReferralOrderFlowType } from '../../types';
import LayoutBodyContent from './layout-body-content';
import NewReferralOrderNotification from './new-referral-order-notification';

import './style.scss';

export default function ReferralsOverview() {
	const translate = useTranslate();
	const dispatch = useDispatch();

	const isAgencyApproved = useSelector( hasApprovedAgencyStatus );

	const [ dataViewsState, setDataViewsState ] = useState< DataViewsState >( {
		...initialDataViewsState,
		fields: [
			'completed-orders',
			'pending-orders',
			'estimated-commissions',
			'subscription-status',
		],
		titleField: 'client',
	} );

	const { value: newReferralOrderEmail, setValue: setNewReferralOrderEmail } = useUrlQueryParam(
		NEW_REFERRAL_ORDER_EMAIL_QUERY_PARAM_KEY
	);

	const { value: newReferralFlowType, setValue: setNewReferralFlowType } = useUrlQueryParam(
		NEW_REFERRAL_ORDER_FLOW_TYPE_QUERY_PARAM_KEY
	);

	const { value: newReferralOrderCheckoutUrl, setValue: setNewReferralOrderCheckoutUrl } =
		useUrlQueryParam( NEW_REFERRAL_ORDER_CHECKOUT_URL_QUERY_PARAM_KEY );

	const isDesktop = useDesktopBreakpoint();

	const { data: tipaltiData, isFetching } = useGetTipaltiPayee();

	const wrapperRef = useRef< HTMLButtonElement | null >( null );

	const { data: referrals, isFetching: isFetchingReferrals } = useFetchReferrals();

	const hasReferrals = !! referrals?.length;

	// To ensure the selected item is updated when the referrals list is updated
	// as we optimistically update the referrals list
	const selectedItem = useMemo(
		() =>
			dataViewsState.selectedItem &&
			referrals?.find( ( referral ) => referral.id === dataViewsState.selectedItem?.id ),
		[ dataViewsState.selectedItem, referrals ]
	);
	const updatedDataViewsState = useMemo( () => {
		return {
			...dataViewsState,
			selectedItem,
		};
	}, [ dataViewsState, selectedItem ] );

	const title =
		isDesktop && ! selectedItem
			? translate( 'Your referrals and commissions' )
			: translate( 'Referrals' );

	const makeAReferral = useCallback( () => {
		sessionStorage.setItem( MARKETPLACE_TYPE_SESSION_STORAGE_KEY, MARKETPLACE_TYPE_REFERRAL );
		dispatch( recordTracksEvent( 'calypso_a4a_referrals_make_a_referral_button_click' ) );
	}, [ dispatch ] );

	const isLoading = isFetching || isFetchingReferrals;

	return (
		<Layout
			className={ clsx( 'referrals-layout', {
				'full-width-layout-with-table': hasReferrals,
				'referrals-layout--has-selected': selectedItem,
			} ) }
			title={ title }
			wide
			withBorder
		>
			<LayoutColumn wide className="referrals-layout__column">
				<LayoutTop isFullWidth={ hasReferrals }>
					{ !! newReferralOrderEmail && (
						<NewReferralOrderNotification
							referralOrderEmail={ newReferralOrderEmail }
							referralOrderCheckoutUrl={ newReferralOrderCheckoutUrl }
							onClose={ () => {
								setNewReferralOrderEmail( '' );
								setNewReferralFlowType( '' );
								setNewReferralOrderCheckoutUrl( '' );
							} }
							isFullWidth={ hasReferrals }
							flowType={ newReferralFlowType as ReferralOrderFlowType }
						/>
					) }

					<MissingPaymentSettingsNotice isFullWidth />

					<LayoutHeader>
						<Title>{ title } </Title>

						<Actions>
							<MobileSidebarNavigation />
							{ isAgencyApproved && (
								<Button
									variant="primary"
									href={ A4A_MARKETPLACE_PRODUCTS_LINK }
									onClick={ makeAReferral }
									ref={ wrapperRef }
								>
									{ hasReferrals ? translate( 'New referral' ) : translate( 'Make a referral' ) }
								</Button>
							) }
						</Actions>
					</LayoutHeader>
				</LayoutTop>

				<LayoutBody>
					<LayoutBodyContent
						tipaltiData={ tipaltiData }
						referrals={ referrals }
						isLoading={ isLoading }
						dataViewsState={ updatedDataViewsState }
						setDataViewsState={ setDataViewsState }
					/>
				</LayoutBody>
			</LayoutColumn>
			{ selectedItem && (
				<LayoutColumn wide>
					<ReferralDetails
						referral={ selectedItem }
						closeSitePreviewPane={ () =>
							setDataViewsState( {
								...dataViewsState,
								type: DATAVIEWS_TABLE,
								selectedItem: undefined,
							} )
						}
					/>
				</LayoutColumn>
			) }
		</Layout>
	);
}
