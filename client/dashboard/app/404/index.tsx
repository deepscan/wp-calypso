import { __ } from '@wordpress/i18n';
import { PageHeader } from '../../components/page-header';
import PageLayout from '../../components/page-layout';
import RouterLinkButton from '../../components/router-link-button';

function NotFound() {
	return (
		<PageLayout
			header={
				<PageHeader
					title={ __( '404 Not Found' ) }
					description={ __( 'The page you are looking for does not exist.' ) }
					actions={
						<RouterLinkButton to="/sites" variant="primary" __next40pxDefaultSize>
							{ __( 'Go to Sites' ) }
						</RouterLinkButton>
					}
				/>
			}
		/>
	);
}

export default NotFound;
