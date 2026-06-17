import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getWeeklyReviewData } from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;
	if (!user) redirect(303, '/login');

	const reviewData = await getWeeklyReviewData(locals.supabase, user.id);
	return reviewData;
};