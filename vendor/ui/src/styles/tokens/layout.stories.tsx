import type { Meta, StoryObj } from "@storybook/react-vite";

const meta = {
  title: "Foundations/Layout Rhythm",
  parameters: { layout: "fullscreen" },
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const PageShell: Story = {
  render: () => (
    <main className="page-shell bg-background text-foreground">
      <header className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">Page shell</p>
        <h1 className="text-4xl font-semibold tracking-tight">
          A consistent starting point for content pages.
        </h1>
      </header>
      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-semibold">Section rhythm</h2>
        <p className="text-muted-foreground max-w-2xl text-base">
          Layout helpers compose standard Tailwind spacing and semantic colors.
        </p>
      </section>
    </main>
  ),
};

export const ListRows: Story = {
  render: () => (
    <main className="page-shell bg-background text-foreground">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-tight">List row rhythm</h1>
        <div className="divide-border border-border divide-y border-b">
          {["A compact row", "A readable row", "A responsive row"].map((title, index) => (
            <div key={title} className="flex gap-4 py-6">
              <span className="text-muted-foreground font-mono text-sm">0{index + 1}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="text-muted-foreground text-sm">
                  Consistent padding keeps scanning calm.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  ),
};
