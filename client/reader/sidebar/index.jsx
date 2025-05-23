import page from '@automattic/calypso-router';
import { Button } from '@wordpress/components';
import closest from 'component-closest';
import i18n, { localize } from 'i18n-calypso';
import { defer, startsWith } from 'lodash';
import { Component } from 'react';
import { connect } from 'react-redux';
import QueryReaderLists from 'calypso/components/data/query-reader-lists';
import QueryReaderOrganizations from 'calypso/components/data/query-reader-organizations';
import QueryReaderTeams from 'calypso/components/data/query-reader-teams';
import { withCurrentRoute } from 'calypso/components/route';
import GlobalSidebar, { GLOBAL_SIDEBAR_EVENTS } from 'calypso/layout/global-sidebar';
import Sidebar from 'calypso/layout/sidebar';
import SidebarFooter from 'calypso/layout/sidebar/footer';
import SidebarItem from 'calypso/layout/sidebar/item';
import SidebarMenu from 'calypso/layout/sidebar/menu';
import SidebarRegion from 'calypso/layout/sidebar/region';
import SidebarSeparator from 'calypso/layout/sidebar/separator';
import ReaderA8cConversationsIcon from 'calypso/reader/components/icons/a8c-conversations-icon';
import ReaderConversationsIcon from 'calypso/reader/components/icons/conversations-icon';
import ReaderDiscoverIcon from 'calypso/reader/components/icons/discover-icon';
import ReaderLikesIcon from 'calypso/reader/components/icons/likes-icon';
import ReaderManageSubscriptionsIcon from 'calypso/reader/components/icons/manage-subscriptions-icon';
import ReaderSearchIcon from 'calypso/reader/components/icons/search-icon';
import { isAutomatticTeamMember } from 'calypso/reader/lib/teams';
import { getTagStreamUrl } from 'calypso/reader/route';
import { recordAction, recordGaEvent } from 'calypso/reader/stats';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import { getShouldShowGlobalSidebar } from 'calypso/state/global-sidebar/selectors';
import { recordReaderTracksEvent } from 'calypso/state/reader/analytics/actions';
import { getSubscribedLists } from 'calypso/state/reader/lists/selectors';
import { getReaderOrganizations } from 'calypso/state/reader/organizations/selectors';
import {
	toggleReaderSidebarLists,
	toggleReaderSidebarFollowing,
	toggleReaderSidebarTags,
} from 'calypso/state/reader-ui/sidebar/actions';
import {
	isListsOpen,
	isFollowingOpen,
	isTagsOpen,
} from 'calypso/state/reader-ui/sidebar/selectors';
import { getReaderTeams } from 'calypso/state/teams/selectors';
import { setNextLayoutFocus } from 'calypso/state/ui/layout-focus/actions';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import ReaderSidebarHelper from './helper';
import ReaderSidebarLists from './reader-sidebar-lists';
import ReaderSidebarNudges from './reader-sidebar-nudges';
import ReaderSidebarOrganizations from './reader-sidebar-organizations';
import ReaderSidebarRecent from './reader-sidebar-recent';
import ReaderSidebarTags from './reader-sidebar-tags';
import 'calypso/my-sites/sidebar/style.scss'; // Copy styles from the My Sites sidebar.
import './style.scss';

export class ReaderSidebar extends Component {
	state = {};

	componentDidMount() {
		// If we're browsing a tag or list, open the sidebar menu
		this.openExpandableMenuForCurrentTagOrList();
	}

	handleClick = ( event ) => {
		if ( ! event.isDefaultPrevented() && closest( event.target, 'a,span' ) ) {
			this.props.setNextLayoutFocus( 'content' );
		}
	};

	highlightNewTag( tagSlug ) {
		const tagStreamUrl = getTagStreamUrl( tagSlug );
		if ( tagStreamUrl !== page.current ) {
			defer( function () {
				page( tagStreamUrl );
				window.scrollTo( 0, 0 );
			} );
		}
	}

	openExpandableMenuForCurrentTagOrList = () => {
		const pathParts = this.props.path.split( '/' );

		if ( startsWith( this.props.path, '/tag/' ) ) {
			const tagSlug = pathParts[ 2 ];
			if ( tagSlug ) {
				// Open the sidebar
				if ( ! this.props.isTagsOpen ) {
					this.props.toggleTagsVisibility();
					this.setState( { currentTag: tagSlug } );
				}
			}
		}

		if ( startsWith( this.props.path, '/reader/list/' ) ) {
			const listOwner = pathParts[ 3 ];
			const listSlug = pathParts[ 4 ];
			if ( listOwner && listSlug ) {
				// Open the sidebar
				if ( ! this.props.isListsOpen ) {
					this.props.toggleListsVisibility();
					this.setState( { currentListOwner: listOwner, currentListSlug: listSlug } );
				}
			}
		}
	};

