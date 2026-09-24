import { CornerFrame } from '@/components/ui/CornerFrame';

export default function Loading() {
  return (
    <div className="state-screen">
      <div className="state-plate" role="status" aria-live="polite">
        <CornerFrame />
        <p className="state-code">{'// LOADING'}</p>
        <p className="state-title">Preparing the next view…</p>
        <div className="state-bar" aria-hidden="true" />
      </div>
    </div>
  );
}
