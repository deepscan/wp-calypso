import config from '@automattic/calypso-config';
import pageRouter from '@automattic/calypso-router';
import { CompactCard, Gridicon } from '@automattic/components';
import { saveAs } from 'browser-filesaver';
import clsx from 'clsx';
import { localize } from 'i18n-calypso';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import SiteIcon from 'calypso/blocks/site-icon';
import QueryJetpackModules from 'calypso/components/data/query-jetpack-modules';
import EllipsisMenu from 'calypso/components/ellipsis-menu';
import InfoPopover from 'calypso/components/info-popover';
import Notice from 'calypso/components/notice';
import NoticeAction from 'calypso/components/notice/notice-action';
import PopoverMenuItem from 'calypso/components/popover-menu/item';
import PopoverMenuItemClipboard from 'calypso/components/popover-menu/item-clipboard';
import PopoverMenuSeparator from 'calypso/components/popover-menu/separator';
import PostActionsEllipsisMenuPromote from 'calypso/my-sites/post-type-list/post-actions-ellipsis-menu/promote';
import PostActionsEllipsisMenuQRCode from 'calypso/my-sites/post-type-list/post-actions-ellipsis-menu/qrcode';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import { getEditorDuplicatePostPath } from 'calypso/state/editor/selectors';
import { infoNotice } from 'calypso/state/notices/actions';
import { isFrontPage, isPostsPage } from 'calypso/state/pages/selectors';
import { savePost, deletePost, trashPost, restorePost } from 'calypso/state/posts/actions';
import { getPreviewURL, userCan } from 'calypso/state/posts/utils';
import { canCurrentUser } from 'calypso/state/selectors/can-current-user';
import getEditorUrl from 'calypso/state/selectors/get-editor-url';
import isJetpackModuleActive from 'calypso/state/selectors/is-jetpack-module-active';
import { shouldLoadGutenframe } from 'calypso/state/selectors/should-load-gutenframe';
import { updateSiteFrontPage } from 'calypso/state/sites/actions';
import {
	getSite,
	hasStaticFrontPage,
	isJetpackSite,
	isSitePreviewable,
} from 'calypso/state/sites/selectors';
import { setLayoutFocus } from 'calypso/state/ui/layout-focus/actions';
import { setPreviewUrl } from 'calypso/state/ui/preview/actions';
import { getSelectedSiteId } from 'calypso/state/ui/selectors';
import { statsLinkForPage, recordEvent } from '../helpers';
import PageCardInfo from '../page-card-info';
import PageEllipsisMenuWrapper from './page-ellipsis-menu-wrapper';

const noop = () => {};

function sleep( ms ) {
	return new Promise( ( r ) => setTimeout( r, ms ) );
}

const ShadowNotice = localize( ( { shadowStatus, onUndoClick, translate } ) => (
	<div className="page__shadow-notice-cover">
		<Notice
			className="page__shadow-notice"
			isCompact
			inline
			text={ shadowStatus.text }
			status={ shadowStatus.status }
			icon={ shadowStatus.icon }
			isLoading={ shadowStatus.isLoading }
		>
			{ shadowStatus.undo && (
				<NoticeAction onClick={ onUndoClick }>{ translate( 'Undo' ) }</NoticeAction>
			) }
		</Notice>
	</div>
) );

class Page extends Component {
	static propTypes = {
		// connected
		setPreviewUrl: PropTypes.func.isRequired,
		setLayoutFocus: PropTypes.func.isRequired,
		recordEvent: PropTypes.func.isRequired,
		recordTracksEvent: PropTypes.func.isRequired,
	};

	static defaultProps = {
		onShadowStatusChange: noop,
		showPublishedStatus: false,
	};

	recordEllipsisMenuItemClickEvent = ( item ) => {
		this.props.recordTracksEvent( 'calypso_pages_ellipsismenu_item_click', {
			page_type: 'real',
			blog_id: this.props.site?.ID,
			item,
		} );
	};

	// Construct a link to the Site the page belongs too
	getSiteDomain() {
		return ( this.props.site && this.props.site.domain ) || '...';
	}

	viewPage = () => {
		const { isPreviewable, page, previewURL } = this.props;

		if ( page.status && page.status === 'publish' ) {
			this.recordEllipsisMenuItemClickEvent( 'viewpage' );
			this.props.recordEvent( 'Clicked View Page' );
		}

		if ( ! isPreviewable && typeof window === 'object' ) {
			return window.open( previewURL );
		}

		this.props.setPreviewUrl( previewURL );
		this.props.setLayoutFocus( 'preview' );
	};

