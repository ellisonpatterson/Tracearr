import { Activity, Play, Clock, AlertTriangle, Tv, Radio } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { NowPlayingCard } from '@/components/sessions';
import { StreamCard } from '@/components/map';
import { useDashboardStats, useActiveSessions } from '@/hooks/queries';
import { cn } from '@/lib/utils';

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: sessions } = useActiveSessions();

  const activeCount = sessions?.length ?? 0;
  const hasActiveStreams = activeCount > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {hasActiveStreams ? (
              <>
                <span className="inline-flex items-center gap-1.5">
                  <Radio className="h-3 w-3 animate-pulse text-primary" />
                  {activeCount} active {activeCount === 1 ? 'stream' : 'streams'}
                </span>
              </>
            ) : (
              'Monitor your server activity in real-time'
            )}
          </p>
        </div>
      </div>

      {/* Hero Stats Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Streams - highlighted */}
        <Card
          className={cn(
            'relative overflow-hidden transition-colors',
            hasActiveStreams && 'border-primary/50 bg-primary/5'
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Streams</CardTitle>
            <div className="relative">
              <Activity className="h-4 w-4 text-primary" />
              {hasActiveStreams && (
                <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="mt-1 h-4 w-24" />
              </>
            ) : (
              <>
                <div className="text-3xl font-bold">{activeCount}</div>
                <p className="text-xs text-muted-foreground">
                  {hasActiveStreams ? 'Currently streaming' : 'No active streams'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="mt-1 h-4 w-24" />
              </>
            ) : (
              <>
                <div className="text-3xl font-bold">{stats?.alertsLast24h ?? 0}</div>
                <p className="text-xs text-muted-foreground">Last 24 hours</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Today's Plays */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plays Today</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="mt-1 h-4 w-24" />
              </>
            ) : (
              <>
                <div className="text-3xl font-bold">{stats?.todayPlays ?? 0}</div>
                <p className="text-xs text-muted-foreground">Streams started</p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Watch Time Today */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Watch Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="mt-1 h-4 w-24" />
              </>
            ) : (
              <>
                <div className="text-3xl font-bold">
                  {stats?.watchTimeHours ?? 0}
                  <span className="text-lg font-normal text-muted-foreground">h</span>
                </div>
                <p className="text-xs text-muted-foreground">Total today</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Now Playing Section */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Tv className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Now Playing</h2>
          {hasActiveStreams && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {activeCount} {activeCount === 1 ? 'stream' : 'streams'}
            </span>
          )}
        </div>

        {!sessions || sessions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4">
                <Tv className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 font-semibold">No active streams</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Active streams will appear here when users start watching
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sessions.map((session) => (
              <NowPlayingCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </section>

      {/* Stream Map */}
      <section>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Stream Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <StreamCard sessions={sessions} height={320} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
