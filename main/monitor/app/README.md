# monitor/

## App Monitor (Cross-Platform)

### Windows
- Use PowerShell: `Get-Process | Where-Object {$_.MainWindowTitle -ne ''} | Select-Object ProcessName, Id, MainWindowTitle`
- Use Windows API via node-ffi or edge-js
- Monitor foreground window changes using `GetForegroundWindow()`

### macOS
- Use AppleScript: `osascript -e 'tell application "System Events" to get name of process where frontmost is true'`
- Accessibility API via accessibility-checker
- NSWorkspace notifications for app changes

### Linux
- Use xdotool: `xdotool getwindowfocus getwindowname`
- Use wmctrl: `wmctrl -l`
- Parse /proc for process info

## Implementation Strategy

Create platform-specific modules:
- `main/monitor/app/windows.ts`
- `main/monitor/app/mac.ts`
- `main/monitor/app/linux.ts`

Export unified interface:
```typescript
interface AppInfo {
  name: string;
  pid: number;
  windowTitle?: string;
  startTime: number;
  duration: number;
}
```

Track active app changes:
1. Listen to focus change events
2. Record timestamps
3. Calculate duration between switches
4. Save to database
