import page from '@automattic/calypso-router';
import { getUrlParts } from '@automattic/calypso-url';
import { Badge, Button, Gridicon } from '@automattic/components';
import { getQueryArg, removeQueryArgs } from '@wordpress/url';
import clsx from 'clsx';
import { useTranslate } from 'i18n-calypso';
import { useCallback, useEffect, useState, useContext, useRef } from 'react';
import useShowFeedback from 'calypso/a8c-for-agencies/components/a4a-feedback/hooks/use-show-a4a-feedback';
import { FeedbackType } from 'calypso/a8c-for-agencies/components/a4a-feedback/types';
import A4APopover from 'calypso/a8c-for-agencies/components/a4a-popover';
import {
	A4A_SITES_LINK_NEEDS_SETUP,
	A4A_FEEDBACK_LINK,
	A4A_LICENSES_LINK,
} from 'calypso/a8c-for-agencies/components/sidebar-menu/lib/constants';
import {
	isPressableHostingProduct,
	isWPCOMHostingProduct,
} from 'calypso/a8c-for-agencies/sections/marketplace/lib/hosting';
import ClientSite from 'calypso/a8c-for-agencies/sections/sites/needs-setup-sites/client-site';
import FormattedDate from 'calypso/components/formatted-date';
import getLicenseState from 'calypso/jetpack-cloud/sections/partner-portal/lib/get-license-state';
import LicenseListItem from 'calypso/jetpack-cloud/sections/partner-portal/license-list-item';
import {
	LicenseState,
	LicenseFilter,
	LicenseType,
} from 'calypso/jetpack-cloud/sections/partner-portal/types';
import { addQueryArgs } from 'calypso/lib/url';
import { useDispatch, useSelector } from 'calypso/state';
import { isAgencyOwner } from 'calypso/state/a8c-for-agencies/agency/selectors';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import { infoNotice, errorNotice } from 'calypso/state/notices/actions';
import { getSite } from 'calypso/state/sites/selectors';
import usePaymentMethod from '../../payment-methods/hooks/use-payment-method';
import LicenseDetails from '../license-details';
import BundleDetails from '../license-details/bundle-details';
import LicensesOverviewContext from '../licenses-overview/context';
import LicenseActions from './license-actions';
import LicenseBundleDropDown from './license-bundle-dropdown';
import type { ReferralAPIResponse } from 'calypso/a8c-for-agencies/sections/referrals/types';
import type { License, LicenseMeta } from 'calypso/state/partner-portal/types';

import './style.scss';

interface Props {
	license: License;
	licenseType: LicenseType;
	parentLicenseId?: number | null;
	productName: string;
	quantity?: number | null;
	isChildLicense?: boolean;
	meta?: LicenseMeta;
	referral?: ReferralAPIResponse | null;
	productId: number;
}

export const ManageInPressable = ( { attachedAt }: { attachedAt: string | null } ) => {
	const translate = useTranslate();

	const { isFeedbackShown } = useShowFeedback( FeedbackType.PurchaseCompleted, attachedAt );
	const isOwner = useSelector( isAgencyOwner );

	return isOwner ? (
		<a
			className="license-preview__product-pressable-link"
			target="_blank"
			rel="norefferer noopener noreferrer"
			href="https://my.pressable.com/agency/auth"
			onClick={ () => {
				if ( ! isFeedbackShown ) {
					page.redirect(
						addQueryArgs(
							{
								type: FeedbackType.PurchaseCompleted,
								redirectUrl: A4A_LICENSES_LINK,
							},
							A4A_FEEDBACK_LINK
						)
					);
				}
			} }
		>
			{ translate( 'Manage in Pressable ↗' ) }
		</a>
	) : (
		translate( 'Managed by agency owner' )
	);
};