	getViewItem() {
		const { isPreviewable } = this.props;
		if ( this.props.page.status === 'trash' ) {
			return null;
		}

		if ( this.props.hasStaticFrontPage && this.props.isPostsPage ) {
			return null;
		}

		if ( this.props.page.status !== 'publish' ) {
			return (
				<PopoverMenuItem onClick={ this.viewPage }>
					<Gridicon icon={ isPreviewable ? 'visible' : 'external' } size={ 18 } />
					{ this.props.translate( 'Preview' ) }
				</PopoverMenuItem>
			);
		}

		return (
			<PopoverMenuItem onClick={ this.viewPage }>
				<Gridicon icon={ isPreviewable ? 'visible' : 'external' } size={ 18 } />
				{ this.props.translate( 'View page' ) }
			</PopoverMenuItem>
		);
	}

	getPromoteItem() {
		return (
			<PostActionsEllipsisMenuPromote
				globalId={ this.props.page.global_ID }
				key="promote"
				bumpStatKey="pages-meatball-menu"
			/>
		);
	}

	childPageInfo() {
		const { parentEditorUrl, page, translate } = this.props;

		// If we're in hierarchical view, we don't show child info in the context menu, as it's redudant.
		if ( this.props.hierarchical || ! page.parent ) {
			return null;
		}

		const parentTitle = page.parent.title || translate( '( Untitled )' );

		// This is technically if you can edit the current page, not the parent.
		// Capabilities are not exposed on the parent page.
		const parentHref = userCan( 'edit_post', this.props.page ) ? parentEditorUrl : page.parent.URL;
		const parentLink = <a href={ parentHref }>{ parentTitle }</a>;

		return (
			<div className="page__popover-more-info">
				{ translate( 'Child of {{PageTitle/}}', {
					components: {
						PageTitle: parentLink,
					},
				} ) }
			</div>
		);
	}

	frontPageInfo() {
		if ( ! this.props.isFrontPage ) {
			return null;
		}

		return (
			<div className="page__popover-more-info">
				{ this.props.translate( "This page is set as your site's homepage" ) }
			</div>
		);
	}

	getPublishItem() {
		if (
			this.props.page.status === 'publish' ||
			! userCan( 'publish_post', this.props.page ) ||
			this.props.page.status === 'trash'
		) {
			return null;
		}

		return (
			<PopoverMenuItem onClick={ this.updateStatusPublish }>
				<Gridicon icon="checkmark" size={ 18 } />
				{ this.props.translate( 'Publish' ) }
			</PopoverMenuItem>
		);
	}

	getEditItem() {
		if ( this.props.hasStaticFrontPage && this.props.isPostsPage ) {
			return null;
		}

		if ( ! userCan( 'edit_post', this.props.page ) ) {
			return null;
		}

		if ( this.props.wpAdminGutenberg ) {
			return (
				<PopoverMenuItem onClick={ this.editPage } href={ this.props.editorUrl }>
					<Gridicon icon="pencil" size={ 18 } />
					{ this.props.translate( 'Edit' ) }
				</PopoverMenuItem>
			);
		}

		return (
			<PopoverMenuItem onClick={ this.editPage }>
				<Gridicon icon="pencil" size={ 18 } />
				{ this.props.translate( 'Edit' ) }
			</PopoverMenuItem>
		);
	}

	setFrontPage = () =>
		this.props.updateSiteFrontPage( this.props.siteId, {
			show_on_front: 'page',
			page_on_front: this.props.page.ID,
		} );

	getFrontPageItem() {
		const { canManageOptions, translate } = this.props;

		if (
			! canManageOptions ||
			'publish' !== this.props.page.status ||
			! this.props.hasStaticFrontPage ||
			this.props.isFrontPage
		) {
			return null;
		}

		return [
			<PopoverMenuSeparator key="separator" />,
			<PopoverMenuItem key="item" onClick={ this.setFrontPage }>
				<Gridicon icon="house" size={ 18 } />
				{ translate( 'Set as Homepage' ) }
			</PopoverMenuItem>,
		];
	}

	setPostsPage = ( pageId ) => () =>
		this.props.updateSiteFrontPage( this.props.siteId, {
			show_on_front: 'page',
			page_for_posts: pageId,
		} );

