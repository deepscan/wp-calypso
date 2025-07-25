import { useEffect } from 'react';
import { useAnalytics } from '../../app/analytics';

export default function ComponentViewTracker( {
	eventName,
	properties,
}: {
	eventName: string;
	properties?: Record< string, unknown >;
} ) {
	const { recordTracksEvent } = useAnalytics();

	useEffect( () => {
		recordTracksEvent( eventName, properties );
	}, [ recordTracksEvent, eventName, JSON.stringify( properties ) ] ); // eslint-disable-line react-hooks/exhaustive-deps

	return null;
}
