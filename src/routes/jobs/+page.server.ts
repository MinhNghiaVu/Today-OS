import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getJobs } from '$lib/db';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = locals;
	if (!user) redirect(303, '/login');

	const jobs = await getJobs(locals.supabase, user.id);
	return { jobs };
};

const JOB_FIELDS = [
	'company', 'role', 'status', 'interview_stage',
	'job_url', 'contact', 'applied_date', 'interviewer', 'notes'
] as const;

export const actions: Actions = {
	add: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const company = (form.get('company') as string)?.trim();
		const role = (form.get('role') as string)?.trim() || null;

		if (!company) return fail(400, { error: 'Company name required' });

		const { error } = await locals.supabase.from('jobs').insert({
			user_id: user.id,
			company,
			role,
			status: 'pending'
		});

		if (error) return fail(500, { error: error.message });
	},

	update: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const id = form.get('id') as string;
		if (!id) return fail(400, { error: 'Missing id' });

		const patch: Record<string, string | null> = {
			updated_at: new Date().toISOString()
		};

		for (const field of JOB_FIELDS) {
			if (form.has(field)) {
				const val = (form.get(field) as string)?.trim() || null;
				patch[field] = val;
			}
		}

		if (form.has('company') && !patch['company']) {
			return fail(400, { error: 'Company name required' });
		}

		const { error } = await locals.supabase
			.from('jobs')
			.update(patch)
			.eq('id', id)
			.eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });
	},

	remove: async ({ locals, request }) => {
		const { user } = locals;
		if (!user) return fail(401);

		const form = await request.formData();
		const id = form.get('id') as string;
		if (!id) return fail(400, { error: 'Missing id' });

		const { error } = await locals.supabase
			.from('jobs')
			.delete()
			.eq('id', id)
			.eq('user_id', user.id);

		if (error) return fail(500, { error: error.message });
	}
};
