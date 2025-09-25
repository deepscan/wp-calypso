import { __ } from '@wordpress/i18n';
import Menu from '../../components/menu';
import { useAppContext } from '../context';

function PrimaryMenu() {
	const { supports } = useAppContext();

	return (
		<Menu>
			{ supports.overview && <Menu.Item to="/overview">{ __( 'Overview' ) }</Menu.Item> }
			{ supports.sites && <Menu.Item to="/sites">{ __( 'Sites' ) }</Menu.Item> }
			{ supports.domains && <Menu.Item to="/domains">{ __( 'Domains' ) }</Menu.Item> }
			{ supports.emails && <Menu.Item to="/emails">{ __( 'Emails' ) }</Menu.Item> }
			{ supports.plugins && <Menu.Item to="/plugins/manage">{ __( 'Plugins' ) }</Menu.Item> }
		</Menu>
	);
}

export default PrimaryMenu;
