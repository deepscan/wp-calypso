/* eslint-disable no-restricted-imports */

import { useSupportStatus } from '../data/use-support-status';
import { useShouldUseWapuu } from './use-should-use-wapuu';

export function useStillNeedHelpURL() {
	const { data: supportStatus, isLoading } = useSupportStatus();
	const shouldUseWapuu = useShouldUseWapuu();
	const isEligibleForSupport = Boolean( supportStatus?.eligibility?.is_user_eligible );

	if ( isEligibleForSupport || shouldUseWapuu ) {
		const url = shouldUseWapuu ? '/odie' : '/contact-form?mode=EMAIL';
		return { url, isLoading: false };
	}

	return { url: '/contact-form?mode=FORUM', isLoading };
}
