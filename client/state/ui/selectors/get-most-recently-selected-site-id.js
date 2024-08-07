import 'calypso/state/ui/init';

/**
 * Returns the currently selected site ID.
 * @returns {?number}       Selected site ID
 */
export default function getMostRecentlySelectedSiteId( state ) {
	return state.ui.mostRecentlySelectedSiteId;
}
