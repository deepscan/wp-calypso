import { Onboard } from '@automattic/data-stores';
import { useTranslate } from 'i18n-calypso';
import { useMemo } from 'react';
import { loadExperimentAssignment } from 'calypso/lib/explat';
import { shuffleArray } from '../../../../utils/shuffle-array';
import type { Goal } from './types';

const SiteGoal = Onboard.SiteGoal;

export const useGoals = (): Goal[] => {
	loadExperimentAssignment( 'calypso_design_picker_image_optimization_202406' ); // Temporary for A/B test.

	const translate = useTranslate();

	return useMemo( () => {
		const goals = [
			{
				key: SiteGoal.Write,
				title: translate( 'Publish a blog' ),
			},
			{
				key: SiteGoal.Engagement,
				title: translate( 'Build and grow an audience' ),
			},
			{
				key: SiteGoal.CollectDonations,
				title: translate( 'Collect donations' ),
			},
			{
				key: SiteGoal.Porfolio,
				title: translate( 'Showcase a portfolio' ),
			},
			{
				key: SiteGoal.BuildNonprofit,
				title: translate( 'Build a school or nonprofit site' ),
			},
			{
				key: SiteGoal.Newsletter,
				title: translate( 'Create a newsletter' ),
			},
			{
				key: SiteGoal.SellDigital,
				title: translate( 'Sell services or digital goods' ),
			},
			{
				key: SiteGoal.SellPhysical,
				title: translate( 'Sell physical goods' ),
			},
			{
				key: SiteGoal.Promote,
				title: translate( 'Promote a business' ),
			},
			{
				key: SiteGoal.Courses,
				title: translate( 'Create a course' ),
			},
			{
				key: SiteGoal.ContactForm,
				title: translate( 'Allow people to contact you' ),
			},
			{
				key: SiteGoal.Videos,
				title: translate( 'Share video content' ),
			},
			{
				key: SiteGoal.PaidSubscribers,
				title: translate( 'Offer paid content to members' ),
			},
			{
				key: SiteGoal.AnnounceEvents,
				title: translate( 'Announce events' ),
			},
		];

		return shuffleArray( goals );
	}, [ translate ] );
};
