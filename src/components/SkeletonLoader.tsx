import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export const FacilityCardSkeleton = () => (
  <Card>
    <CardContent className="p-4">
      <div className="flex gap-3">
        <Skeleton className="h-6 w-6 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-8 ml-auto rounded" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const CategoryCardSkeleton = () => (
  <Card>
    <CardContent className="p-6">
      <Skeleton className="h-12 w-12 rounded-full mb-4" />
      <Skeleton className="h-5 w-24 mb-2" />
      <Skeleton className="h-4 w-20" />
    </CardContent>
  </Card>
);

export const MapSkeleton = () => (
  <div className="w-full h-full bg-muted animate-pulse rounded-lg flex items-center justify-center">
    <div className="text-muted-foreground">Loading map...</div>
  </div>
);