	getPostsPageItem() {
		const { canManageOptions, page, translate } = this.props;

		if (
			! canManageOptions ||
			! this.props.hasStaticFrontPage ||
			'publish' !== page.status ||
			this.props.isFrontPage
		) {
			return null;
		}

		return [
			<PopoverMenuSeparator key="separator" />,
			this.props.isPostsPage && (
				<PopoverMenuItem key="item" onClick={ this.setPostsPage( 0 ) }>
					<Gridicon icon="undo" size={ 18 } />
					{ translate( 'Set as Regular Page' ) }
				</PopoverMenuItem>
			),
			! this.props.isPostsPage && (
				<PopoverMenuItem key="item" onClick={ this.setPostsPage( page.ID ) }>
					<Gridicon icon="posts" size={ 18 } />
					{ translate( 'Set as Posts Page' ) }
				</PopoverMenuItem>
			),
		];
	}

	getSendToTrashItem() {
		if ( ( this.props.hasStaticFrontPage && this.props.isPostsPage ) || this.props.isFrontPage ) {
			return null;
		}

		if ( ! userCan( 'delete_post', this.props.page ) ) {
			return null;
		}

		if ( this.props.page.status !== 'trash' ) {
			return [
				<PopoverMenuSeparator key="separator" />,
				<PopoverMenuItem key="item" className="page__trash-item" onClick={ this.updateStatusTrash }>
					<Gridicon icon="trash" size={ 18 } />
					{ this.props.translate( 'Trash' ) }
				</PopoverMenuItem>,
			];
		}

		return [
			<PopoverMenuSeparator key="separator" />,
			<PopoverMenuItem key="item" className="page__delete-item" onClick={ this.updateStatusDelete }>
				<Gridicon icon="trash" size={ 18 } />
				{ this.props.translate( 'Delete' ) }
			</PopoverMenuItem>,
		];
	}

	getCopyPageItem() {
		const { copyPagesModuleDisabled, wpAdminGutenberg, page: post, duplicateUrl } = this.props;
		if (
			! [ 'draft', 'future', 'pending', 'private', 'publish' ].includes( post.status ) ||
			! userCan( 'edit_post', post ) ||
			wpAdminGutenberg ||
			copyPagesModuleDisabled
		) {
			return null;
		}
		return (
			<PopoverMenuItem onClick={ this.copyPage } href={ duplicateUrl }>
				<Gridicon icon="clipboard" size={ 18 } />
				{ this.props.translate( 'Copy page' ) }
			</PopoverMenuItem>
		);
	}

	getExportItem() {
		const { page } = this.props;
		if ( ! page.content || ! config.isEnabled( 'page/export' ) ) {
			return null;
		}

		return (
			<>
				<PopoverMenuSeparator key="separator" />
				<PopoverMenuItem onClick={ this.exportPage }>
					<Gridicon icon="cloud-download" size={ 18 } />
					{ this.props.translate( 'Export page' ) }
				</PopoverMenuItem>
			</>
		);
	}

	getQRCodeItem() {
		if ( ! config.isEnabled( 'post-list/qr-code-link' ) ) {
			return null;
		}
		return (
			<PostActionsEllipsisMenuQRCode
				globalId={ this.props.page.global_ID }
				key="qrcode"
				onClick={ this.viewPageQrCode }
			/>
		);
	}

	getCopyLinkItem() {
		const { page, translate } = this.props;
		return (
			<PopoverMenuItemClipboard text={ page.URL } onCopy={ this.copyPageLink } icon="link">
				{ translate( 'Copy link' ) }
			</PopoverMenuItemClipboard>
		);
	}

	getRestoreItem() {
		if ( this.props.page.status !== 'trash' || ! userCan( 'delete_post', this.props.page ) ) {
			return null;
		}

		return (
			<PopoverMenuItem onClick={ this.updateStatusRestore }>
				<Gridicon icon="undo" size={ 18 } />
				{ this.props.translate( 'Restore' ) }
			</PopoverMenuItem>
		);
	}

	viewStats = () => {
		this.recordEllipsisMenuItemClickEvent( 'viewstats' );
		this.props.recordEvent( 'Clicked Stats Page' );
		pageRouter( statsLinkForPage( this.props.page, this.props.site ) );
	};

	getStatsItem() {
		if ( this.props.page.status !== 'publish' ) {
			return null;
		}

		return (
			<PopoverMenuItem onClick={ this.viewStats }>
				<Gridicon icon="stats" size={ 18 } />
				{ this.props.translate( 'Stats' ) }
			</PopoverMenuItem>
		);
	}

