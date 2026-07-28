import { useCallback, useEffect, useRef, useState } from "react";

const STUB_PX = 48;
const FLICK_VELOCITY = 0.4;
const DRAG_THRESHOLD = 0.25;

interface Props {
  children: React.ReactNode;
}

export default function BottomSheet({ children }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [translateY, setTranslateY] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const isDragging = useRef(false);
  const didDrag = useRef(false);
  const dragRef = useRef<{ startY: number; startTime: number } | null>(null);

  const getHeight = () => sheetRef.current?.offsetHeight ?? 400;
  const closedY = () => getHeight() - STUB_PX;
  const isOpen = () => translateY === 0;

  const snapTo = useCallback((targetY: number) => {
    setTranslateY(targetY);
    setDragOffset(0);
  }, []);

  const open = useCallback(() => snapTo(0), [snapTo]);
  const close = useCallback(() => snapTo(closedY()), [snapTo]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const rect = sheetRef.current?.getBoundingClientRect();
    if (!rect) return;
    if (e.clientY - rect.top > 40) return;
    isDragging.current = true;
    didDrag.current = false;
    dragRef.current = { startY: e.clientY, startTime: Date.now() };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current || !dragRef.current) return;
      const delta = e.clientY - dragRef.current.startY;
      if (Math.abs(delta) > 4) didDrag.current = true;
      setDragOffset(Math.max(-translateY, delta));
    },
    [translateY],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current || !dragRef.current) return;
      isDragging.current = false;

      const delta = e.clientY - dragRef.current.startY;
      const elapsed = Date.now() - dragRef.current.startTime;
      const velocity = delta / elapsed;
      dragRef.current = null;
      setDragOffset(0);

      if (!didDrag.current) return;

      const height = getHeight();
      const newY = Math.max(0, translateY + delta);
      const fraction = newY / height;

      if (velocity > FLICK_VELOCITY) {
        close();
      } else if (velocity < -FLICK_VELOCITY) {
        open();
      } else if (fraction > DRAG_THRESHOLD) {
        close();
      } else {
        open();
      }
    },
    [translateY, open, close],
  );

  const onHandleClick = useCallback(() => {
    if (didDrag.current) return;
    if (isOpen()) {
      close();
    } else {
      open();
    }
  }, [translateY, open, close]);

  const prevChildren = useRef(children);
  useEffect(() => {
    if (children !== prevChildren.current) {
      prevChildren.current = children;
      open();
    }
  }, [children, open]);

  const initialised = useRef(false);
  useEffect(() => {
    if (!initialised.current && sheetRef.current) {
      initialised.current = true;
      snapTo(closedY());
    }
  });

  const currentY = Math.max(0, translateY + dragOffset);

  return (
    <div
      ref={sheetRef}
      className="bg-background fixed bottom-4 left-1/2 z-100 flex w-[min(480px,calc(100vw-2rem))] max-h-[70vh] flex-col overflow-hidden rounded-2xl border touch-none [box-shadow:0_8px_40px_rgb(0_0_0_/_0.12),0_2px_8px_rgb(0_0_0_/_0.06)]"
      style={{
        transform: `translateX(-50%) translateY(${currentY}px)`,
        transition: isDragging.current
          ? "none"
          : "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="mx-auto mt-2.5 h-1 w-9 shrink-0 cursor-grab rounded-full bg-border active:cursor-grabbing" aria-hidden="true" onClick={onHandleClick} />
      <div className="bottom-sheet-scroll flex-1 overflow-y-auto p-4 pb-6">
        {children}
      </div>
    </div>
  );
}
