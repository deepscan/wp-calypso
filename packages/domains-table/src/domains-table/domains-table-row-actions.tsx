import page from '@automattic/calypso-router';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { useI18n } from '@wordpress/react-i18n';
import React, { ComponentType } from 'react';
import { canSetAsPrimary } from '../utils/can-set-as-primary';
import { type as domainTypes, transferStatus, useMyDomainInputMode } from '../utils/constants';
import { isFreeUrlDomainName } from '../utils/is-free-url-domain-name';
import { isDomainInGracePeriod } from '../utils/is-in-grace-period';
import { isRecentlyRegistered } from '../utils/is-recently-registered';
import { isDomainRenewable } from '../utils/is-renewable';
import { isDomainUpdateable } from '../utils/is-updateable';
import {
	domainManagementDNS,
	domainManagementEditContactInfo,
	domainManagementLink,
	domainManagementTransferToOtherSiteLink,
	domainOnlySiteCreationLink,
	domainUseMyDomain,
} from '../utils/paths';
import { shouldUpgradeToMakeDomainPrimary } from '../utils/should-upgrade-to-make-domain-primary';
import { ResponseDomain } from '../utils/types';
import { useDomainsTable, DomainsTableContext } from './domains-table';

export type DomainAction = 'change-site-address' | 'manage-dns-settings' | 'set-primary-address';

interface MenuItemLinkProps extends Omit< React.ComponentProps< typeof MenuItem >, 'href' > {
	href?: string;
}

const MenuItemLink = MenuItem as ComponentType< MenuItemLinkProps >;

interface DomainsTableRowActionsProps {
	siteSlug: string;
	domain: ResponseDomain;
	isAllSitesView: boolean;
	canSetPrimaryDomainForSite: boolean;
	isSiteOnFreePlan: boolean;
	isSimpleSite: boolean;
	isHostingOverview?: boolean;
	context?: DomainsTableContext;
}

export const DomainsTableRowActions = ( {
	domain,
	siteSlug,
	isAllSitesView,
	canSetPrimaryDomainForSite,
	isSiteOnFreePlan,
	isSimpleSite,
	isHostingOverview,
	context,
}: DomainsTableRowActionsProps ) => {
	const {
		onDomainAction,
		userCanSetPrimaryDomains = false,
		updatingDomain,
		domainStatusPurchaseActions,
		hasConnectableSites,
	} = useDomainsTable();
	const { __ } = useI18n();

	const canViewDetails = domain.type !== domainTypes.WPCOM;
	const canConnectDomainToASite = isAllSitesView && domain.currentUserCanCreateSiteFromDomainOnly;
	const canManageDNS =
		domain.canManageDnsRecords &&
		domain.transferStatus !== transferStatus.PENDING_ASYNC &&
		domain.type !== domainTypes.SITE_REDIRECT;
	const canManageContactInfo =
		domain.type === domainTypes.REGISTERED &&
		( isDomainUpdateable( domain ) || isDomainInGracePeriod( domain ) );
	const canMakePrimarySiteAddress =
		! isAllSitesView &&
		canSetAsPrimary(
			domain,
			shouldUpgradeToMakeDomainPrimary( domain, {
				isDomainOnly: domain.currentUserCanCreateSiteFromDomainOnly,
				canSetPrimaryDomainForSite,
				userCanSetPrimaryDomains,
				isSiteOnFreePlan,
			} )
		) &&
		! isRecentlyRegistered( domain.registrationDate );
	const canTransferToWPCOM =
		domain.type === domainTypes.MAPPED && domain.isEligibleForInboundTransfer;
	const canChangeSiteAddress =
		! isAllSitesView && isSimpleSite && isFreeUrlDomainName( domain.name );
	const canRenewDomain = isDomainRenewable( domain );
	const handleMenuItemClick = ( event: React.MouseEvent ) => {
		const url = ( event.target as HTMLElement ).parentElement?.getAttribute( 'href' );

		if ( url ) {
			event.preventDefault();
			page( url );
		}
	};

	const getActions = ( onClose?: () => void ) => {
		return [
			canViewDetails && (
				<MenuItemLink
					key="actionDetails"
					onClick={ handleMenuItemClick }
					href={ domainManagementLink(
						domain,
						siteSlug,
						isAllSitesView,
						undefined,
						isHostingOverview
					) }
				>
					{ domain.type === domainTypes.TRANSFER ? __( 'View transfer' ) : __( 'View settings' ) }
				</MenuItemLink>
			),
			canManageDNS && (
				<MenuItemLink
					key="manageDNS"
					onClick={ ( event ) => {
						onDomainAction?.( 'manage-dns-settings', domain );
						handleMenuItemClick( event );
					} }
					href={ domainManagementDNS( siteSlug, domain.name, context ) }
				>
					{ __( 'Manage DNS' ) }
				</MenuItemLink>
			),
			canManageContactInfo && (
				<MenuItemLink
					key="manageContactInfo"
					onClick={ handleMenuItemClick }
					href={ domainManagementEditContactInfo( siteSlug, domain.name, null, context ) }
				>
					{ __( 'Manage contact information' ) }
				</MenuItemLink>
			),
			canMakePrimarySiteAddress && (
				<MenuItemLink
					key="makePrimarySiteAddress"
					onClick={ () => {
						onDomainAction?.( 'set-primary-address', domain );
						onClose?.();
					} }
					disabled={ updatingDomain?.action === 'set-primary-address' }
				>
					{ __( 'Make primary site address' ) }
				</MenuItemLink>
			),
			canTransferToWPCOM && (
				<MenuItemLink
					key="transferToWPCOM"
					onClick={ handleMenuItemClick }
					href={ domainUseMyDomain( siteSlug, domain.name, useMyDomainInputMode.transferDomain ) }
				>
					{ __( 'Transfer to WordPress.com' ) }
				</MenuItemLink>
			),
			canConnectDomainToASite && (
				<MenuItemLink
					key="connectToSite"
					href={
						hasConnectableSites
							? domainManagementTransferToOtherSiteLink( siteSlug, domain.domain )
							: domainOnlySiteCreationLink( siteSlug, domain.blogId )
					}
					data-testid="add-site-menu-link"
				>
					{ __( 'Add site' ) }
				</MenuItemLink>
			),
			canChangeSiteAddress && (
				<MenuItemLink
					key="changeSiteAddress"
					onClick={ () => {
						onDomainAction?.( 'change-site-address', domain );
						onClose?.();
					} }
				>
					{ __( 'Change site address' ) }
				</MenuItemLink>
			),
			canRenewDomain && (
				<MenuItemLink
					key="renewDomain"
					onClick={ () => {
						domainStatusPurchaseActions?.onRenewNowClick?.( siteSlug ?? '', domain );
						onClose?.();
					} }
				>
					{ __( 'Renew now' ) }
				</MenuItemLink>
			),
		];
	};

	if ( getActions().filter( Boolean ).length === 0 ) {
		return null;
	}

	return (
		<DropdownMenu
			className="domains-table-row__actions"
			icon={ moreVertical }
			label={ __( 'Domain actions' ) }
		>
			{ ( { onClose } ) => (
				<MenuGroup className="domains-table-row__actions-group">
					{ getActions( onClose ) }
				</MenuGroup>
			) }
		</DropdownMenu>
	);
};
