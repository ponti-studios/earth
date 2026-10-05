import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import type { SortOption } from "../../hooks/sort.types";
import { SortControls } from "./sort-controls";

const meta = {
  title: "DataDisplay/SortControls",
  component: SortControls,
  tags: ["autodocs"],
} satisfies Meta<typeof SortControls>;

export default meta;
type Story = StoryObj<typeof meta>;

const sortableFields = ["amount", "date", "description", "category"];

function SortControlsPreview() {
  const [sortOptions, setSortOptions] = useState<SortOption[]>([
    { field: "date", direction: "desc" },
  ]);

  return (
    <SortControls
      sortOptions={sortOptions}
      sortableFields={sortableFields}
      addSortOption={(option) => setSortOptions((prev) => [...prev, option])}
      updateSortOption={(index, option) =>
        setSortOptions((prev) => prev.map((o, i) => (i === index ? option : o)))
      }
      removeSortOption={(index) => setSortOptions((prev) => prev.filter((_, i) => i !== index))}
    />
  );
}

export const Default: Story = {
  args: {
    sortOptions: [],
    sortableFields,
    addSortOption: () => {},
    updateSortOption: () => {},
    removeSortOption: () => {},
  },
  render: () => <SortControlsPreview />,
};
