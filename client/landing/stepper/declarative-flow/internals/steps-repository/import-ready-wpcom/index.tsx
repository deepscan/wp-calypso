import React, { useEffect, useCallback } from 'react';
import { ReadyAlreadyOnWPCOMStep } from 'calypso/blocks/import/ready';
import { useAnalyzeUrlQuery } from 'calypso/data/site-profiler/use-analyze-url-query';
import { useQuery } from 'calypso/landing/stepper/hooks/use-query';
import { recordTracksEvent } from 'calypso/lib/analytics/tracks';
import { ImporterPlatform } from 'calypso/lib/importer/types';
import { ImportWrapper } from '../import';
import { BASE_ROUTE } from '../import/config';
import { generateStepPath } from '../import/helper';
import type { Step } from 'calypso/landing/stepper/declarative-flow/internals/types';

const ImportReadyWpcom: Step< {
	submits: {
		platform: ImporterPlatform;
		url: string;
	};
} > = function ImportStep( props ) {
	const { navigation } = props;
	const fromUrl = useQuery().get( 'from' ) || '';
	const { data: urlData, isFetched, isFetching } = useAnalyzeUrlQuery( fromUrl );

	const goToHomeStep = useCallback( () => {
		navigation.goToStep?.( BASE_ROUTE );
	}, [ navigation ] );

	// redirect to home step if urlData is not available
	useEffect( () => {
		isFetched && ! urlData && goToHomeStep();
	}, [ isFetched ] );

	return (
		<ImportWrapper { ...props }>
			{ ! isFetching && urlData && (
				<ReadyAlreadyOnWPCOMStep
					urlData={ urlData }
					goToStep={ ( step, section ) =>
						navigation.goToStep?.( generateStepPath( step, section ) )
					}
					recordTracksEvent={ recordTracksEvent }
				/>
			) }
		</ImportWrapper>
	);
};

export default ImportReadyWpcom;