	editPage = () => {
		this.recordEllipsisMenuItemClickEvent( 'editpage' );
		this.props.recordEvent( 'Clicked Edit Page' );

		if ( ! this.props.wpAdminGutenberg ) {
			pageRouter( this.props.editorUrl );
		}
	};

	getPageStatusInfo() {
		if ( this.props.page.status === 'publish' ) {
			return null;
		}

		return (
			<div className="page__popover-more-info">
				{ this.getReadableStatus( this.props.page.status ) }
			</div>
		);
	}

	getReadableStatus( status ) {
		const { translate } = this.props;
		if ( ! this.humanReadableStatus ) {
			this.humanReadableStatus = {
				publish: translate( 'Published' ),
				draft: translate( 'Draft' ),
				pending: translate( 'Pending' ),
				future: translate( 'Future' ),
				private: translate( 'Private' ),
				trash: translate( 'Trashed' ),
			};
		}

		return this.humanReadableStatus[ status ] || status;
	}

	popoverMoreInfo() {
		const status = this.getPageStatusInfo();
		const childPageInfo = this.childPageInfo();
		const frontPageInfo = this.frontPageInfo();

		if ( ! status && ! childPageInfo && ! frontPageInfo ) {
			return null;
		}

		return (
			<div>
				<PopoverMenuSeparator />
				{ status }
				{ childPageInfo }
				{ frontPageInfo }
			</div>
		);
	}

	undoPostStatus = () => this.updatePostStatus( this.props.shadowStatus.undo );

	createEllipsisMenu = () => {
		const viewItem = this.getViewItem();
		const promoteItem = this.getPromoteItem();
		const publishItem = this.getPublishItem();
		const editItem = this.getEditItem();
		const frontPageItem = this.getFrontPageItem();
		const postsPageItem = this.getPostsPageItem();
		const restoreItem = this.getRestoreItem();
		const sendToTrashItem = this.getSendToTrashItem();
		const copyPageItem = this.getCopyPageItem();
		const copyLinkItem = this.getCopyLinkItem();
		const statsItem = this.getStatsItem();
		const moreInfoItem = this.popoverMoreInfo();
		const exportItem = this.getExportItem();
		const qrCodeItem = this.getQRCodeItem();
		const hasMenuItems =
			viewItem ||
			publishItem ||
			promoteItem ||
			editItem ||
			statsItem ||
			restoreItem ||
			frontPageItem ||
			sendToTrashItem ||
			moreInfoItem ||
			exportItem ||
			qrCodeItem;

		return (
			hasMenuItems && (
				<PageEllipsisMenuWrapper globalId={ this.props.page.global_ID }>
					<EllipsisMenu
						className="page__actions-toggle"
						position="bottom left"
						onToggle={ this.handleMenuToggle }
					>
						{ editItem }
						{ publishItem }
						{ viewItem }
						{ promoteItem }
						{ statsItem }
						{ copyPageItem }
						{ copyLinkItem }
						{ restoreItem }
						{ frontPageItem }
						{ postsPageItem }
						{ exportItem }
						{ sendToTrashItem }
						{ qrCodeItem }
						{ moreInfoItem }
					</EllipsisMenu>
				</PageEllipsisMenuWrapper>
			)
		);
	};

