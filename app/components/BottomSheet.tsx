import { useCallback, useEffect, useRef, useState } from "react";

const STUB_PX = 48; // px visible when closed
const FLICK_VELOCITY = 0.4; // px/ms
const DRAG_THRESHOLD = 0.25; // fraction of height to commit close

interface Props {
  children: React.ReactNode;
}

export default function BottomSheet({ children }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  // translateY in px: 0 = fully open, (height - STUB_PX) = closed/stub
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
      // Clamp so you can't drag above the open position
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

      if (!didDrag.current) return; // let onClick handle it

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

  // Re-open when route changes while closed
  const prevChildren = useRef(children);
  useEffect(() => {
    if (children !== prevChildren.current) {
      prevChildren.current = children;
      open();
    }
  }, [children, open]);

  // Set initial closed position once the sheet has rendered and we know its height
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
      className="earth-dock"
      style={{
        transform: `translateX(-50%) translateY(${currentY}px)`,
        transition: isDragging.current ? "none" : "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="earth-dock-handle" aria-hidden="true" onClick={onHandleClick} />
      <div className="earth-dock-content">{children}</div>
    </div>
  );
}
