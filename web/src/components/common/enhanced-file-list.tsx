"use client";

import { Download, FileText, Trash2, Eye } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Artifact } from "@/lib/dashboard-api";
import { formatDate, formatFileSize, getFileTypeBadge, isTextFile } from "@/lib/writing-utils";
import { cn } from "@/lib/utils";

interface EnhancedFileListProps {
  files: Artifact[];
  fileType: 'research' | 'export';
  onDownload?: (file: Artifact) => void;
  onDelete?: (file: Artifact) => void;
  onPreview?: (file: Artifact) => void;
}

export function EnhancedFileList({
  files,
  fileType,
  onDownload,
  onDelete,
  onPreview,
}: EnhancedFileListProps) {
  const t = useTranslations("EnhancedFileList");
  const [previewFile, setPreviewFile] = useState<Artifact | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<Artifact | null>(null);

  function handlePreview(file: Artifact) {
    if (isTextFile(file.name)) {
      setPreviewFile(file);
      onPreview?.(file);
    } else {
      // For binary files, just download
      handleDownload(file);
    }
  }

  function handleDownload(file: Artifact) {
    onDownload?.(file);
  }

  function handleDeleteClick(file: Artifact) {
    setDeleteConfirmation(file);
  }

  function confirmDelete() {
    if (deleteConfirmation) {
      onDelete?.(deleteConfirmation);
      setDeleteConfirmation(null);
    }
  }

  return (
    <>
      <div className="space-y-3">
        {files.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="mx-auto size-10 text-muted-foreground/40" />
              <div className="mt-4">
                <div className="text-sm font-medium text-foreground">
                  {fileType === 'research' ? t("noResearchFiles") : t("noExports")}
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {fileType === 'research'
                    ? t("noResearchFilesDesc")
                    : t("noExportsDesc")}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          files.map((file) => {
            const badge = getFileTypeBadge(file.name);
            return (
              <Card key={file.relative_path}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">
                        {file.name}
                      </span>
                      <Badge className={cn("text-xs", badge.variant === 'red' && "text-red-600 bg-red-50 border-red-200", badge.variant === 'blue' && "text-blue-600 bg-blue-50 border-blue-200", badge.variant === 'gray' && "text-gray-600 bg-gray-50 border-gray-200")}>
                        {badge.label}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{file.relative_path}</span>
                      {file.size && <span>{formatFileSize(file.size)}</span>}
                      {file.modified && <span>{formatDate(file.modified)}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isTextFile(file.name) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(file)}
                        className="h-8 w-8 p-0"
                        title="Preview"
                      >
                        <Eye className="size-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file)}
                      className="h-8 w-8 p-0"
                      title="Download"
                    >
                      <Download className="size-3.5" />
                    </Button>
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(file)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewFile !== null} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto">
            <FilePreview file={previewFile} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmation !== null} onOpenChange={() => setDeleteConfirmation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deleteFileTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("deleteConfirmation", { name: deleteConfirmation?.name ?? "" })}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteConfirmation(null)}>
                {t("cancel")}
              </Button>
              <Button variant="outline" onClick={confirmDelete}>
                {t("delete")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FilePreview({ file }: { file: Artifact | null }) {
  const t = useTranslations("EnhancedFileList");
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // In production, you would fetch the file content here
  // For now, show a placeholder
  if (!file) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">{t("loadingPreview")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <pre className="bg-muted/50 rounded-lg p-4 text-sm overflow-x-auto">
      {content || <span className="text-muted-foreground">{t("fileContentPlaceholder")}</span>}
    </pre>
  );
}