	handleGlobalSidebarMenuItemClick = ( path ) => {
		if ( ! this.props.shouldShowGlobalSidebar ) {
			return;
		}

		this.props.recordTracksEvent( GLOBAL_SIDEBAR_EVENTS.MENU_ITEM_CLICK, {
			section: 'read',
			path,
		} );
	};

	handleReaderSidebarConversationsClicked = ( event, path ) => {
		recordAction( 'clicked_reader_sidebar_conversations' );
		recordGaEvent( 'Clicked Reader Sidebar Conversations' );
		this.props.recordReaderTracksEvent( 'calypso_reader_sidebar_conversations_clicked' );
		this.handleGlobalSidebarMenuItemClick( path );
	};

	handleReaderSidebarA8cConversationsClicked = ( event, path ) => {
		recordAction( 'clicked_reader_sidebar_a8c_conversations' );
		recordGaEvent( 'Clicked Reader Sidebar A8C Conversations' );
		this.props.recordReaderTracksEvent( 'calypso_reader_sidebar_automattic_conversations_clicked' );
		this.handleGlobalSidebarMenuItemClick( path );
	};

	handleReaderSidebarDiscoverClicked = ( event, path ) => {
		recordAction( 'clicked_reader_sidebar_discover' );
		recordGaEvent( 'Clicked Reader Sidebar Discover' );
		this.props.recordReaderTracksEvent( 'calypso_reader_sidebar_discover_clicked' );
		this.handleGlobalSidebarMenuItemClick( path );
	};

	handleReaderSidebarSearchClicked = ( event, path ) => {
		recordAction( 'clicked_reader_sidebar_search' );
		recordGaEvent( 'Clicked Reader Sidebar Search' );
		this.props.recordReaderTracksEvent( 'calypso_reader_sidebar_search_clicked' );
		this.handleGlobalSidebarMenuItemClick( path );
	};

	handleReaderSidebarLikeActivityClicked = ( event, path ) => {
		recordAction( 'clicked_reader_sidebar_like_activity' );
		recordGaEvent( 'Clicked Reader Sidebar Like Activity' );
		this.props.recordReaderTracksEvent( 'calypso_reader_sidebar_like_activity_clicked' );
		this.handleGlobalSidebarMenuItemClick( path );
	};

	handleReaderSidebarManageSubscriptionsClicked = ( event, path ) => {
		recordAction( 'clicked_reader_sidebar_manage_subscriptions' );
		recordGaEvent( 'Clicked Reader Sidebar Manage Subscriptions' );
		this.props.recordReaderTracksEvent( 'calypso_reader_sidebar_manage_subscriptions_clicked' );
		this.handleGlobalSidebarMenuItemClick( path );
	};

