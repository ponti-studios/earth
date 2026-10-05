import type { Meta, StoryObj } from "@storybook/react-vite";

import { SegmentedControl } from "./segmented-control";

const meta = {
  title: "Primitives/SegmentedControl",
  component: SegmentedControl,
  tags: ["autodocs"],
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  args: {
    label: "Layers",
    options: [
      { value: "cameras", label: "Cameras" },
      { value: "places", label: "Places" },
    ],
  },
  render: () => (
    <SegmentedControl
      label="Layers"
      defaultValue={["cameras"]}
      options={[
        { value: "cameras", label: "Cameras" },
        { value: "places", label: "Places" },
      ]}
    />
  ),
};

export const Multiple: Story = {
  args: {
    label: "Layers",
    options: [
      { value: "cameras", label: "Cameras" },
      { value: "places", label: "Places" },
    ],
  },
  render: () => (
    <SegmentedControl
      label="Layers"
      multiple
      defaultValue={["cameras", "places"]}
      options={[
        { value: "cameras", label: "Cameras" },
        { value: "places", label: "Places" },
        { value: "trains", label: "Trains" },
      ]}
    />
  ),
};
