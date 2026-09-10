import { cn } from '../lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded", className)} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] animate-fade-in transition-all">
      <Skeleton className="h-2.5 w-20 mb-4 bg-[#F1F3F5]" />
      <Skeleton className="h-8 w-24 mb-1 bg-[#F8F9FA]" />
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr className="animate-fade-in border-b border-[#E5E7EB]">
      <td className="px-6 py-5">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-lg bg-[#F8F9FA]" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2 bg-[#F1F3F5]" />
            <Skeleton className="h-2.5 w-48 bg-[#F8F9FA]" />
          </div>
        </div>
      </td>
      <td className="px-6 py-5"><Skeleton className="h-6 w-20 rounded-full bg-[#F8F9FA]" /></td>
      <td className="px-6 py-5"><Skeleton className="h-8 w-16 bg-[#F8F9FA]" /></td>
      <td className="px-6 py-5 align-middle"><Skeleton className="h-10 w-24 ml-auto rounded-lg bg-[#F8F9FA]" /></td>
    </tr>
  );
}


