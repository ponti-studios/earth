import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fireEvent, userEvent, within } from "storybook/test";

import { DropZone, type DropZoneFileInfo, type DropZoneStatus } from "./drop-zone";

const meta = {
  title: "Forms/DropZone",
  component: DropZone,
  tags: ["autodocs"],
  args: {
    status: "empty",
    onFiles: () => {},
  },
} satisfies Meta<typeof DropZone>;

export default meta;
type Story = StoryObj<typeof meta>;

function DropZonePreview({ initialStatus = "empty" }: { initialStatus?: DropZoneStatus }) {
  const [status, setStatus] = useState<DropZoneStatus>(initialStatus);
  const [file, setFile] = useState<DropZoneFileInfo | null>(
    initialStatus === "empty" ? null : { name: "applications.csv", size: 24_576 },
  );

  return (
    <div className="w-96">
      <DropZone
        status={status}
        file={file}
        accept=".csv"
        emptyHint="Supported formats: CSV"
        error={status === "failed" ? "The file could not be processed." : undefined}
        busyDescription="This usually takes a moment."
        onFiles={(files) => {
          const selectedFile = files[0];
          if (!selectedFile) return;
          setFile({ name: selectedFile.name, size: selectedFile.size });
          setStatus("armed");
        }}
        onSubmit={() => setStatus("busy")}
        onCancel={() => setStatus("armed")}
        onRetry={() => setStatus("busy")}
        onClear={() => {
          setFile(null);
          setStatus("empty");
        }}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <DropZonePreview />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvasElement.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["name,email\nAda,ada@example.com"], "applications.csv", {
      type: "text/csv",
    });

    await expect(canvas.getByText("Drop a file here, or")).toBeInTheDocument();
    await fireEvent.change(input, { target: { files: [file] } });
    await expect(canvas.getByText("applications.csv")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /Upload/ })).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: /Upload/ }));
    await expect(canvas.getByRole("progressbar", { name: "Processing…" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /Cancel/ })).toBeInTheDocument();
  },
};

export const Armed: Story = {
  render: () => <DropZonePreview initialStatus="armed" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("applications.csv")).toBeInTheDocument();
    await expect(canvas.getByText("24.0 KB")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: /Use a different file/ }));
    await expect(canvas.getByText("Drop a file here, or")).toBeInTheDocument();
  },
};

export const Busy: Story = {
  render: () => <DropZonePreview initialStatus="busy" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole("progressbar", { name: "Processing…" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /Cancel/ })).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: /Upload/ })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: /Cancel/ }));
    await expect(canvas.getByRole("button", { name: /Upload/ })).toBeInTheDocument();
  },
};

export const Dragging: Story = {
  render: () => <DropZonePreview />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const zone = canvas.getByRole("button", { name: "File upload drop zone" });
    const file = new File(["data"], "applications.csv", { type: "text/csv" });

    await fireEvent.dragEnter(zone);
    await expect(canvas.getByText("Release to attach")).toBeInTheDocument();
    await fireEvent.dragLeave(zone);
    await expect(canvas.getByText("Drop a file here, or")).toBeInTheDocument();
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    Object.defineProperty(dataTransfer, "files", { value: [file] });
    await fireEvent.drop(zone, { dataTransfer });
    await expect(canvas.getByText("applications.csv")).toBeInTheDocument();
  },
};

export const Failed: Story = {
  render: () => <DropZonePreview initialStatus="failed" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText("The file could not be processed.")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: /Try again/ })).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: /Try again/ }));
    await expect(canvas.getByRole("progressbar", { name: "Processing…" })).toBeInTheDocument();
  },
};

export const Disabled: Story = {
  args: { status: "empty", disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const zone = canvas.getByRole("button", { name: "File upload drop zone" });
    const input = canvasElement.querySelector('input[type="file"]') as HTMLInputElement;

    await expect(zone).toHaveAttribute("aria-disabled", "true");
    await expect(zone).toHaveAttribute("tabindex", "-1");
    await expect(input).toBeDisabled();
  },
};
