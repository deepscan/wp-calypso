import { localizeUrl } from '@automattic/i18n-utils';
import { localize } from 'i18n-calypso';
import PropTypes from 'prop-types';
import { Component } from 'react';
import Notice from 'calypso/components/notice';
import NoticeAction from 'calypso/components/notice/notice-action';
import {
	ALREADY_CONNECTED,
	ALREADY_CONNECTED_BY_OTHER_USER,
	DEFAULT_AUTHORIZE_ERROR,
	INSTALL_RESPONSE_ERROR,
	INVALID_CREDENTIALS,
	IS_DOT_COM,
	JETPACK_IS_DISCONNECTED,
	JETPACK_IS_VALID,
	NOT_ACTIVE_JETPACK,
	NOT_CONNECTED_JETPACK,
	NOT_EXISTS,
	NOT_JETPACK,
	NOT_WORDPRESS,
	OUTDATED_JETPACK,
	RETRY_AUTH,
	RETRYING_AUTH,
	SECRET_EXPIRED,
	SITE_BLOCKED,
	USER_IS_ALREADY_CONNECTED_TO_SITE,
	WORDPRESS_DOT_COM,
	XMLRPC_ERROR,
	NOT_CONNECTED_USER,
} from './connection-notice-types';

export class JetpackConnectNotices extends Component {
	static propTypes = {
		// Supply a function that will be called for flow-ending error cases
		// instead of showing a notice.
		onActionClick: PropTypes.func,
		onTerminalError: PropTypes.func,
		noticeType: PropTypes.oneOf( [
			ALREADY_CONNECTED,
			ALREADY_CONNECTED_BY_OTHER_USER,
			DEFAULT_AUTHORIZE_ERROR,
			INSTALL_RESPONSE_ERROR,
			INVALID_CREDENTIALS,
			IS_DOT_COM,
			JETPACK_IS_DISCONNECTED,
			JETPACK_IS_VALID,
			NOT_ACTIVE_JETPACK,
			NOT_CONNECTED_JETPACK,
			NOT_EXISTS,
			NOT_JETPACK,
			NOT_WORDPRESS,
			OUTDATED_JETPACK,
			RETRY_AUTH,
			RETRYING_AUTH,
			SECRET_EXPIRED,
			SITE_BLOCKED,
			USER_IS_ALREADY_CONNECTED_TO_SITE,
			WORDPRESS_DOT_COM,
			XMLRPC_ERROR,
			NOT_CONNECTED_USER,
		] ).isRequired,
		translate: PropTypes.func.isRequired,
		url: PropTypes.string,
	};

