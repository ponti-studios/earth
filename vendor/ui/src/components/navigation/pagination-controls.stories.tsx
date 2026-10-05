import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { PaginationControls } from "./pagination-controls";

const meta = {
  title: "Navigation/PaginationControls",
  component: PaginationControls,
  tags: ["autodocs"],
} satisfies Meta<typeof PaginationControls>;

export default meta;
type Story = StoryObj<typeof meta>;

function PaginationPreview({ totalPages }: { totalPages: number }) {
  const [currentPage, setCurrentPage] = useState(0);
  return (
    <PaginationControls
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={setCurrentPage}
    />
  );
}

const baseArgs = {
  currentPage: 0,
  totalPages: 5,
  onPageChange: () => {},
};

export const Default: Story = {
  args: baseArgs,
  render: () => <PaginationPreview totalPages={5} />,
};

export const SinglePage: Story = {
  name: "Single page (disabled controls)",
  args: { ...baseArgs, totalPages: 1 },
  render: () => <PaginationPreview totalPages={1} />,
};
