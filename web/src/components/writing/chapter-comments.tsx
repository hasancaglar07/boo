"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Check, X, Search, Filter, Reply, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ChapterComment, ChapterCommentReply } from "@/types/advanced-features";
import {
  addComment,
  addReply,
  toggleCommentResolved,
  getUnresolvedCount,
  STORAGE_KEYS,
  saveToLocalStorage,
  loadFromLocalStorage,
} from "@/lib/advanced-utils";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "@/lib/writing-utils";

interface ChapterCommentsProps {
  slug: string;
  chapterIndex: number;
  chapterTitle: string;
  author: string;
  onCommentsChange?: (count: number) => void;
}

export function ChapterComments({
  slug,
  chapterIndex,
  chapterTitle,
  author,
  onCommentsChange,
}: ChapterCommentsProps) {
  const [comments, setComments] = useState<Record<number, ChapterComment[]>>(() =>
    loadFromLocalStorage<Record<number, ChapterComment[]>>(STORAGE_KEYS.comments(slug), {})
  );
  const [isOpen, setIsOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterResolved, setFilterResolved] = useState<"all" | "unresolved" | "resolved">("all");

  const chapterComments = comments[chapterIndex] || [];
  const unresolvedCount = getUnresolvedCount(comments);

  // Notify parent of comment count changes
  useEffect(() => {
    onCommentsChange?.(unresolvedCount);
  }, [unresolvedCount, onCommentsChange]);

  // Save to localStorage when comments change
  useEffect(() => {
    saveToLocalStorage(STORAGE_KEYS.comments(slug), comments);
  }, [comments, slug]);

  function handleAddComment() {
    if (!newComment.trim()) return;

    const comment = addComment(comments, chapterIndex, newComment.trim(), author);
    setComments({ ...comments });
    setNewComment("");
  }

  function handleAddReply(commentId: string) {
    if (!replyText.trim()) return;

    addReply(comments, chapterIndex, commentId, replyText.trim(), author);
    setComments({ ...comments });
    setReplyText("");
    setReplyTo(null);
  }

  function handleToggleResolved(commentId: string) {
    toggleCommentResolved(comments, chapterIndex, commentId);
    setComments({ ...comments });
  }

  function handleDeleteComment(commentId: string) {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    const updated = { ...comments };
    updated[chapterIndex] = updated[chapterIndex].filter(c => c.id !== commentId);
    setComments(updated);
  }

  function handleDeleteReply(commentId: string, replyId: string) {
    if (!confirm("Are you sure you want to delete this reply?")) return;

    const updated = { ...comments };
    const chapterComments = updated[chapterIndex];
    if (!chapterComments) return;

    const comment = chapterComments.find(c => c.id === commentId);
    if (!comment) return;

    comment.replies = comment.replies.filter(r => r.id !== replyId);
    setComments(updated);
  }

  const filteredComments = chapterComments
    .filter(c => {
      if (filterResolved === "unresolved" && c.resolved) return false;
      if (filterResolved === "resolved" && !c.resolved) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          c.text.toLowerCase().includes(query) ||
          c.replies.some(r => r.text.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => {
      // Show unresolved first, then by date (newest first)
      if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 relative"
        onClick={() => setIsOpen(true)}
      >
        <MessageSquare className="size-3.5" />
        Comments
        {unresolvedCount > 0 && (
          <Badge
            className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center p-0 text-xs bg-red-500 text-white border-red-500"
          >
            {unresolvedCount}
          </Badge>
        )}
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Comments - {chapterTitle}</span>
            <Badge className="bg-secondary text-secondary-foreground">{chapterComments.length} total</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Add Comment */}
          <div className="space-y-2">
            <Label>Add Comment</Label>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment about this chapter..."
              rows={3}
              className="resize-none"
            />
            <Button onClick={handleAddComment} disabled={!newComment.trim()} size="sm">
              Add Comment
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search comments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <select
              value={filterResolved}
              onChange={(e) => setFilterResolved(e.target.value as "all" | "unresolved" | "resolved")}
              className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            >
              <option value="all">All</option>
              <option value="unresolved">Unresolved</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Comments List */}
          <div className="space-y-3">
            {filteredComments.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  {searchQuery || filterResolved !== "all"
                    ? "No comments match your search."
                    : "No comments yet. Add your first comment above."}
                </CardContent>
              </Card>
            ) : (
              filteredComments.map((comment) => (
                <Card key={comment.id} className={comment.resolved ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">{comment.author}</span>
                          <Badge className={comment.resolved ? "bg-secondary text-secondary-foreground text-xs" : "bg-default text-default-foreground text-xs"}>
                            {comment.resolved ? "Resolved" : "Open"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.timestamp))}
                          </span>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{comment.text}</p>

                        {/* Replies */}
                        {comment.replies.length > 0 && (
                          <div className="ml-4 mt-2 space-y-2 border-l-2 border-border/60 pl-3">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-foreground">{reply.author}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(reply.timestamp))}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">{reply.text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Input */}
                        {replyTo === comment.id ? (
                          <div className="space-y-2 mt-2">
                            <Textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write a reply..."
                              rows={2}
                              className="resize-none"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleAddReply(comment.id)}>
                                Reply
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setReplyTo(null);
                                  setReplyText("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 h-7 px-2 text-xs"
                            onClick={() => setReplyTo(comment.id)}
                          >
                            <Reply className="size-3" />
                            Reply
                          </Button>
                        )}
                      </div>

                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleResolved(comment.id)}
                          className="h-8 w-8 p-0"
                          title={comment.resolved ? "Mark as unresolved" : "Mark as resolved"}
                        >
                          {comment.resolved ? (
                            <X className="size-3.5" />
                          ) : (
                            <Check className="size-3.5" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="Delete comment"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