	getNoticeValues() {
		const { noticeType, onDismissClick, translate } = this.props;

		const noticeValues = {
			icon: 'notice',
			status: 'is-error',
			text: translate( 'Invalid site address. Enter a valid WordPress URL.' ),
			showDismiss: false,
		};

		if ( onDismissClick ) {
			noticeValues.onDismissClick = onDismissClick;
			noticeValues.showDismiss = true;
		}

		switch ( noticeType ) {
			case NOT_EXISTS:
				noticeValues.userCanRetry = true;
				return noticeValues;

			case SITE_BLOCKED:
				noticeValues.text = translate(
					"This site can't be connected to WordPress.com because it violates our {{a}}Terms of Service{{/a}}.",
					{
						components: {
							a: (
								<a
									href={ localizeUrl( 'https://wordpress.com/tos/' ) }
									rel="noopener noreferrer"
									target="_blank"
								/>
							),
						},
					}
				);
				return noticeValues;

			case IS_DOT_COM:
				noticeValues.status = 'is-success';
				noticeValues.icon = 'plugins';
				noticeValues.text = translate( 'Good news! WordPress.com sites already have Jetpack.' );
				return noticeValues;

			case NOT_WORDPRESS:
				noticeValues.icon = 'block';
				noticeValues.text = translate(
					"This site doesn't appear to use WordPress. Please verify the URL."
				);
				return noticeValues;

			case NOT_ACTIVE_JETPACK:
				// in use in remote install, which automatically redirects to install
				return null;

			case OUTDATED_JETPACK:
				noticeValues.icon = 'block';
				noticeValues.text = translate( 'Update Jetpack to the latest version and try again.' );
				return noticeValues;

			case JETPACK_IS_DISCONNECTED:
				noticeValues.icon = 'link-break';
				noticeValues.text = translate(
					'Jetpack is currently disconnected. Please reconnect it to continue.'
				);
				return noticeValues;

			case JETPACK_IS_VALID:
				noticeValues.status = 'is-success';
				noticeValues.icon = 'plugins';
				noticeValues.text = translate( 'Jetpack is connected.' );
				return noticeValues;

			case NOT_JETPACK:
				// Not notice required, we will move on to installation
				return null;

			case WORDPRESS_DOT_COM:
				noticeValues.text = translate(
					'This is a WordPress.com site, which already includes Jetpack features.'
				);
				noticeValues.status = 'is-warning';
				noticeValues.icon = 'status';
				return noticeValues;

			case RETRYING_AUTH:
				noticeValues.text = translate(
					'Error authorizing. Page is refreshing for another attempt.'
				);
				noticeValues.status = 'is-warning';
				noticeValues.icon = 'notice';
				noticeValues.userCanRetry = true;
				return noticeValues;

			case RETRY_AUTH:
				noticeValues.text = translate(
					'In some cases, authorization can take a few attempts. Please try again.'
				);
				noticeValues.status = 'is-warning';
				noticeValues.icon = 'notice';
				noticeValues.userCanRetry = true;
				return noticeValues;

			case SECRET_EXPIRED:
				noticeValues.text = translate( 'Connection expired. Refresh the page and try again.' );
				noticeValues.status = 'is-error';
				noticeValues.icon = 'notice';
				return noticeValues;

			case DEFAULT_AUTHORIZE_ERROR:
				noticeValues.text = translate(
					'Error authorizing your site. Please {{link}}contact support{{/link}}.',
					{
						components: {
							link: (
								<a
									href="https://jetpack.com/contact-support"
									target="_blank"
									rel="noopener noreferrer"
								/>
							),
						},
					}
				);
				noticeValues.status = 'is-error';
				noticeValues.icon = 'notice';
				return noticeValues;

			case ALREADY_CONNECTED:
				noticeValues.text = translate( 'This site is already connected to WordPress.com.' );
				noticeValues.status = 'is-info';
				noticeValues.icon = 'notice';
				return noticeValues;

			case ALREADY_CONNECTED_BY_OTHER_USER:
				noticeValues.text = translate(
					'This site is already connected to a different WordPress.com user, ' +
						'you need to disconnect that user before you can connect another.'
				);
				noticeValues.status = 'is-warning';
				noticeValues.icon = 'notice';
				return noticeValues;

			case USER_IS_ALREADY_CONNECTED_TO_SITE:
				noticeValues.text = translate(
					'This WordPress.com account is already connected to another user on this site. ' +
						'Please login to another WordPress.com account to complete the connection.'
				);
				noticeValues.status = 'is-warning';
				noticeValues.icon = 'notice';
				return noticeValues;

			case XMLRPC_ERROR:
				noticeValues.text = translate(
					"Can't connect to your site. Check if it's accessible and try again."
				);
				return noticeValues;

			case INVALID_CREDENTIALS:
				noticeValues.text = translate(
					'Invalid credentials. Check your account information and try again.'
				);
				noticeValues.status = 'is-error';
				noticeValues.icon = 'notice';
				return noticeValues;
		}
	}

	getNoticeActionText() {
		const { noticeType, translate } = this.props;

		switch ( noticeType ) {
			case XMLRPC_ERROR:
				return translate( 'Try again' );
		}

		return null;
	}

	componentDidUpdate() {
		if ( this.errorIsTerminal() && this.props.onTerminalError ) {
			this.props.onTerminalError( this.props.noticeType );
		}
	}

	componentDidMount() {
		if ( this.errorIsTerminal() && this.props.onTerminalError ) {
			this.props.onTerminalError( this.props.noticeType );
		}
	}

	errorIsTerminal() {
		const notice = this.getNoticeValues();
		return notice && ! notice.userCanRetry;
	}

	renderNoticeAction() {
		const { onActionClick } = this.props;
		const noticeActionText = this.getNoticeActionText();

		if ( ! onActionClick || ! noticeActionText ) {
			return null;
		}

		return <NoticeAction onClick={ onActionClick }>{ noticeActionText }</NoticeAction>;
	}

	render() {
		const noticeValues = this.getNoticeValues();
		if ( this.errorIsTerminal() && this.props.onTerminalError ) {
			return null;
		}
		if ( noticeValues ) {
			return (
				<div className="jetpack-connect__notices-container">
					<Notice { ...noticeValues }>{ this.renderNoticeAction() }</Notice>
				</div>
			);
		}
		return null;
	}
}

export default localize( JetpackConnectNotices );
