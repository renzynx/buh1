import { format } from "date-fns";
import { ArrowRight, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBytes } from "@/lib/utils";

interface RecentFile {
  id: string;
  filename: string;
  size: number;
  createdAt: string | Date;
}

interface RecentFilesCardProps {
  files?: RecentFile[];
  isPending?: boolean;
}

export function RecentFilesCard({ files, isPending }: RecentFilesCardProps) {
  return (
    <Card className="col-span-1 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Files</CardTitle>
          <CardDescription>Your most recently uploaded files.</CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="gap-1" asChild>
          <a href="/dashboard/files-manager">
            View All <ArrowRight className="h-4 w-4" />
          </a>
        </Button>
      </CardHeader>
      <CardContent className="px-0 sm:px-6">
        {isPending ? (
          <div className="space-y-2 px-6 sm:px-0">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !files || files.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground px-6 sm:px-0">
            <FileIcon className="h-10 w-10 mb-2 opacity-20" />
            <p>No files uploaded yet.</p>
            <Button variant="link" asChild className="mt-2">
              <a href="/dashboard/uploads">Upload your first file</a>
            </Button>
          </div>
        ) : (
          <div className="px-6 sm:px-0">
            <div className="overflow-x-auto -mx-6 sm:mx-0">
              <div className="px-6 sm:px-0">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">
                          Name
                        </TableHead>
                        <TableHead className="whitespace-nowrap">
                          Size
                        </TableHead>
                        <TableHead className="text-right whitespace-nowrap">
                          Uploaded
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {files.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2 min-w-[180px]">
                              <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">{file.filename}</span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatBytes(file.size)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground whitespace-nowrap">
                            {format(new Date(file.createdAt), "PP")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