	render() {
		const {
			editorUrl,
			page,
			shadowStatus,
			showPublishedStatus,
			siteId,
			translate,
			isPostsPage: latestPostsPage,
		} = this.props;
		const title = page.title || translate( 'Untitled' );
		const canEdit = userCan( 'edit_post', page ) && ! latestPostsPage;
		const depthIndicator = ! this.props.hierarchical && page.parent && '— ';

		const ellipsisMenu = this.createEllipsisMenu();

		const isTrashed = page.status === 'trash';

		const shadowNotice = shadowStatus && (
			<ShadowNotice shadowStatus={ shadowStatus } onUndoClick={ this.undoPostStatus } />
		);

		const cardClasses = {
			page: true,
			'is-indented': this.props.hierarchical && this.props.hierarchyLevel > 0,
			'is-untitled': ! page.title,
		};

		const hierarchyIndentClasses = {
			'page__hierarchy-indent': true,
			'is-indented': cardClasses[ 'is-indented' ],
		};

		if ( cardClasses[ 'is-indented' ] ) {
			cardClasses[ 'is-indented-level-' + this.props.hierarchyLevel ] = true;
			hierarchyIndentClasses[ 'is-indented-level-' + this.props.hierarchyLevel ] = true;
		}

		const hierarchyIndent = cardClasses[ 'is-indented' ] && (
			<div className={ clsx( hierarchyIndentClasses ) } />
		);

		const innerPageTitle = (
			<>
				{ depthIndicator }
				{ title }
				{ ! isTrashed && latestPostsPage && (
					<InfoPopover position="right">
						{ translate(
							'The content of your latest posts page is automatically generated and cannot be edited.'
						) }
					</InfoPopover>
				) }
			</>
		);

		return (
			<CompactCard className={ clsx( cardClasses ) }>
				<QueryJetpackModules siteId={ siteId } />
				{ hierarchyIndent }
				{ this.props.multisite ? <SiteIcon siteId={ page.site_ID } size={ 34 } /> : null }
				<div className="page__main">
					{ ! isTrashed && (
						<a
							className="page__title"
							href={ canEdit ? editorUrl : page.URL }
							title={
								canEdit
									? translate( 'Edit %(title)s', { textOnly: true, args: { title: page.title } } )
									: translate( 'View %(title)s', { textOnly: true, args: { title: page.title } } )
							}
							onClick={ () => this.clickPageTitle( canEdit ) }
							data-tip-target={ 'page-' + page.slug }
						>
							{ innerPageTitle }
						</a>
					) }

					{ isTrashed && <span className="page__title">{ innerPageTitle }</span> }

					<PageCardInfo
						page={ page }
						showTimestamp
						showPublishedStatus={ showPublishedStatus }
						siteUrl={ this.props.multisite && this.getSiteDomain() }
					/>
				</div>
				{ ellipsisMenu }
				{ shadowNotice }
			</CompactCard>
		);
	}

	changeShadowStatus( shadowStatus ) {
		return this.props.onShadowStatusChange( this.props.page.global_ID, shadowStatus );
	}

	async performUpdate( { action, progressNotice, successNotice, errorNotice, undo } ) {
		await this.changeShadowStatus( { ...progressNotice, isLoading: true } );
		try {
			await action();
			if ( undo === 'undo' ) {
				// This update was actually undo. Reset the shadow status immediately
				await this.changeShadowStatus( false );
				return;
			}
			await this.changeShadowStatus( { ...successNotice, undo } );
			if ( undo ) {
				// If undo is offered, keep the success notice displayed indefinitely
				return;
			}
		} catch ( error ) {
			await this.changeShadowStatus( errorNotice );
		}
		// remove the success/error notice after 5 seconds
		await sleep( 5000 );
		await this.changeShadowStatus( false );
	}

	updatePostStatus( status ) {
		const { page, translate } = this.props;

		switch ( status ) {
			case 'delete':
				this.performUpdate( {
					action: () => this.props.deletePost( page.site_ID, page.ID, true ),
					progressNotice: {
						status: 'is-error',
						icon: 'trash',
						text: translate( 'Deleting…' ),
					},
					successNotice: {
						status: 'is-success',
						text: translate( 'Page deleted.' ),
					},
					errorNotice: {
						status: 'is-error',
						text: translate( 'Failed to delete page.' ),
					},
				} );
				return;

			case 'trash':
				this.performUpdate( {
					action: () => this.props.trashPost( page.site_ID, page.ID, true ),
					undo: page.status !== 'trash' ? 'restore' : 'undo',
					progressNotice: {
						status: 'is-error',
						icon: 'trash',
						text: translate( 'Trashing…' ),
					},
					successNotice: {
						status: 'is-success',
						text: translate( 'Page trashed.' ),
					},
					errorNotice: {
						status: 'is-error',
						text: translate( 'Failed to trash page.' ),
					},
				} );
				return;

			case 'restore':
				this.performUpdate( {
					action: () => this.props.restorePost( page.site_ID, page.ID, true ),
					undo: page.status === 'trash' ? 'trash' : 'undo',
					progressNotice: {
						status: 'is-warning',
						icon: 'history',
						text: translate( 'Restoring…' ),
					},
					successNotice: {
						status: 'is-success',
						text: translate( 'Page restored.' ),
					},
					errorNotice: {
						status: 'is-error',
						text: translate( 'Failed to restore page.' ),
					},
				} );
				return;

			case 'publish':
				this.performUpdate( {
					action: () => this.props.savePost( page.site_ID, page.ID, { status }, true ),
					progressNotice: {
						status: 'is-info',
						icon: 'reader',
						text: translate( 'Publishing…' ),
					},
					successNotice: {
						status: 'is-success',
						text: translate( 'Page published.' ),
					},
					errorNotice: {
						status: 'is-error',
						text: translate( 'Failed to publish page.' ),
					},
				} );
		}
	}

