import { load, hashComponents, componentsToDebugString } from './agent';
import { x64hash128 } from './utils/hashing';
import type { Agent, GetOptions, GetResult, LoadOptions } from './agent';
import type { BuiltinComponents } from './sources';
import type { Component, UnknownComponents } from './utils/entropy_source';
import type { Confidence } from './confidence';

// Exports that are under Semantic versioning
export { load, hashComponents, componentsToDebugString };
export type {
	Agent,
	BuiltinComponents,
	Component,
	Confidence,
	GetOptions,
	GetResult,
	LoadOptions,
	UnknownComponents,
};

// The default export is a syntax sugar (`import * as FP from '...' → import FP from '...'`).
// It should contain all the public exported values.
export default { load, hashComponents, componentsToDebugString };

// The exports below are for private usage. They may change unexpectedly. Use them at your own risk.
/** Not documented, out of Semantic Versioning, usage is at your own risk */
export const murmurX64Hash128 = x64hash128;
export { prepareForSources } from './agent';
export { sources } from './sources';
export { getScreenFrame } from './sources/screen_frame';
export {
	getFullscreenElement,
	isAndroid,
	isTrident,
	isEdgeHTML,
	isChromium,
	isWebKit,
	isGecko,
	isDesktopSafari,
} from './utils/browser';
export {
	loadSources,
	transformSource, // Not used here but adds only 222 uncompressed (60 compressed) bytes of code
} from './utils/entropy_source';
export type { Source, SourcesToComponents, UnknownSources } from './utils/entropy_source';
export { withIframe } from './utils/dom';
