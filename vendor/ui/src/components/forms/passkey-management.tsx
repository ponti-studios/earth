import { KeyRound, Plus, Trash2, X } from "lucide-react";
import { useCallback, useState } from "react";

import { Spinner } from "../feedback/spinner";
import { Button } from "../primitives/button";
import { Card, CardHeader } from "../primitives/card";

export interface PasskeyRecord {
  id: string;
  name?: string;
  createdAt?: string;
}

export interface PasskeyManagementProps {
  passkeys?: PasskeyRecord[];
  isLoading?: boolean;
  error?: string | null;
  onAdd: () => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

type PasskeyActionError = {
  message: string;
  passkeyId?: string;
};

/** List, add, and remove passkeys. The host app owns the WebAuthn ceremony via `onAdd`/`onDelete`. */
export function PasskeyManagement({
  passkeys: passkeysProp,
  isLoading = false,
  error: externalError,
  onAdd,
  onDelete,
}: PasskeyManagementProps) {
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<PasskeyActionError | null>(null);

  const passkeys = passkeysProp ?? [];
  const error = externalError ?? (actionError?.passkeyId ? null : actionError?.message);

  const handleAdd = useCallback(async () => {
    setAdding(true);
    setActionError(null);
    try {
      const success = await onAdd();
      if (!success) {
        setActionError({ message: "Passkey registration was cancelled or failed." });
      }
    } catch {
      setActionError({ message: "An error occurred during passkey registration." });
    } finally {
      setAdding(false);
    }
  }, [onAdd]);

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id);
      setActionError(null);
      try {
        const success = await onDelete(id);
        if (!success) {
          throw new Error("Failed to delete passkey");
        }
      } catch {
        setActionError({
          message: "Could not delete passkey. Please try again.",
          passkeyId: id,
        });
      } finally {
        setDeletingId(null);
      }
    },
    [onDelete],
  );

  return (
    <Card aria-labelledby="passkey-heading" className="gap-0 overflow-hidden w-full">
      <CardHeader className="flex-row items-center border-b p-4">
        <h2 id="passkey-heading" className="text-foreground text-sm font-medium">
          Passkeys
        </h2>
        <Button
          type="button"
          size="sm"
          onClick={() => void handleAdd()}
          isLoading={adding}
          loadingLabel="Adding passkey"
          aria-label="Add a passkey"
          className="ml-auto"
        >
          <Plus className="size-4" aria-hidden />
        </Button>
      </CardHeader>

      {error ? (
        <p role="alert" className="text-destructive-text border-b px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      {isLoading ? (
        <Spinner presentation="centered" size="sm" label="Loading passkeys" />
      ) : passkeys.length === 0 ? (
        <div className="text-muted-foreground flex items-center gap-3 p-4 text-sm">
          <KeyRound className="size-4 shrink-0" aria-hidden />
          <span>No passkeys registered. Add one to sign in faster.</span>
        </div>
      ) : (
        <ul className="divide-border divide-y" aria-label="Registered passkeys">
          {passkeys.map((pk) => {
            const rowError = actionError?.passkeyId === pk.id ? actionError.message : null;

            return (
              <li key={pk.id} className="flex flex-col gap-2 px-4 py-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <KeyRound className="text-muted-foreground size-4 shrink-0" aria-hidden />
                    <div className="min-w-0">
                      <span className="font-medium">{pk.name ?? "Passkey"}</span>
                      {pk.createdAt ? (
                        <span className="text-muted-foreground ml-2 text-xs">
                          Added {new Date(pk.createdAt).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleDelete(pk.id)}
                    disabled={deletingId === pk.id}
                    aria-busy={deletingId === pk.id}
                    aria-label={`Remove passkey ${pk.name ?? pk.id}`}
                    className="hover:text-destructive-text text-muted-foreground focus-visible:ring-ring rounded-sm focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
                  >
                    {deletingId === pk.id ? (
                      <Spinner size="sm" aria-hidden />
                    ) : (
                      <Trash2 className="size-4" aria-hidden />
                    )}
                  </button>
                </div>
                {rowError ? (
                  <div
                    role="alert"
                    className="bg-destructive/5 text-destructive-text flex items-start justify-between gap-3 rounded-md px-3 py-2 text-sm"
                  >
                    <span>{rowError}</span>
                    <button
                      type="button"
                      onClick={() => setActionError(null)}
                      aria-label="Dismiss passkey error"
                      title="Dismiss error"
                      className="hover:text-destructive focus-visible:ring-ring -m-1 shrink-0 rounded-sm p-1 focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
