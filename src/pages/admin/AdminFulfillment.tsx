import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAdminFulfillment, FulfillmentStatus } from '@/hooks/useAdminFulfillment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  RefreshCw,
  Eye,
  Ban,
  CheckCheck,
  Package,
  Mail,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { id } from 'date-fns/locale';

const statusConfig: Record<FulfillmentStatus, { label: string; icon: typeof Clock; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Pending', icon: Clock, variant: 'secondary' },
  PROCESSING: { label: 'Processing', icon: Loader2, variant: 'default' },
  COMPLETED: { label: 'Completed', icon: CheckCircle, variant: 'outline' },
  FAILED: { label: 'Failed', icon: XCircle, variant: 'destructive' },
};

export default function AdminFulfillment() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const statusFilter = activeTab === 'all' ? undefined : (activeTab.toUpperCase() as FulfillmentStatus);
  
  const { jobs, stats, isLoading, retryJob, cancelJob, markCompleted } = useAdminFulfillment(statusFilter);

  return (
    <AdminLayout title="Fulfillment Jobs" description="Monitor dan kelola proses fulfillment order">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats?.PENDING || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4" /> Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.PROCESSING || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats?.COMPLETED || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4" /> Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.FAILED || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-0">
            <TabsList>
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="failed">Failed</TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent className="pt-4">
            <TabsContent value={activeTab} className="m-0">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : jobs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Tidak ada fulfillment job
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job Info</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Attempts</TableHead>
                        <TableHead>Waktu</TableHead>
                        <TableHead className="w-[80px]">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job) => {
                        const StatusIcon = statusConfig[job.status].icon;
                        return (
                          <TableRow key={job.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {job.job_type === 'STOCK' ? (
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                )}
                                <div>
                                  <div className="font-mono text-xs text-muted-foreground">
                                    {job.id.slice(0, 8)}...
                                  </div>
                                  <div className="text-xs">{job.job_type}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">
                                {job.order_item?.order?.customer_name || '-'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {job.order_item?.order?.customer_email || '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {job.order_item?.product?.name || '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {job.provider_account?.provider?.name || '-'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {job.provider_account?.name || '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusConfig[job.status].variant} className="gap-1">
                                <StatusIcon className={`h-3 w-3 ${job.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                                {statusConfig[job.status].label}
                              </Badge>
                              {job.last_error && (
                                <div className="text-xs text-destructive mt-1 max-w-[200px] truncate" title={job.last_error}>
                                  {job.last_error}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {job.attempts} / {job.max_attempts}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(job.created_at), { 
                                  addSuffix: true,
                                  locale: id 
                                })}
                              </div>
                              {job.completed_at && (
                                <div className="text-xs text-success">
                                  Selesai {format(new Date(job.completed_at), 'HH:mm')}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <JobDetailDialog job={job} />
                                  
                                  {(job.status === 'FAILED' || job.status === 'PENDING') && (
                                    <DropdownMenuItem
                                      onClick={() => retryJob.mutate(job.id)}
                                      disabled={retryJob.isPending}
                                    >
                                      <RefreshCw className="h-4 w-4 mr-2" />
                                      Retry
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {(job.status === 'PENDING' || job.status === 'PROCESSING') && (
                                    <DropdownMenuItem
                                      onClick={() => markCompleted.mutate({ jobId: job.id })}
                                      disabled={markCompleted.isPending}
                                    >
                                      <CheckCheck className="h-4 w-4 mr-2" />
                                      Tandai Selesai
                                    </DropdownMenuItem>
                                  )}
                                  
                                  {job.status !== 'COMPLETED' && job.status !== 'FAILED' && (
                                    <DropdownMenuItem
                                      onClick={() => cancelJob.mutate(job.id)}
                                      disabled={cancelJob.isPending}
                                      className="text-destructive"
                                    >
                                      <Ban className="h-4 w-4 mr-2" />
                                      Batalkan
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </AdminLayout>
  );
}

// Job Detail Dialog Component
function JobDetailDialog({ job }: { job: ReturnType<typeof useAdminFulfillment>['jobs'][0] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Eye className="h-4 w-4 mr-2" />
          Lihat Detail
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detail Fulfillment Job</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4">
            {/* Job Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Job ID</label>
                <p className="font-mono text-sm">{job.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <p className="text-sm">{job.job_type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <Badge variant={statusConfig[job.status].variant} className="mt-1">
                  {job.status}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Attempts</label>
                <p className="text-sm">{job.attempts} / {job.max_attempts}</p>
              </div>
            </div>

            {/* Timestamps */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Waktu</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-muted-foreground">Dibuat</label>
                  <p>{format(new Date(job.created_at), 'dd MMM yyyy HH:mm:ss', { locale: id })}</p>
                </div>
                {job.started_at && (
                  <div>
                    <label className="text-muted-foreground">Mulai</label>
                    <p>{format(new Date(job.started_at), 'dd MMM yyyy HH:mm:ss', { locale: id })}</p>
                  </div>
                )}
                {job.completed_at && (
                  <div>
                    <label className="text-muted-foreground">Selesai</label>
                    <p>{format(new Date(job.completed_at), 'dd MMM yyyy HH:mm:ss', { locale: id })}</p>
                  </div>
                )}
                {job.next_retry_at && (
                  <div>
                    <label className="text-muted-foreground">Retry Berikutnya</label>
                    <p>{format(new Date(job.next_retry_at), 'dd MMM yyyy HH:mm:ss', { locale: id })}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Info */}
            {job.order_item?.order && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Customer</h4>
                <div className="text-sm">
                  <p><strong>Nama:</strong> {job.order_item.order.customer_name}</p>
                  <p><strong>Email:</strong> {job.order_item.order.customer_email}</p>
                  <p><strong>Order ID:</strong> <span className="font-mono">{job.order_item.order_id}</span></p>
                </div>
              </div>
            )}

            {/* Product Info */}
            {job.order_item?.product && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Product</h4>
                <p className="text-sm">{job.order_item.product.name}</p>
              </div>
            )}

            {/* Input Data */}
            {job.order_item?.input_data && Object.keys(job.order_item.input_data).length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Input Data</h4>
                <pre className="bg-muted p-3 rounded-md text-xs overflow-auto">
                  {JSON.stringify(job.order_item.input_data, null, 2)}
                </pre>
              </div>
            )}

            {/* Provider Info */}
            {job.provider_account && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Provider Account</h4>
                <p className="text-sm">
                  {job.provider_account.provider?.name} - {job.provider_account.name}
                </p>
              </div>
            )}

            {/* Error */}
            {job.last_error && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 text-destructive">Error</h4>
                <pre className="bg-destructive/10 text-destructive p-3 rounded-md text-xs whitespace-pre-wrap">
                  {job.last_error}
                </pre>
              </div>
            )}

            {/* Result */}
            {job.result && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2 text-success">Result</h4>
                <pre className="bg-success/10 p-3 rounded-md text-xs overflow-auto">
                  {JSON.stringify(job.result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
