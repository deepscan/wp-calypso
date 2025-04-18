import { SiteExcerptData } from '@automattic/sites';
import { translate } from 'i18n-calypso';
import { useMemo } from 'react';
import NavigationHeader from 'calypso/components/navigation-header';
import { domainManagementAllOverview } from 'calypso/my-sites/domains/paths';
import { getEmailManagementPath } from 'calypso/my-sites/email/paths';
import SiteIcon from 'calypso/sites/components/sites-dataviews/site-icon';
import { useSelector } from 'calypso/state';
import getCurrentRoute from 'calypso/state/selectors/get-current-route';
import { getSite } from 'calypso/state/sites/selectors';
import { CustomHeaderComponentType } from './custom-header-component-type';

const CompareEmailProvidersHeader: CustomHeaderComponentType = ( {
	selectedDomainName,
	selectedSiteSlug,
	inSiteContext,
} ) => {
	const site = useSelector( ( state ) => getSite( state, selectedSiteSlug ) as SiteExcerptData );
	const currentRoute = useSelector( getCurrentRoute );

	const navigationItems = useMemo( () => {
		const baseNavigationItems = [
			{
				label: selectedDomainName,
				href: domainManagementAllOverview(
					selectedSiteSlug,
					selectedDomainName,
					currentRoute,
					inSiteContext
				),
				className: 'navigation-header__domain-name',
			},
			{
				label: translate( 'Email' ),
				href: getEmailManagementPath(
					selectedSiteSlug,
					selectedDomainName,
					currentRoute,
					undefined,
					inSiteContext
				),
			},
			{
				label: translate( 'Compare plans' ),
			},
		];

		if ( inSiteContext ) {
			return [
				{
					label: site?.name || selectedDomainName,
					href: `/overview/${ selectedSiteSlug }`,
					icon: <SiteIcon site={ site } viewType="breadcrumb" disableClick />,
				},
				...baseNavigationItems,
			];
		}

		return baseNavigationItems;
	}, [ currentRoute, inSiteContext, selectedDomainName, selectedSiteSlug, site ] );

	return (
		<NavigationHeader
			className="navigation-header__breadcrumb"
			navigationItems={ navigationItems }
		/>
	);
};

export default CompareEmailProvidersHeader;
