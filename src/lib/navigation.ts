import {
	Activity,
	Briefcase,
	CalendarDays,
	CheckSquare,
	FileText,
	Settings2,
	Sun
} from 'lucide-svelte';

export const appNavItems = [
	{ href: '/today', label: 'Today', icon: Sun, mobilePrimary: true },
	{ href: '/todos', label: 'Todos', icon: CheckSquare, mobilePrimary: true },
	{ href: '/habits', label: 'Habits', icon: Activity, mobilePrimary: true },
	{ href: '/notes', label: 'Notes', icon: FileText, mobilePrimary: true },
	{ href: '/calendar', label: 'Calendar', icon: CalendarDays, mobilePrimary: false },
	{ href: '/jobs', label: 'Jobs', icon: Briefcase, mobilePrimary: false },
	{ href: '/settings', label: 'Settings', icon: Settings2, mobilePrimary: false }
];

export const mobilePrimaryNavItems = appNavItems.filter((item) => item.mobilePrimary);

export function isNavItemActive(pathname: string, href: string): boolean {
	return pathname === href || pathname.startsWith(`${href}/`);
}
