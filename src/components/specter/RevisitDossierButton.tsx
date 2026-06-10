import { useState } from "react";
import { Loader2, RotateCcw } from "lucide-react";
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
import { revisitInvestigation } from "@/lib/investigationApi";
import type { InvestigationRecord } from "@/types/investigation";

const RevisitDossierButton = ({
  investigationId,
  subjectName,
  compact = false,
  onRevisited,
}: {
  investigationId: string;
  subjectName: string;
  compact?: boolean;
  onRevisited?: (record: InvestigationRecord) => void;
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [revisiting, setRevisiting] = useState(false);

  const revisit = async () => {
    setRevisiting(true);
    try {
      const record = await revisitInvestigation(investigationId);
      setOpen(false);
      onRevisited?.(record);
      const change = record.revision_summary;
      toast({
        title: `Dossier updated to revision ${record.analysis_revision || 1}`,
        description: change
          ? `${change.added_sources} new, ${change.removed_sources} removed, ${change.retained_sources} retained sources.`
          : "Latest public evidence and scores are ready.",
      });
    } catch {
      toast({
        title: "Could not revisit dossier",
        description:
          "The previous dossier was preserved unchanged. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRevisiting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={compact ? "icon" : "sm"}
          aria-label={`Revisit ${subjectName} dossier`}
        >
          <RotateCcw
            className={`${compact ? "h-4 w-4" : "mr-2 h-3.5 w-3.5"} ${
              revisiting ? "animate-spin" : ""
            }`}
          />
          {!compact && "Revisit analysis"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revisit this dossier?</AlertDialogTitle>
          <AlertDialogDescription>
            Spectre will rerun public discovery and evidence scoring for{" "}
            {subjectName} using current sources and provider settings. The
            existing dossier remains intact if the refresh fails.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={revisiting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={revisiting}
            onClick={(event) => {
              event.preventDefault();
              void revisit();
            }}
          >
            {revisiting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Rerun analysis
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default RevisitDossierButton;
