import { Button, FormLabel, Spinner } from '@automattic/components';
import clsx from 'clsx';
import debugModule from 'debug';
import { localize } from 'i18n-calypso';
import { isEqual } from 'lodash';
import PropTypes from 'prop-types';
import { PureComponent } from 'react';
import { connect } from 'react-redux';
import AsyncLoad from 'calypso/components/async-load';
import FormFieldset from 'calypso/components/forms/form-fieldset';
import Image from 'calypso/components/image';
import { withAddMedia } from 'calypso/data/media/with-add-media';
import { createTransientMediaId } from 'calypso/lib/media/utils';
import resizeImageUrl from 'calypso/lib/resize-image-url';
import EditorMediaModalDialog from 'calypso/post-editor/media-modal/dialog';
import { setEditorMediaModalView } from 'calypso/state/editor/actions';
import { resetAllImageEditorState } from 'calypso/state/editor/image-editor/actions';
import { AspectRatios } from 'calypso/state/editor/image-editor/constants';
import {
	getImageEditorCrop,
	getImageEditorTransform,
} from 'calypso/state/editor/image-editor/selectors';
import getMediaItem from 'calypso/state/media/thunks/get-media-item';
import getMediaLibrarySelectedItems from 'calypso/state/selectors/get-media-library-selected-items';
import { ModalViews } from 'calypso/state/ui/media-modal/constants';
import { getSelectedSiteId, getSelectedSite } from 'calypso/state/ui/selectors';

import './style.scss';

const debug = debugModule( 'calypso:podcast-image' );

class PodcastCoverImageSetting extends PureComponent {
	static propTypes = {
		coverImageId: PropTypes.number,
		coverImageUrl: PropTypes.string,
		onRemove: PropTypes.func,
		onSelect: PropTypes.func,
		onUploadStateChange: PropTypes.func,
		isDisabled: PropTypes.bool,
		addMedia: PropTypes.func,
	};

	state = {
		hasToggledModal: false,
		isEditingCoverImage: false,
		isModalVisible: false,
		transientMediaId: null,
	};

	toggleModal = ( isModalVisible ) => {
		const { isEditingCoverImage } = this.state;

		this.setState( {
			isModalVisible,
			hasToggledModal: true,
			isEditingCoverImage: isModalVisible ? isEditingCoverImage : false,
		} );
	};

	showModal = () => this.toggleModal( true );

	hideModal = () => this.toggleModal( false );

	editSelectedMedia = ( value ) => {
		if ( value ) {
			this.setState( { isEditingCoverImage: true } );
			this.props.setEditorMediaModalView( ModalViews.IMAGE_EDITOR );
		} else {
			this.hideModal();
		}
	};

	async uploadCoverImage( blob, fileName ) {
		// Upload media using a manually generated ID so that we can continue
		// to reference it within this function
		const transientMediaId = createTransientMediaId( 'podcast-cover-image' );

		this.setState( { transientMediaId } );
		this.onUploadStateChange( true );

		try {
			const file = {
				ID: transientMediaId,
				fileContents: blob,
				fileName,
			};
			const [ uploadedMedia ] = await this.props.addMedia( file, this.props.site );
			debug( 'upload media', uploadedMedia );
			this.props.onSelect( uploadedMedia.ID, uploadedMedia.URL );
		} finally {
			// Remove transient image so that new image shows or if failed upload, the prior image
			this.setState( { transientMediaId: null } );
			this.onUploadStateChange( false );
		}
	}

	onUploadStateChange = ( isUploading ) => {
		this.props.onUploadStateChange( isUploading );
		this.setState( { isUploading } );
	};

	setCoverImage = ( error, blob ) => {
		if ( error || ! blob ) {
			return;
		}

		const { selectedItems } = this.props;
		const selectedItem = selectedItems[ 0 ];
		if ( ! selectedItem ) {
			return;
		}

		debug( 'selectedItem', selectedItem );

		const { crop, transform } = this.props;
		const isImageEdited = ! isEqual(
			{
				...crop,
				...transform,
			},
			{
				topRatio: 0,
				leftRatio: 0,
				widthRatio: 1,
				heightRatio: 1,
				degrees: 0,
				scaleX: 1,
				scaleY: 1,
			}
		);
		debug( 'isImageEdited', isImageEdited, { crop, transform } );

		if ( isImageEdited ) {
			this.uploadCoverImage( blob, `cropped-${ selectedItem.file }` );
		} else {
			this.props.onSelect( selectedItem.ID, selectedItem.URL );
		}

		this.hideModal();
		this.props.resetAllImageEditorState();
	};

