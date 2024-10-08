import { useSearchParams } from 'react-router-dom';
import { Primitive } from 'utility-types';
import { addQueryArgs } from 'calypso/lib/url';
import { Navigate, ProvidedDependencies, StepperStep } from '../../internals/types';

interface Options {
	navigate: Navigate< StepperStep[] >;
	persistedUrlParams: string[];
}

export const useFlowNavigator = ( { navigate, persistedUrlParams }: Options ) => {
	const [ query ] = useSearchParams();

	const getFromPropsOrUrl = ( key: string, props?: ProvidedDependencies ): Primitive => {
		const value = props?.[ key ] || query.get( key );
		return typeof value === 'object' ? undefined : ( value as Primitive );
	};

	const navigateWithQueryParams = (
		step: StepperStep,
		keys: string[] = [],
		props: ProvidedDependencies = {},
		options = { replaceHistory: false }
	) => {
		const allKeys = [ ...persistedUrlParams, ...keys ];

		const queryParams = allKeys.reduce(
			( acc, key ) => {
				const value = getFromPropsOrUrl( key, props );
				if ( value ) {
					acc[ key ] = value;
				}
				return acc;
			},
			{} as Record< string, Primitive >
		);

		return navigate( addQueryArgs( queryParams, step.slug ), {}, options.replaceHistory );
	};

	return {
		navigateWithQueryParams,
		getFromPropsOrUrl,
	};
};