	renderSidebarMenu() {
		const { path, translate, teams } = this.props;

		return (
			<div className="sidebar-menu-container">
				<div className="sidebar-header">
					<div>
						<h3>{ translate( 'Reader' ) }</h3>
						<p>{ translate( 'Keep up with your interests.' ) }</p>
					</div>

					<Button
						className="reader-search-icon"
						variant="tertiary"
						href="/reader/search"
						onClick={ this.handleReaderSidebarSearchClicked }
						aria-label={ translate( 'Search' ) }
					>
						<ReaderSearchIcon viewBox="0 0 24 24" />
					</Button>
				</div>
				<SidebarMenu>
					<QueryReaderLists />
					<QueryReaderTeams />
					<QueryReaderOrganizations />

					<li className="sidebar-streams__following">
						<ReaderSidebarRecent
							onClick={ this.props.toggleFollowingVisibility }
							isOpen={ this.props.isFollowingOpen }
							path={ path }
						/>
					</li>

					<SidebarItem
						className={ ReaderSidebarHelper.itemLinkClass( '/discover', path, {
							'sidebar-streams__discover': true,
						} ) }
						label={ translate( 'Discover' ) }
						onNavigate={ this.handleReaderSidebarDiscoverClicked }
						customIcon={ <ReaderDiscoverIcon viewBox="0 0 24 24" /> }
						link="/discover"
					/>

					<SidebarItem
						label={ translate( 'Likes' ) }
						onNavigate={ this.handleReaderSidebarLikeActivityClicked }
						customIcon={ <ReaderLikesIcon viewBox="0 0 24 24" /> }
						link="/activities/likes"
						className={ ReaderSidebarHelper.itemLinkClass( '/activities/likes', path, {
							'sidebar-activity__likes': true,
						} ) }
					/>

					<SidebarItem
						className={ ReaderSidebarHelper.itemLinkClass( '/reader/conversations', path, {
							'sidebar-streams__conversations': true,
						} ) }
						label={ translate( 'Conversations' ) }
						onNavigate={ this.handleReaderSidebarConversationsClicked }
						customIcon={ <ReaderConversationsIcon iconSize={ 24 } viewBox="0 0 24 24" /> }
						link="/reader/conversations"
					/>

					<ReaderSidebarLists
						lists={ this.props.subscribedLists }
						path={ path }
						isOpen={ this.props.isListsOpen }
						onClick={ this.props.toggleListsVisibility }
						currentListOwner={ this.state.currentListOwner }
						currentListSlug={ this.state.currentListSlug }
					/>

					<ReaderSidebarTags
						tags={ this.props.followedTags }
						path={ path }
						isOpen={ this.props.isTagsOpen }
						onClick={ this.props.toggleTagsVisibility }
						onFollowTag={ this.highlightNewTag }
						currentTag={ this.state.currentTag }
					/>

					{ this.props.organizations && (
						<>
							<SidebarSeparator />
							<ReaderSidebarOrganizations
								organizations={ this.props.organizations }
								path={ path }
							/>
						</>
					) }

					{ isAutomatticTeamMember( teams ) && (
						<SidebarItem
							className={ ReaderSidebarHelper.itemLinkClass( '/reader/conversations/a8c', path, {
								'sidebar-streams__conversations': true,
							} ) }
							label="A8C Conversations"
							onNavigate={ this.handleReaderSidebarA8cConversationsClicked }
							link="/reader/conversations/a8c"
							customIcon={ <ReaderA8cConversationsIcon size={ 24 } viewBox="-2 -2 24 24" /> }
						/>
					) }

					<SidebarSeparator />

					<SidebarItem
						className={ ReaderSidebarHelper.itemLinkClass( '/reader/subscriptions', path, {
							'sidebar-streams__manage-subscriptions': true,
						} ) }
						label={ translate( 'Manage Subscriptions' ) }
						onNavigate={ this.handleReaderSidebarManageSubscriptionsClicked }
						customIcon={ <ReaderManageSubscriptionsIcon size={ 24 } viewBox="0 0 24 24" /> }
						link="/reader/subscriptions"
					/>
					{ /*
					Keep a separator at the end to avoid having the last item covered by browser breadcrumbs,
					url links when hovering other items, etc. Otherwise when a user scrolls to the end of the
					sidebar, their cursor is generally on other menu items causing the urls to popup in the
					bottom right and obscure view the last menu item.
				*/ }
					<SidebarSeparator />
				</SidebarMenu>
			</div>
		);
	}

	renderGlobalSidebar() {
		const props = {
			path: this.props.path,
			onClick: this.handleClick,
			siteTitle: i18n.translate( 'Reader' ),
		};
		return (
			<GlobalSidebar { ...props }>
				<ReaderSidebarNudges />
				{ this.renderSidebarMenu() }
			</GlobalSidebar>
		);
	}

	renderSidebar() {
		return (
			<Sidebar onClick={ this.handleClick }>
				<SidebarRegion>
					<ReaderSidebarNudges />
					{ this.renderSidebarMenu() }
				</SidebarRegion>
				<SidebarFooter />
			</Sidebar>
		);
	}

	render() {
		if ( this.props.shouldShowGlobalSidebar ) {
			return this.renderGlobalSidebar();
		}
		return this.renderSidebar();
	}
}

export default withCurrentRoute(
	connect(
		( state, { currentSection } ) => {
			const siteId = getSelectedSiteId( state );
			const shouldShowGlobalSidebar = getShouldShowGlobalSidebar( {
				state,
				siteId,
				section: currentSection,
			} );

			return {
				isListsOpen: isListsOpen( state ),
				isFollowingOpen: isFollowingOpen( state ),
				isTagsOpen: isTagsOpen( state ),
				subscribedLists: getSubscribedLists( state ),
				teams: getReaderTeams( state ),
				organizations: getReaderOrganizations( state ),
				shouldShowGlobalSidebar,
			};
		},
		{
			recordReaderTracksEvent,
			recordTracksEvent,
			setNextLayoutFocus,
			toggleListsVisibility: toggleReaderSidebarLists,
			toggleFollowingVisibility: toggleReaderSidebarFollowing,
			toggleTagsVisibility: toggleReaderSidebarTags,
		}
	)( localize( ReaderSidebar ) )
);
