import { Button } from '@wordpress/components';
import { Icon, external } from '@wordpress/icons';
import { useTranslate } from 'i18n-calypso';
import illustration from 'calypso/assets/images/a8c-for-agencies/request-wp-admin-access-illustration.svg';
import { useDispatch } from 'calypso/state';
import { recordTracksEvent } from 'calypso/state/analytics/actions';

import './style.scss';

export function A4ARequestWPAdminAccess() {
	const translate = useTranslate();
	const dispatch = useDispatch();

	const onLearnMoreClick = () => {
		dispatch( recordTracksEvent( 'calypso_a4a_team_learn_more_wp_admin_access_click' ) );
	};

	const kbArticleUrl =
		'https://agencieshelp.automattic.com/knowledge-base/invite-and-manage-team-members/#allowing-team-members-to-access-wp-admin';

	return (
		<div className="a4a-request-wp-admin-access">
			<div className="a4a-request-wp-admin-access__content">
				<div className="a4a-request-wp-admin-access__heading">
					{ translate( 'Request WP-Admin access' ) }
				</div>
				<div className="a4a-request-wp-admin-access__description">
					{ translate(
						'Ask the Agency owner to provide you WP-Admin access to this site in order to manage its plugins and features.'
					) }
				</div>
				<Button
					variant="link"
					className="a4a-request-wp-admin-access__learn-more-button"
					href={ kbArticleUrl }
					onClick={ onLearnMoreClick }
					target="_blank"
				>
					<>
						{ translate( 'Learn more about team member permissions' ) }
						<Icon icon={ external } size={ 18 } />
					</>
				</Button>
			</div>
			<div className="a4a-request-wp-admin-access__illustration">
				<img src={ illustration } alt="illustration" />
			</div>
		</div>
	);
}
