import { isEnabled } from '@automattic/calypso-config';
import { SyntheticEvent } from '@wordpress/element';
import { settings } from '@wordpress/icons';
import clsx from 'clsx';
import { useTranslate } from 'i18n-calypso';
import { useState } from 'react';
import { connect } from 'react-redux';
import { withCurrentRoute } from 'calypso/components/route';
import GlobalSidebar from 'calypso/layout/global-sidebar';
import SidebarItem from 'calypso/layout/sidebar/item';
import SidebarMenu from 'calypso/layout/sidebar/menu';
import HostingDashboardOptInBanner from 'calypso/my-sites/hosting-dashboard-opt-in-banner';
import { getShouldShowCollapsedGlobalSidebar } from 'calypso/state/global-sidebar/selectors';
import { hasHostingDashboardOptIn } from 'calypso/state/sites/selectors/has-hosting-dashboard-opt-in';
import { AppState } from 'calypso/types';
import { SidebarIconPlugins } from '../../sidebar/static-data/global-sidebar-menu';
import { SidebarIconCalendar } from './icons';
import './style.scss';

interface Props {
	path: string;
	isCollapsed: boolean;
	hasOptIn: boolean;
}
const managePluginsPattern = /^\/plugins\/(manage|active|inactive|updates)/;

const PluginsSidebar = ( { path, isCollapsed, hasOptIn }: Props ) => {
	const translate = useTranslate();

	const [ previousPath, setPreviousPath ] = useState( path );
	const isManagedPluginSelected =
		managePluginsPattern.test( path ) ||
		( path.startsWith( '/plugins/' ) &&
			managePluginsPattern.test( previousPath ) &&
			! path.startsWith( '/plugins/scheduled-updates' ) );

	return (
		<GlobalSidebar
			className={ clsx( 'sidebar--plugins', { 'is-collapsed': isCollapsed } ) }
			siteTitle={ ! isCollapsed && translate( 'Plugins' ) }
			requireBackLink
			backLinkHref="/sites"
			subHeading={
				! isCollapsed &&
				translate(
					"Enhance your site's features with plugins, or schedule updates to fit your needs."
				)
			}
			footer={ isEnabled( 'dashboard/v2' ) && ! isCollapsed && <HostingDashboardOptInBanner /> }
		>
			<SidebarMenu>
				{ ! ( isEnabled( 'plugins/universal-header' ) && hasOptIn ) && (
					<SidebarItem
						className="sidebar__menu-item--plugins"
						link="/plugins"
						label={ translate( 'Marketplace' ) }
						tooltip={ isCollapsed && translate( 'Marketplace' ) }
						onNavigate={ ( _e: SyntheticEvent, link: string ) => setPreviousPath( link ) }
						selected={
							path.startsWith( '/plugins' ) &&
							! path.startsWith( '/plugins/scheduled-updates' ) &&
							! isManagedPluginSelected
						}
						customIcon={ <SidebarIconPlugins /> }
					/>
				) }

				<SidebarItem
					className="sidebar__menu-item--plugins"
					link="/plugins/manage/sites"
					label={ translate( 'Manage plugins' ) }
					tooltip={ isCollapsed && translate( 'Manage plugins' ) }
					selected={ isManagedPluginSelected }
					icon={ settings }
					onNavigate={ ( _e: SyntheticEvent, link: string ) => setPreviousPath( link ) }
				/>

				<SidebarItem
					className="sidebar__menu-item--plugins"
					link="/plugins/scheduled-updates"
					label={ translate( 'Scheduled updates' ) }
					tooltip={ isCollapsed && translate( 'Scheduled updates' ) }
					selected={ path.startsWith( '/plugins/scheduled-updates' ) }
					customIcon={ <SidebarIconCalendar /> }
				/>

				{ isEnabled( 'plugins/universal-header' ) && hasOptIn && (
					<SidebarItem
						className="sidebar__menu-item--plugins"
						link="/plugins"
						label={ translate( 'Marketplace' ) }
						tooltip={ isCollapsed && translate( 'Marketplace' ) }
						onNavigate={ ( _e: SyntheticEvent, link: string ) => setPreviousPath( link ) }
						selected={
							path.startsWith( '/plugins' ) &&
							! path.startsWith( '/plugins/scheduled-updates' ) &&
							! isManagedPluginSelected
						}
						customIcon={ <SidebarIconPlugins /> }
						forceExternalLink
						sidebarIsCollapsed={ isCollapsed }
					/>
				) }
			</SidebarMenu>
		</GlobalSidebar>
	);
};

export default withCurrentRoute(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	connect( ( state: AppState, { currentSection, currentRoute }: any ) => {
		const shouldShowCollapsedGlobalSidebar = getShouldShowCollapsedGlobalSidebar( {
			state,
			siteId: null,
			section: currentSection,
			route: currentRoute,
		} );

		return {
			isCollapsed: shouldShowCollapsedGlobalSidebar,
			hasOptIn: hasHostingDashboardOptIn( state ),
		};
	} )( PluginsSidebar )
);
