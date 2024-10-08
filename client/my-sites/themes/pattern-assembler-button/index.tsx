import { Button } from '@automattic/components';
import { useTranslate } from 'i18n-calypso';
import { useIsSiteAssemblerEnabled } from 'calypso/data/site-assembler';
import './style.scss';

type Props = {
	isPrimary?: boolean;
	onClick: () => void;
};

export default function PatternAssemblerButton( { isPrimary, onClick }: Props ) {
	const translate = useTranslate();
	const isSiteAssemblerEnabled = useIsSiteAssemblerEnabled();

	if ( ! isSiteAssemblerEnabled ) {
		return null;
	}

	return (
		<Button className="themes__pattern-assembler-button" primary={ isPrimary } onClick={ onClick }>
			{ translate( 'Design your own' ) }
		</Button>
	);
}
