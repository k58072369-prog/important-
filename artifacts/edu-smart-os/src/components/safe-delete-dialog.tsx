import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Trash2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RelatedItem {
  label: string;
  count: number;
}

interface SafeDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  itemName: string;
  itemType: string;
  requireTyping?: boolean;
  relatedItems?: RelatedItem[];
  impact?: string;
  loading?: boolean;
}

export function SafeDeleteDialog({
  open,
  onClose,
  onConfirm,
  itemName,
  itemType,
  requireTyping = false,
  relatedItems = [],
  impact,
  loading = false,
}: SafeDeleteDialogProps) {
  const [typedValue, setTypedValue] = useState("");
  const [confirming, setConfirming] = useState(false);

  const canConfirm = !requireTyping || typedValue.trim() === "حذف";

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setConfirming(true);
    try {
      await onConfirm();
      setTypedValue("");
      onClose();
    } finally {
      setConfirming(false);
    }
  };

  const handleClose = () => {
    setTypedValue("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive text-lg">
            <Trash2 className="h-5 w-5" />
            تأكيد الحذف
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-secondary">
                  هل أنت متأكد من حذف هذا {itemType}؟
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  سيتم نقل <span className="font-semibold text-destructive">"{itemName}"</span> إلى سلة المحذوفات ويمكن استعادته لاحقاً.
                </p>
              </div>
            </div>
          </div>

          {relatedItems.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700">العناصر المرتبطة</span>
              </div>
              <div className="space-y-1">
                {relatedItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm text-amber-700">
                    <span>{item.label}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {impact && (
            <div className="p-3 rounded-xl bg-muted/50 border border-border text-sm text-muted-foreground">
              <span className="font-medium text-secondary">تأثير الحذف: </span>
              {impact}
            </div>
          )}

          {requireTyping && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-secondary">
                اكتب <span className="text-destructive font-bold">حذف</span> للتأكيد:
              </p>
              <Input
                value={typedValue}
                onChange={e => setTypedValue(e.target.value)}
                placeholder="اكتب: حذف"
                className={cn(
                  "text-center font-bold",
                  typedValue && typedValue !== "حذف" ? "border-destructive focus-visible:ring-destructive" : "",
                  typedValue === "حذف" ? "border-green-500 focus-visible:ring-green-500" : "",
                )}
                dir="rtl"
                autoFocus
                onKeyDown={e => e.key === "Enter" && handleConfirm()}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 flex-row-reverse sm:flex-row-reverse">
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canConfirm || confirming || loading}
            className="flex-1"
          >
            {confirming ? "جارٍ الحذف..." : "نعم، احذف"}
          </Button>
          <Button variant="outline" onClick={handleClose} disabled={confirming} className="flex-1">
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
