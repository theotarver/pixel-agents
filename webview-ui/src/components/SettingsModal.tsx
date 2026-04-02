import { useState } from 'react';

import { isSoundEnabled, setSoundEnabled } from '../notificationSound.js';
import { vscode } from '../vscodeApi.js';
import { Checkbox } from './ui/Checkbox.js';
import { MenuItem } from './ui/MenuItem.js';
import { Modal } from './ui/Modal.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDebugMode: boolean;
  onToggleDebugMode: () => void;
  alwaysShowOverlay: boolean;
  onToggleAlwaysShowOverlay: () => void;
  externalAssetDirectories: string[];
  watchAllSessions: boolean;
  onToggleWatchAllSessions: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  isDebugMode,
  onToggleDebugMode,
  alwaysShowOverlay,
  onToggleAlwaysShowOverlay,
  externalAssetDirectories,
  watchAllSessions,
  onToggleWatchAllSessions,
}: SettingsModalProps) {
  const [soundLocal, setSoundLocal] = useState(isSoundEnabled);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings" className="min-w-[200px]">
      <MenuItem
        onClick={() => {
          vscode.postMessage({ type: 'openSessionsFolder' });
          onClose();
        }}
      >
        Open Sessions Folder
      </MenuItem>
      <MenuItem
        onClick={() => {
          vscode.postMessage({ type: 'exportLayout' });
          onClose();
        }}
      >
        Export Layout
      </MenuItem>
      <MenuItem
        onClick={() => {
          vscode.postMessage({ type: 'importLayout' });
          onClose();
        }}
      >
        Import Layout
      </MenuItem>
      <MenuItem
        onClick={() => {
          vscode.postMessage({ type: 'addExternalAssetDirectory' });
          onClose();
        }}
      >
        Add Asset Directory
      </MenuItem>
      {externalAssetDirectories.map((dir) => (
        <div key={dir} className="flex items-center justify-between py-4 px-10 gap-8">
          <span
            className="text-2xs text-text-muted overflow-hidden text-ellipsis whitespace-nowrap max-w-[180px]"
            title={dir}
          >
            {dir.split(/[/\\]/).pop() ?? dir}
          </span>
          <button
            onClick={() => vscode.postMessage({ type: 'removeExternalAssetDirectory', path: dir })}
            className="bg-transparent border border-white/20 rounded-none text-text-muted text-2xs cursor-pointer py-[1px] px-6 shrink-0 hover:bg-red-500/20"
          >
            X
          </button>
        </div>
      ))}
      <Checkbox
        label="Sound Notifications"
        checked={soundLocal}
        onChange={() => {
          const newVal = !isSoundEnabled();
          setSoundEnabled(newVal);
          setSoundLocal(newVal);
          vscode.postMessage({ type: 'setSoundEnabled', enabled: newVal });
        }}
      />
      <Checkbox
        label="Watch All Sessions"
        checked={watchAllSessions}
        onChange={onToggleWatchAllSessions}
      />
      <Checkbox
        label="Always Show Labels"
        checked={alwaysShowOverlay}
        onChange={onToggleAlwaysShowOverlay}
      />
      <MenuItem
        onClick={onToggleDebugMode}
        right={
          isDebugMode ? <span className="w-6 h-6 rounded-full bg-accent-80 shrink-0" /> : undefined
        }
      >
        Debug View
      </MenuItem>
    </Modal>
  );
}
