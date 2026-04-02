import { useEffect, useState } from 'react';

import type { ToolActivity } from '../office/types.js';
import { vscode } from '../vscodeApi.js';

interface AgentDiagnostics {
  id: number;
  projectDir: string;
  projectDirExists: boolean;
  jsonlFile: string;
  jsonlExists: boolean;
  fileSize: number;
  fileOffset: number;
  lastDataAt: number;
  linesProcessed: number;
}

interface DebugViewProps {
  agents: number[];
  selectedAgent: number | null;
  agentTools: Record<number, ToolActivity[]>;
  agentStatuses: Record<number, string>;
  subagentTools: Record<number, Record<string, ToolActivity[]>>;
  onSelectAgent: (id: number) => void;
}

/** Z-index just below the floating toolbar (50) so the toolbar stays on top */
const DEBUG_Z = 40;

function ToolDot({ tool }: { tool: ToolActivity }) {
  return (
    <span
      className={`w-6 h-6 rounded-full inline-block shrink-0 ${tool.done ? '' : 'pixel-agents-pulse'}`}
      style={{
        background: tool.done
          ? 'var(--vscode-charts-green, #89d185)'
          : tool.permissionWait
            ? 'var(--vscode-charts-yellow, #cca700)'
            : 'var(--vscode-charts-blue, #3794ff)',
      }}
    />
  );
}

function ToolLine({ tool }: { tool: ToolActivity }) {
  return (
    <span className="text-base flex items-center gap-5" style={{ opacity: tool.done ? 0.5 : 0.8 }}>
      <ToolDot tool={tool} />
      {tool.permissionWait && !tool.done ? 'Needs approval' : tool.status}
    </span>
  );
}

function formatTimeAgo(ms: number): string {
  if (ms === 0) return 'never';
  const seconds = Math.round((Date.now() - ms) / 1000);
  if (seconds < 2) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export function DebugView({
  agents,
  selectedAgent,
  agentTools,
  agentStatuses,
  subagentTools,
  onSelectAgent,
}: DebugViewProps) {
  const [diagnostics, setDiagnostics] = useState<Record<number, AgentDiagnostics>>({});

  // Request diagnostics from extension periodically
  useEffect(() => {
    vscode.postMessage({ type: 'requestDiagnostics' });
    const interval = setInterval(() => {
      vscode.postMessage({ type: 'requestDiagnostics' });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Listen for diagnostics response
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data;
      if (msg.type === 'agentDiagnostics') {
        const map: Record<number, AgentDiagnostics> = {};
        for (const a of msg.agents as AgentDiagnostics[]) {
          map[a.id] = a;
        }
        setDiagnostics(map);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const renderAgentCard = (id: number) => {
    const isSelected = selectedAgent === id;
    const tools = agentTools[id] || [];
    const subs = subagentTools[id] || {};
    const status = agentStatuses[id];
    const hasActiveTools = tools.some((t) => !t.done);
    const diag = diagnostics[id];
    return (
      <div
        key={id}
        className="rounded-none py-6 px-8"
        style={{
          border: `2px solid ${isSelected ? '#5a8cff' : '#4a4a6a'}`,
          background: isSelected
            ? 'var(--vscode-list-activeSelectionBackground, rgba(255,255,255,0.04))'
            : undefined,
        }}
      >
        <span className="inline-flex items-center gap-0">
          <button
            onClick={() => onSelectAgent(id)}
            className="rounded-none py-6 px-10 text-xl"
            style={{
              background: isSelected ? 'rgba(90, 140, 255, 0.25)' : undefined,
              color: isSelected ? '#fff' : undefined,
              fontWeight: isSelected ? 'bold' : undefined,
            }}
          >
            Agent #{id}
          </button>
          <button
            onClick={() => vscode.postMessage({ type: 'closeAgent', id })}
            className="rounded-none py-6 px-8 text-xl opacity-70"
            style={{
              background: isSelected ? 'rgba(90, 140, 255, 0.25)' : undefined,
              color: isSelected ? '#fff' : undefined,
            }}
            title="Close agent"
          >
            ✕
          </button>
        </span>
        {(tools.length > 0 || status === 'waiting') && (
          <div className="flex flex-col gap-[1px] mt-4 pl-4">
            {tools.map((tool) => (
              <div key={tool.toolId}>
                <ToolLine tool={tool} />
                {subs[tool.toolId] && subs[tool.toolId].length > 0 && (
                  <div
                    className="ml-3 pl-8 mt-[1px] flex flex-col gap-[1px]"
                    style={{
                      borderLeft: '2px solid var(--vscode-widget-border, rgba(255,255,255,0.12))',
                    }}
                  >
                    {subs[tool.toolId].map((subTool) => (
                      <ToolLine key={subTool.toolId} tool={subTool} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {status === 'waiting' && !hasActiveTools && (
              <span className="text-base opacity-85 flex items-center gap-5">
                <span
                  className="w-6 h-6 rounded-full inline-block shrink-0"
                  style={{ background: 'var(--vscode-charts-yellow, #cca700)' }}
                />
                Might be waiting for input
              </span>
            )}
          </div>
        )}
        {/* Connection diagnostics */}
        {diag && (
          <div
            className="mt-6 py-4 px-6 text-2xs opacity-70 flex flex-col gap-2"
            style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
          >
            <span>
              <span style={{ color: diag.jsonlExists ? '#89d185' : '#f14c4c' }}>
                {diag.jsonlExists ? 'JSONL connected' : 'JSONL not found'}
              </span>
              {' | '}
              Lines: {diag.linesProcessed}
              {' | '}
              Last data: {formatTimeAgo(diag.lastDataAt)}
            </span>
            <span className="opacity-60 text-xs break-all">{diag.jsonlFile}</span>
            {!diag.projectDirExists && (
              <span className="text-xs" style={{ color: '#f14c4c' }}>
                Project dir does not exist: {diag.projectDir}
              </span>
            )}
            {diag.jsonlExists && diag.fileSize > 0 && diag.linesProcessed === 0 && (
              <span className="text-xs" style={{ color: '#cca700' }}>
                File has data ({diag.fileSize} bytes) but 0 lines parsed. Possible format issue.
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="absolute inset-0 overflow-auto"
      style={{ background: 'var(--vscode-editor-background)', zIndex: DEBUG_Z }}
    >
      {/* Top padding so cards don't overlap the floating toolbar */}
      <div className="p-12 text-2xl">
        <div className="flex flex-col gap-6">{agents.map(renderAgentCard)}</div>
      </div>
    </div>
  );
}
