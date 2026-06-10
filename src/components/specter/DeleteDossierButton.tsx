import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { deleteInvestigation } from "@/lib/investigationApi";

const DeleteDossierButton = ({
  investigationId,
  subjectName,
  compact = false,
  onDeleted,
}: {
  investigationId: string;
  subjectName: string;
  compact?: boolean;
  onDeleted?: () => void;
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const remove = async () => {
    setDeleting(true);
    try {
      await deleteInvestigation(investigationId);
      setOpen(false);
      onDeleted?.();
      toast({ title: "Dossier deleted" });
    } catch {
      toast({
        title: "Could not delete dossier",
        description: "Dossier remains unchanged. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={compact ? "icon" : "sm"}
          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Delete ${subjectName} dossier`}
        >
          <Trash2 className={compact ? "h-4 w-4" : "mr-2 h-3.5 w-3.5"} />
          {!compact && "Delete dossier"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this dossier?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes {subjectName}, its sources, claims, signals,
            operation receipts, and voice-session history. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={deleting}
            onClick={(event) => {
              event.preventDefault();
              void remove();
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteDossierButton;
