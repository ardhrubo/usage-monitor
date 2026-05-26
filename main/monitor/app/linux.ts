import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';

const execAsync = promisify(exec);

export interface LinuxWindowInfo {
  name: string;
  pid?: number;
  windowTitle?: string;
}

async function getProcessName(pid: number): Promise<string | null> {
  try {
    const comm = await readFile(`/proc/${pid}/comm`, 'utf8');
    return comm.trim();
  } catch {
    try {
      const cmdline = await readFile(`/proc/${pid}/cmdline`, 'utf8');
      const parts = cmdline.split('\0').filter(Boolean);
      if (parts.length > 0) {
        const execPath = parts[0];
        return execPath.split('/').pop() || null;
      }
    } catch {
      // ignore
    }
    return null;
  }
}

async function getXdotoolInfo(): Promise<LinuxWindowInfo | null> {
  try {
    const { stdout: titleOut } = await execAsync(
      'xdotool getwindowfocus getwindowname 2>/dev/null'
    );
    const windowTitle = titleOut.trim();

    if (!windowTitle) return null;

    let pid: number | undefined;
    let name: string | null = null;

    try {
      const { stdout: pidOut } = await execAsync(
        'xdotool getwindowfocus getwindowpid 2>/dev/null'
      );
      const parsedPid = parseInt(pidOut.trim(), 10);
      if (!isNaN(parsedPid)) {
        pid = parsedPid;
        name = await getProcessName(parsedPid);
      }
    } catch {
      // PID lookup failed; name stays null
    }

    if (!name) return null;

    return { name, pid, windowTitle };
  } catch {
    return null;
  }
}

async function getXpropInfo(): Promise<LinuxWindowInfo | null> {
  try {
    // Determine the active window XID from the root window
    const { stdout: winIdOut } = await execAsync(
      'xprop -root -notype _NET_ACTIVE_WINDOW 2>/dev/null'
    );
    const winIdMatch = winIdOut.trim().match(/0x[0-9a-fA-F]+/);
    if (!winIdMatch) return null;
    const winId = winIdMatch[0];

    // Get the PID of the active window
    const { stdout: pidOut } = await execAsync(
      `xprop -id ${winId} -notype _NET_WM_PID 2>/dev/null`
    );
    const pidMatch = pidOut.trim().match(/\d+/);
    if (!pidMatch) return null;
    const pid = parseInt(pidMatch[0], 10);
    if (isNaN(pid)) return null;

    // Resolve process name from /proc
    const name = await getProcessName(pid);
    if (!name) return null;

    // Get the window title
    let windowTitle: string | undefined;
    try {
      const { stdout: titleOut } = await execAsync(
        `xprop -id ${winId} -notype WM_NAME 2>/dev/null`
      );
      const titleMatch = titleOut.trim().match(/"(.+)"/);
      windowTitle = titleMatch ? titleMatch[1] : undefined;
    } catch {
      // window title is optional
    }

    return { name, pid, windowTitle };
  } catch {
    return null;
  }
}

export async function getActiveWindowLinux(): Promise<LinuxWindowInfo | null> {
  const xdotoolResult = await getXdotoolInfo();
  if (xdotoolResult) return xdotoolResult;

  // Fall back to xprop when xdotool is not available
  return getXpropInfo();
}
