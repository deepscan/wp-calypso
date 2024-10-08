import { bumpStat } from '../rest-client/bump-stat';
import { store } from '../state';
import actions from '../state/actions';
import getFilterName from '../state/selectors/get-filter-name';
import noteHasFilteredRead from '../state/selectors/note-has-filtered-read';
import Filters from './filters';

function FilterBarController( refreshFunction ) {
	if ( ! ( this instanceof FilterBarController ) ) {
		return new FilterBarController( refreshFunction );
	}

	this.refreshFunction = refreshFunction;
}

FilterBarController.prototype.selectFilter = function ( filterName ) {
	if ( Object.keys( Filters ).indexOf( filterName ) === -1 ) {
		return;
	}

	store.dispatch( actions.ui.setFilter( filterName ) );

	if ( this.refreshFunction ) {
		this.refreshFunction();
	}

	bumpStat( 'notes-filter-select', filterName );
};

FilterBarController.prototype.getFilteredNotes = function ( notes ) {
	const state = store.getState();
	const filterName = getFilterName( state );
	const activeTab = Filters[ filterName ];
	if ( ! notes || ! activeTab ) {
		return [];
	}

	const filterFunction = ( note ) =>
		( 'unread' === filterName && noteHasFilteredRead( state, note.id ) ) ||
		activeTab.filter( note );

	return notes.filter( filterFunction );
};

export default FilterBarController;