export default function LicensePreview( {
	license,
	licenseType,
	parentLicenseId,
	productName,
	quantity,
	isChildLicense,
	meta,
	referral,
	productId,
}: Props ) {
	const licenseKey = license.licenseKey;
	const blogId = license.blogId;
	const siteUrl = license.siteUrl;
	const issuedAt = license.issuedAt;
	const attachedAt = license.attachedAt;
	const revokedAt = license.revokedAt;

	const translate = useTranslate();
	const dispatch = useDispatch();

	const site = useSelector( ( state ) => getSite( state, blogId as number ) );
	const isPressableLicense = isPressableHostingProduct( licenseKey );
	const isWPCOMLicense = isWPCOMHostingProduct( licenseKey );

	const isOwner = useSelector( isAgencyOwner );

	const { filter } = useContext( LicensesOverviewContext );

	const isHighlighted = getQueryArg( window.location.href, 'highlight' ) === licenseKey;

	const [ isOpen, setOpen ] = useState( isHighlighted );

	const open = useCallback( () => {
		setOpen( ! isOpen );
		dispatch( recordTracksEvent( 'calypso_a4a_license_list_preview_toggle' ) );
	}, [ dispatch, isOpen ] );

	const onCopyLicense = useCallback( () => {
		dispatch( infoNotice( translate( 'License copied!' ), { duration: 2000 } ) );
		dispatch( recordTracksEvent( 'calypso_a4a_license_list_copy_license_click' ) );
	}, [ dispatch, translate ] );

	const { paymentMethodRequired } = usePaymentMethod();
	const licenseState = getLicenseState( attachedAt, revokedAt );
	const domain = siteUrl && ! isPressableLicense ? getUrlParts( siteUrl ).hostname || siteUrl : '';

	const assign = useCallback( () => {
		const redirectUrl = isWPCOMLicense
			? A4A_SITES_LINK_NEEDS_SETUP
			: addQueryArgs( { key: licenseKey }, '/marketplace/assign-license' );
		if ( paymentMethodRequired && ! referral ) {
			const noticeLinkHref = addQueryArgs(
				{
					return: redirectUrl,
				},
				'/purchases/payment-methods/add'
			);
			const errorMessage = translate(
				'A primary payment method is required.{{br/}} ' +
					'{{a}}Try adding a new payment method{{/a}} or contact support.',
				{
					components: {
						a: <a href={ noticeLinkHref } />,
						br: <br />,
					},
				}
			);

			dispatch( errorNotice( errorMessage ) );
			return;
		}

		page.redirect( redirectUrl );
	}, [ isWPCOMLicense, licenseKey, paymentMethodRequired, referral, translate, dispatch ] );

	useEffect( () => {
		if ( isHighlighted ) {
			page.redirect(
				removeQueryArgs( window.location.pathname + window.location.search, 'highlight' )
			);
		}
	}, [ isHighlighted ] );

	const isParentLicense = quantity && parentLicenseId;

	const isSiteAtomic = site?.is_wpcom_atomic;

	const bundleCountContent = quantity && (
		<Badge className="license-preview__license-count" type="info">
			{ translate( '%(quantity)d License Bundle', {
				context: 'bundle license count',
				args: {
					quantity,
				},
			} ) }
		</Badge>
	);

	const shouldShowTransferredBadge = () => {
		const transferredDate = meta?.transferredSubscriptionExpiration;

		if ( ! transferredDate ) {
			return false;
		}

		// Only show the badge from now until 60 days after the transferred date.
		const sixtyDaysAfter = new Date( transferredDate );
		sixtyDaysAfter.setDate( sixtyDaysAfter.getDate() + 60 );
		return new Date() < sixtyDaysAfter;
	};

	const TransferredBadge = () => {
		const [ showPopover, setShowPopover ] = useState( false );
		const wrapperRef = useRef< HTMLSpanElement | null >( null );

		return (
			<span
				className="license-preview__migration-wrapper"
				onClick={ () => setShowPopover( true ) }
				role="button"
				tabIndex={ 0 }
				ref={ wrapperRef }
				onKeyDown={ ( event ) => {
					if ( event.key === 'Enter' ) {
						setShowPopover( true );
					}
				} }
			>
				<Badge className="license-preview__migration-badge" type="info-green">
					{ translate( 'Transferred' ) }
				</Badge>
				{ showPopover && (
					<A4APopover
						title=""
						offset={ 12 }
						wrapperRef={ wrapperRef }
						onFocusOutside={ () => setShowPopover( false ) }
					>
						<div className="license-preview__migration-content">
							{ translate(
								"Your plan is now with Automattic for Agencies. You won't be billed until {{bold}}%(date)s{{/bold}}.{{br/}}{{a}}Learn about billing for transferred sites{{icon/}}{{/a}}",
								{
									components: {
										bold: <strong />,
										br: <br />,
										a: (
											<a
												href="https://agencieshelp.automattic.com/knowledge-base/moving-existing-wordpress-com-plans-into-the-automattic-for-agencies-billing-system/"
												target="_blank"
												rel="noreferrer noopener"
											/>
										),
										icon: (
											<Gridicon
												icon="external"
												size={ 16 }
												className="license-preview__migration-external-icon"
											/>
										),
									},
									args: {
										date: meta?.transferredSubscriptionExpiration ?? '',
									},
								}
							) }
						</div>
					</A4APopover>
				) }
			</span>
		);
	};

	// TODO: We are removing Creator's product name in the frontend because we want to leave it in the backend for the time being,
	//       We have to refactor this once we have updates. Context: p1714663834375719-slack-C06JY8QL0TU
	const productTitle = licenseKey.startsWith( 'wpcom-hosting-business' )
		? translate( 'WordPress.com Site' )
		: productName;

	const isDevelopmentSite = Boolean( meta?.isDevSite );

	return (
		<div
			className={ clsx( {
				'license-preview': true,
				'license-preview--is-open': isOpen && ! isChildLicense,
			} ) }
		>
			<LicenseListItem
				className={ clsx( {
					'license-preview__card': true,
					'license-preview__card--is-detached': licenseState === LicenseState.Detached,
					'license-preview__card--is-revoked': licenseState === LicenseState.Revoked,
					'license-preview__card--child-license': isChildLicense,
				} ) }
			>
				<div>
					<span className="license-preview__product">
						<div className="license-preview__product-title">
							{ productTitle }
							{ referral && (
								<Badge className="license-preview__client-badge" type="info">
									{ translate( 'Referral' ) }
								</Badge>
							) }
						</div>
						{ referral && (
							<div className="license-preview__client-email">
								<ClientSite referral={ referral } />
							</div>
						) }
					</span>
				</div>

				<div>
					{ quantity ? (
						<div className="license-preview__bundle">
							<Gridicon icon="minus" className="license-preview__no-value" />
							<div className="license-preview__product-small">{ productName }</div>
							<div>{ bundleCountContent }</div>
						</div>
					) : (
						<>
							<div className="license-preview__product-small">{ productName }</div>
							{ domain }
							{ isPressableLicense && ! revokedAt && (
								<ManageInPressable attachedAt={ attachedAt } />
							) }
							{ ! domain && licenseState === LicenseState.Detached && (
								<span className="license-preview__unassigned">
									<Badge type="warning">{ translate( 'Unassigned' ) }</Badge>
									{ licenseType === LicenseType.Partner && (
										<Button
											className="license-preview__assign-button"
											borderless
											compact
											onClick={ assign }
										>
											{ isWPCOMLicense ? translate( 'Create site' ) : translate( 'Assign' ) }
										</Button>
									) }
								</span>
							) }
							{ revokedAt && (
								<span>
									<Badge type="error">{ translate( 'Revoked' ) }</Badge>
								</span>
							) }
						</>
					) }
				</div>

				<div>
					{ quantity ? (
						<Gridicon icon="minus" className="license-preview__no-value" />
					) : (
						<>
							<div className="license-preview__label">{ translate( 'Issued on:' ) }</div>

							<FormattedDate date={ issuedAt } format="YYYY-MM-DD" />
						</>
					) }
				</div>

				{ filter !== LicenseFilter.Revoked ? (
					<div>
						<div className="license-preview__label">{ translate( 'Assigned on:' ) }</div>

						{ licenseState === LicenseState.Attached && (
							<FormattedDate date={ attachedAt } format="YYYY-MM-DD" />
						) }

						{ licenseState !== LicenseState.Attached && (
							<Gridicon icon="minus" className="license-preview__no-value" />
						) }
					</div>
				) : (
					<div>
						<div className="license-preview__label">{ translate( 'Revoked on:' ) }</div>

						{ licenseState === LicenseState.Revoked && (
							<FormattedDate date={ revokedAt } format="YYYY-MM-DD" />
						) }

						{ licenseState !== LicenseState.Revoked && (
							<Gridicon icon="minus" className="license-preview__no-value" />
						) }
					</div>
				) }

				<div className="license-preview__badge-container">
					{ !! isParentLicense && bundleCountContent }
					{ isDevelopmentSite && <Badge type="info-purple">{ translate( 'Development' ) }</Badge> }
					{ shouldShowTransferredBadge() && <TransferredBadge /> }
				</div>

				<div>
					{ !! isParentLicense && ! revokedAt && (
						<LicenseBundleDropDown
							productName={ productName }
							licenseKey={ licenseKey }
							bundleSize={ quantity }
							productId={ productId }
							isClientLicense={ !! referral }
						/>
					) }
					{ isWPCOMLicense && isSiteAtomic ? (
						<LicenseActions
							siteUrl={ siteUrl }
							isDevSite={ isDevelopmentSite }
							attachedAt={ attachedAt }
							revokedAt={ revokedAt }
							licenseType={ licenseType }
							isChildLicense={ isChildLicense }
							isClientLicense={ !! referral }
							productName={ productName }
							licenseKey={ licenseKey }
							productId={ productId }
						/>
					) : (
						/*
						 * For all pressable licenses, only the owner has access to the action,
						 * so only show the actions if you are the owner or if this is not a pressable license.
						 */
						( isOwner || ! isPressableLicense ) && (
							<Button onClick={ open } className="license-preview__toggle" borderless>
								<Gridicon icon={ isOpen ? 'chevron-up' : 'chevron-down' } />
							</Button>
						)
					) }
				</div>
			</LicenseListItem>
			{ isOpen &&
				( isParentLicense ? (
					<BundleDetails parentLicenseId={ parentLicenseId } />
				) : (
					<LicenseDetails
						license={ license }
						onCopyLicense={ onCopyLicense }
						licenseType={ licenseType }
						isChildLicense={ isChildLicense }
						referral={ referral }
						isDevSite={ isDevelopmentSite }
					/>
				) ) }
		</div>
	);
}

export function LicensePreviewPlaceholder() {
	const translate = useTranslate();

	return (
		<div className="license-preview license-preview--placeholder">
			<LicenseListItem className="license-preview__card">
				<div>
					<h3 className="license-preview__domain">{ translate( 'Loading' ) }</h3>

					<div className="license-preview__product" />
				</div>

				<div>
					<div className="license-preview__label">{ translate( 'Issued on:' ) }</div>

					<div />
				</div>

				<div>
					<div className="license-preview__label">{ translate( 'Assigned on:' ) }</div>

					<div />
				</div>

				<div>
					<div className="license-preview__label">{ translate( 'Revoked on:' ) }</div>

					<div />
				</div>

				<div>
					<div className="license-preview__copy-license-key" />
				</div>

				<div />
			</LicenseListItem>
		</div>
	);
}