	cancelEditingCoverImage = () => {
		this.props.setEditorMediaModalView( ModalViews.LIST );
		this.props.resetAllImageEditorState();
		this.setState( { isEditingCoverImage: false } );
	};

	isParentReady( selectedMedia ) {
		return ! selectedMedia.some( ( item ) => item.external );
	}

	preloadModal() {
		asyncRequire( 'calypso/post-editor/media-modal' );
	}

	renderChangeButton() {
		const { coverImageId, coverImageUrl, translate, isDisabled } = this.props;
		const { isUploading } = this.state;
		const isCoverSet = coverImageId || coverImageUrl;

		return (
			<Button
				className="podcast-cover-image-setting__button"
				compact
				onClick={ this.showModal }
				onMouseEnter={ this.preloadModal }
				disabled={ isDisabled || isUploading }
			>
				{ isCoverSet ? translate( 'Change' ) : translate( 'Add' ) }
			</Button>
		);
	}

	renderCoverPreview() {
		const { coverImageUrl, siteId, translate, isDisabled } = this.props;
		const { transientMediaId, isUploading } = this.state;
		const media = transientMediaId && this.props.getMediaItem( siteId, transientMediaId );
		const imageUrl = ( media && media.URL ) || coverImageUrl;
		const imageSrc = imageUrl && resizeImageUrl( imageUrl, 96 );
		const isTransient = !! transientMediaId;

		const classNames = clsx( 'podcast-cover-image-setting__preview', {
			'is-blank': ! imageSrc,
			'is-transient': isTransient,
			'is-disabled': isDisabled,
		} );

		return (
			<button
				className={ classNames }
				onClick={ this.showModal }
				onMouseEnter={ this.preloadModal }
				type="button" // default is "submit" which saves settings on click
				disabled={ isDisabled || isUploading }
			>
				{ imageSrc ? (
					<Image className="podcast-cover-image-setting__img" src={ imageSrc } alt="" />
				) : (
					<span className="podcast-cover-image-setting__placeholder">
						{ translate( 'No image set' ) }
					</span>
				) }
				{ isTransient && <Spinner /> }
			</button>
		);
	}

	renderMediaModal() {
		const { hasToggledModal, isEditingCoverImage, isModalVisible } = this.state;
		const { siteId, translate } = this.props;

		return (
			hasToggledModal && (
				<AsyncLoad
					require="calypso/post-editor/media-modal"
					placeholder={ <EditorMediaModalDialog isVisible /> }
					siteId={ siteId }
					onClose={ this.editSelectedMedia }
					isParentReady={ this.isParentReady }
					enabledFilters={ [ 'images' ] }
					{ ...( isEditingCoverImage
						? {
								imageEditorProps: {
									allowedAspectRatios: [ AspectRatios.ASPECT_1X1 ],
									onDone: this.setCoverImage,
									onCancel: this.cancelEditingCoverImage,
								},
						  }
						: {} ) }
					visible={ isModalVisible }
					labels={ {
						confirm: translate( 'Continue' ),
					} }
					disableLargeImageSources
					single
				/>
			)
		);
	}

	renderRemoveButton() {
		const { coverImageId, coverImageUrl, onRemove, translate, isDisabled } = this.props;
		const { isUploading } = this.state;
		const isCoverSet = coverImageId || coverImageUrl;

		return (
			isCoverSet && (
				<Button
					className="podcast-cover-image-setting__button"
					compact
					onClick={ onRemove }
					scary
					disabled={ isDisabled || isUploading }
				>
					{ translate( 'Remove' ) }
				</Button>
			)
		);
	}

	render() {
		const { translate } = this.props;

		return (
			<FormFieldset className="podcast-cover-image-setting">
				<FormLabel>{ translate( 'Cover image' ) }</FormLabel>
				{ this.renderCoverPreview() }
				{ this.renderChangeButton() }
				{ this.renderRemoveButton() }
				{ this.renderMediaModal() }
			</FormFieldset>
		);
	}
}

export default connect(
	( state ) => {
		const siteId = getSelectedSiteId( state );

		return {
			siteId,
			site: getSelectedSite( state ),
			crop: getImageEditorCrop( state ),
			transform: getImageEditorTransform( state ),
			selectedItems: getMediaLibrarySelectedItems( state, siteId ),
		};
	},
	{
		resetAllImageEditorState,
		setEditorMediaModalView,
		getMediaItem,
	}
)( localize( withAddMedia( PodcastCoverImageSetting ) ) );
