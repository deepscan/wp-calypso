import { useDesktopBreakpoint } from '@automattic/viewport-react';
import clsx from 'clsx';
import { useTranslate } from 'i18n-calypso';
import Markdown from 'react-markdown';
import { PerformanceMetricsItemQueryResponse } from 'calypso/data/site-profiler/types';

interface InsightHeaderProps {
	data: PerformanceMetricsItemQueryResponse;
	index: number;
}
export const InsightHeader: React.FC< InsightHeaderProps > = ( props ) => {
	const isMobile = ! useDesktopBreakpoint();
	const translate = useTranslate();
	const { data, index } = props;
	const title = data.title ?? '';
	const value = data.displayValue ?? '';
	const { type, metricSavings } = data;

	const renderBadge = () => {
		if (
			! metricSavings ||
			! ( metricSavings?.FCP || metricSavings?.LCP || metricSavings?.CLS || metricSavings?.INP )
		) {
			return null;
		}

		return (
			<span className={ clsx( 'impact fail', { 'is-mobile': isMobile } ) }>
				{ translate( 'High Impact' ) }
			</span>
		);
	};

	return (
		<div className="insight-header-container">
			<span className={ clsx( 'counter', { [ type ]: true } ) }>{ index + 1 }</span>
			<div>
				<Markdown
					components={ {
						p( props ) {
							return <p className="title-description">{ props.children }</p>;
						},
						code( props ) {
							return <span className="md-code">{ props.children }</span>;
						},
					} }
				>
					{ title }
				</Markdown>
				{ value && isMobile && (
					<span className={ clsx( 'value is-mobile', { [ type ]: true } ) }> { value }</span>
				) }
				{ value && ! isMobile && (
					<span>
						&nbsp;&minus;&nbsp;
						<span className={ clsx( 'value', { [ type ]: true } ) }> { value }</span>
					</span>
				) }
				{ renderBadge() }
			</div>
		</div>
	);
};
