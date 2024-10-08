import { clsx } from 'clsx';
import { Metrics } from 'calypso/data/site-profiler/types';
import { CircularPerformanceScore } from 'calypso/hosting/performance/components/circular-performance-score/circular-performance-score';
import { recordTracksEvent } from 'calypso/lib/analytics/tracks';
import {
	metricsNames,
	mapThresholdsToStatus,
	displayValue,
} from 'calypso/performance-profiler/utils/metrics';
import { StatusIndicator } from '../status-indicator';
import './style_v2.scss';

type Props = Record< Metrics, number > & {
	activeTab: Metrics;
	setActiveTab: ( tab: Metrics ) => void;
	showOverall?: boolean;
};

const MetricTabBarV2 = ( props: Props ) => {
	const { activeTab, setActiveTab, showOverall } = props;

	const handleTabClick = ( tab: Metrics ) => {
		setActiveTab( tab );
		recordTracksEvent( 'calypso_performance_profiler_metric_tab_click', { tab } );
	};

	return (
		<div className="metric-tab-bar-v2">
			{ showOverall && (
				<button
					className={ clsx( 'metric-tab-bar-v2__tab metric-tab-bar-v2__performance', {
						active: activeTab === 'overall',
					} ) }
					onClick={ () => handleTabClick( 'overall' ) }
				>
					<div className="metric-tab-bar-v2__tab-text">
						<div
							className="metric-tab-bar-v2__tab-header"
							css={ {
								marginBottom: '6px',
							} }
						>
							Performance Score
						</div>
						<div className="metric-tab-bar-v2__tab-metric">
							<CircularPerformanceScore score={ props.overall } size={ 48 } />
						</div>
					</div>
				</button>
			) }
			<div className="metric-tab-bar-v2__tab-container">
				{ Object.entries( metricsNames ).map( ( [ key, { name: displayName } ] ) => {
					if ( props[ key as Metrics ] === undefined || props[ key as Metrics ] === null ) {
						return null;
					}

					// Only display TBT if INP is not available
					if ( key === 'tbt' && props[ 'inp' ] !== undefined && props[ 'inp' ] !== null ) {
						return null;
					}

					if ( key === 'overall' ) {
						return null;
					}

					const status = mapThresholdsToStatus( key as Metrics, props[ key as Metrics ] );
					const statusClassName = status === 'needsImprovement' ? 'needs-improvement' : status;

					return (
						<button
							key={ key }
							className={ clsx( 'metric-tab-bar-v2__tab', { active: key === activeTab } ) }
							onClick={ () => handleTabClick( key as Metrics ) }
						>
							<div className="metric-tab-bar-v2__tab-status">
								<StatusIndicator
									speed={ mapThresholdsToStatus( key as Metrics, props[ key as Metrics ] ) }
								/>
							</div>
							<div className="metric-tab-bar-v2__tab-text">
								<div className="metric-tab-bar-v2__tab-header">{ displayName }</div>
								<div className={ `metric-tab-bar-v2__tab-metric ${ statusClassName }` }>
									{ displayValue( key as Metrics, props[ key as Metrics ] ) }
								</div>
							</div>
						</button>
					);
				} ) }
			</div>
		</div>
	);
};

export default MetricTabBarV2;
