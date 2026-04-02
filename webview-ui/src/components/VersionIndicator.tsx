import { useCallback, useEffect, useState } from 'react';

import { toMajorMinor } from '../changelogData.ts';
import { WHATS_NEW_AUTO_CLOSE_MS, WHATS_NEW_FADE_MS } from '../constants.ts';

interface VersionIndicatorProps {
  currentVersion: string;
  lastSeenVersion: string;
  onDismiss: () => void;
  onOpenChangelog: () => void;
}

export function VersionIndicator({
  currentVersion,
  lastSeenVersion,
  onDismiss,
  onOpenChangelog,
}: VersionIndicatorProps) {
  const [dismissed, setDismissed] = useState(false);
  const [fading, setFading] = useState(false);
  const [labelHovered, setLabelHovered] = useState(false);

  const currentMajorMinor = toMajorMinor(currentVersion);
  const isUnseen = currentMajorMinor !== lastSeenVersion;
  const showUpdateNotice = isUnseen && !dismissed;

  // Start fade-out after auto-close delay, then fully dismiss after the transition
  useEffect(() => {
    if (!showUpdateNotice || fading) return;
    const fadeTimer = setTimeout(() => setFading(true), WHATS_NEW_AUTO_CLOSE_MS);
    return () => clearTimeout(fadeTimer);
  }, [showUpdateNotice, fading]);

  useEffect(() => {
    if (!fading) return;
    const removeTimer = setTimeout(() => {
      setDismissed(true);
      onDismiss();
    }, WHATS_NEW_FADE_MS);
    return () => clearTimeout(removeTimer);
  }, [fading, onDismiss]);

  const handleDismiss = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setDismissed(true);
      onDismiss();
    },
    [onDismiss],
  );

  const handleOpenChangelog = useCallback(() => {
    setDismissed(true);
    onOpenChangelog();
  }, [onOpenChangelog]);

  if (!currentVersion) return null;

  return (
    <>
      {/* Update notice — shown once per version until dismissed or auto-closed */}
      {showUpdateNotice && (
        <div
          onClick={handleOpenChangelog}
          className="absolute bottom-28 right-28 z-[45] pixel-panel py-8 px-10 pb-[9px] cursor-pointer flex flex-col gap-8 max-w-[260px]"
          style={{
            opacity: fading ? 0 : 1,
            transition: `opacity ${WHATS_NEW_FADE_MS / 1000}s ease-out`,
          }}
        >
          <div className="flex justify-between items-end gap-10">
            <span className="text-lg text-accent leading-[0.5]">
              Updated to v{currentMajorMinor}!
            </span>
            <button
              onClick={handleDismiss}
              className="bg-transparent border-none rounded-none text-text-muted text-base cursor-pointer px-2 leading-[0.8] ml-4 shrink-0"
            >
              x
            </button>
          </div>
          <span className="text-sm whitespace-nowrap">See what's new</span>
        </div>
      )}
      {/* Hover tooltip — "See what's new" appears on label hover after notice is gone */}
      {!showUpdateNotice && labelHovered && (
        <div
          onClick={handleOpenChangelog}
          className="absolute bottom-28 right-28 z-[45] pixel-panel py-6 px-12 cursor-pointer text-sm whitespace-nowrap"
        >
          See what's new!
        </div>
      )}
      {/* Version label — always visible */}
      <div
        onMouseEnter={() => setLabelHovered(true)}
        onMouseLeave={() => setLabelHovered(false)}
        onClick={handleOpenChangelog}
        className="absolute bottom-8 right-28 z-[45] text-lg cursor-pointer select-none pr-2 transition-opacity duration-200"
        style={{ opacity: labelHovered ? 0.8 : 0.4 }}
      >
        v{currentMajorMinor}
      </div>
    </>
  );
}
