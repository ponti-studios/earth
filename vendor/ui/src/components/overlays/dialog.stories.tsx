import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";

import { booleanControl, hiddenControl } from "../../storybook/controls";
import { Button } from "../primitives/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

const meta = {
  title: "Overlays/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  argTypes: {
    open: booleanControl("Controls whether the dialog is open", true),
    modal: booleanControl("Whether interaction outside the dialog is disabled when open", true),
    defaultOpen: hiddenControl,
    onOpenChange: hiddenControl,
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function DialogPreview({
  open,
  modal,
  children,
}: {
  open: boolean;
  modal: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} modal={modal}>
      {children}
    </Dialog>
  );
}

export const Default: Story = {
  args: {
    open: true,
    modal: true,
  },
  render: (args) => (
    <DialogPreview open={Boolean(args.open ?? true)} modal={Boolean(args.modal ?? true)}>
      <DialogTrigger asChild>
        <Button variant="outline">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              defaultValue="Pedro Duarte"
              className="col-span-3 h-9 rounded-md border px-3 text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </DialogPreview>
  ),
};

export const WithCloseButton: Story = {
  args: {
    open: true,
    modal: true,
  },
  render: (args) => (
    <DialogPreview open={Boolean(args.open ?? true)} modal={Boolean(args.modal ?? true)}>
      <DialogTrigger asChild>
        <Button>Open</Button>
      </DialogTrigger>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Confirmation</DialogTitle>
          <DialogDescription>Are you sure you want to proceed?</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Confirm</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </DialogPreview>
  ),
};

/**
 * `alert` swaps in Base UI's AlertDialog primitive: `role="alertdialog"`,
 * forced modal, and no dismiss via outside click or Escape. Use it for
 * confirmations that need explicit acknowledgment (destructive actions,
 * unsaved-changes warnings). The close (X) button is off by default in this
 * mode — dismissal should go through an explicit action.
 */
export const Alert: Story = {
  render: () => (
    <Dialog alert>
      <DialogTrigger asChild>
        <Button variant="outline">Delete account</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account and remove your
            data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button>Continue</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