	updateStatusPublish = () => {
		this.updatePostStatus( 'publish' );
		this.props.recordEvent( 'Clicked Publish Page' );
	};

	updateStatusTrash = () => {
		this.updatePostStatus( 'trash' );
		this.props.recordEvent( 'Clicked Move to Trash' );
	};

	updateStatusRestore = () => {
		this.updatePostStatus( 'restore' );
		this.props.recordEvent( 'Clicked Restore' );
	};

	updateStatusDelete = () => {
		const deleteWarning = this.props.translate( 'Delete this page permanently?' );
		if ( typeof window === 'object' && window.confirm( deleteWarning ) ) {
			this.updatePostStatus( 'delete' );
		}
		this.props.recordEvent( 'Clicked Delete Page' );
	};

	clickPageTitle = ( canEdit ) => {
		this.props.recordTracksEvent( 'calypso_pages_page_title_click', {
			page_type: 'real',
			blog_id: this.props.siteId,
			can_edit: canEdit,
		} );
		this.props.recordEvent( 'Clicked Page Title' );
	};

	copyPage = () => {
		this.recordEllipsisMenuItemClickEvent( 'copypage' );
		this.props.recordEvent( 'Clicked Copy Page' );
	};

	exportPage = () => {
		this.recordEllipsisMenuItemClickEvent( 'exportpage' );
		this.props.recordEvent( 'Clicked Export Page' );
		const { page } = this.props;

		const fileContent = JSON.stringify( {
			__file: 'wp_template',
			language: 'en',
			title: page.title,
			demoURL: page.URL,
			content: page.rawContent,
		} );
		const blob = new window.Blob( [ fileContent ], { type: 'application/json' } );
		const fileName = ( page.title ? page.title : 'page' ) + '.json';
		saveAs( blob, fileName );
	};

	viewPageQrCode = () => {
		this.recordEllipsisMenuItemClickEvent( 'qrcode' );
	};

	copyPageLink = () => {
		this.recordEllipsisMenuItemClickEvent( 'copylink' );
		this.props.recordEvent( 'Clicked Copy Page Link' );

		this.props.infoNotice( this.props.translate( 'Link copied to clipboard.' ), {
			duration: 3000,
		} );
	};

	handleMenuToggle = ( isVisible ) => {
		if ( isVisible ) {
			this.props.recordTracksEvent( 'calypso_pages_ellipsismenu_open_click', {
				page_type: 'real',
				blog_id: this.props.siteId,
			} );
			// record a GA event when the menu is opened
			this.props.recordEvent( 'Clicked More Options Menu' );
		}
	};
}

const mapState = ( state, props ) => {
	const pageSiteId = get( props, 'page.site_ID' );
	const site = getSite( state, pageSiteId );
	const siteSlugOrId = get( site, 'slug' ) || get( site, 'ID', null );
	const selectedSiteId = getSelectedSiteId( state );
	const isPreviewable =
		false !== isSitePreviewable( state, pageSiteId ) && site && site.ID === selectedSiteId;

	return {
		hasStaticFrontPage: hasStaticFrontPage( state, pageSiteId ),
		isFrontPage: isFrontPage( state, pageSiteId, props.page.ID ),
		isPostsPage: isPostsPage( state, pageSiteId, props.page.ID ),
		isPreviewable,
		previewURL: getPreviewURL( site, props.page ),
		site,
		siteId: pageSiteId,
		siteSlugOrId,
		editorUrl: getEditorUrl( state, pageSiteId, get( props, 'page.ID' ), 'page' ),
		parentEditorUrl: getEditorUrl( state, pageSiteId, get( props, 'page.parent.ID' ), 'page' ),
		copyPagesModuleDisabled:
			! isJetpackModuleActive( state, pageSiteId, 'copy-post' ) &&
			isJetpackSite( state, pageSiteId ),
		wpAdminGutenberg: ! shouldLoadGutenframe( state, pageSiteId, 'page' ),
		duplicateUrl: getEditorDuplicatePostPath( state, props.page.site_ID, props.page.ID, 'page' ),
		canManageOptions: canCurrentUser( state, pageSiteId, 'manage_options' ),
	};
};

const mapDispatch = {
	infoNotice,
	savePost,
	deletePost,
	trashPost,
	restorePost,
	setPreviewUrl,
	setLayoutFocus,
	recordTracksEvent,
	recordEvent,
	updateSiteFrontPage,
};

export default connect( mapState, mapDispatch )( localize( Page ) );
