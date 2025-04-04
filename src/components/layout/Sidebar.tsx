"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  PlusIcon, 
  HistoryIcon, 
  SettingsIcon, 
  BookOpenIcon,
  BoxesIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface SidebarNavProps {
  className?: string;
}

export function Sidebar({ className }: SidebarNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: 'Dashboard',
      href: '/',
      icon: HomeIcon,
    },
    {
      title: 'New Prompt',
      href: '/prompt/new',
      icon: PlusIcon,
    },
    {
      title: 'History',
      href: '/history',
      icon: HistoryIcon,
    },
    {
      title: 'Models',
      href: '/models',
      icon: BoxesIcon,
    },
    {
      title: 'Documentation',
      href: '/docs',
      icon: BookOpenIcon,
    },
    {
      title: 'Settings',
      href: '/settings',
      icon: SettingsIcon,
    },
  ];

  return (
    <div className={cn('pb-12 w-64 border-r h-screen', className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            Navigation
          </h2>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  'w-full justify-start',
                  pathname === item.href && 'bg-muted'
                )}
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </Button>
            ))}
          </div>
        </div>
        <Separator />
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            Recent Prompts
          </h2>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground px-2">
              Your recent prompts will appear here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
