import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SystemLab } from '@/components/canvas/system/SystemLab';
import { LAB_ENABLED } from '@/lib/lab';

export const metadata: Metadata = {
  title: 'Scene laboratory — Strata',
  robots: { index: false, follow: false },
};

export default function SystemLabPage() {
  if (!LAB_ENABLED) notFound();
  return <SystemLab />;
}
