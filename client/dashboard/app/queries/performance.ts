import { queryOptions } from '@tanstack/react-query';
import { fetchBasicMetrics, fetchPerformanceInsights } from '../../data/site-profiler';

export const basicMetricsQuery = ( url: string ) =>
	queryOptions( {
		queryKey: [ 'performance', url, 'basic-metrics' ],
		queryFn: () => fetchBasicMetrics( url ),
	} );

export const performanceInsightsQuery = ( url: string, token: string ) =>
	queryOptions( {
		queryKey: [ 'performance', url, token ],
		queryFn: () => fetchPerformanceInsights( url, token ),
		refetchInterval: ( query ) => {
			if ( query.state.data?.pagespeed?.status === 'completed' ) {
				return false;
			}
			return 5000;
		},
	} );
