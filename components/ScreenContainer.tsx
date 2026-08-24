"use client";

// Shared responsive shell every screen renders inside. Centralizing this
// fixes two problems that showed up once real desktop/tablet use surfaced
// them: (1) every screen previously hand-rolled its own width/padding
// string, so they drifted slightly inconsistent from each other, and (2)
// the content column was a fixed mobile-only max-w-sm with no tablet/
// desktop scaling — BackArrow/ForwardArrow (absolute-positioned against
// this same box) ended up pinned to the raw browser edge on a wide screen
// while the actual content sat in a narrow column far away from them.
export default function ScreenContainer({
  children,
  center = true,
  className = "",
}: {
  children: React.ReactNode;
  center?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`screen-enter relative mx-auto flex w-full max-w-sm flex-1 flex-col px-6 py-12 sm:max-w-md sm:px-8 sm:py-16 lg:max-w-xl lg:px-10 lg:py-20 ${
        center ? "items-center justify-center text-center" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
