pub fn format_duration(ms: u64) -> String {
    let seconds = ms / 1000;
    let minutes = seconds / 60;
    let hours = minutes / 60;

    if hours > 0 {
        format!("{}h {}m", hours, minutes % 60)
    } else if minutes > 0 {
        format!("{}m {}s", minutes, seconds % 60)
    } else {
        format!("{}s", seconds)
    }
}

pub fn format_time_percentage(time: u64, total: u64) -> String {
    if total == 0 {
        return "0%".to_string();
    }
    
    let percentage = (time as f64 / total as f64) * 100.0;
    format!("{:.1}%", percentage)
}

pub fn get_category(time: u64) -> &'static str {
    let hours = time / 3600;
    
    if hours > 4 {
        "high"
    } else if hours > 2 {
        "medium"
    } else {
        "low"
    }
}

pub fn get_productivity(app_name: &str) -> &'static str {
    let productive_apps = [
        "code", "vscode", "intellij", "webstorm", "pycharm", "cursor",
        "sublime", "vim", "emacs", "gitkraken", "github", "terminal",
        "powershell", "cmd", "docker", "postman", "figma", "photoshop",
        "illustrator", "blender", "inkscape", "gimp", "android-studio",
        "xcode", "eclipse", "netbeans", "atom", "sublime-text", "nova",
        "vscodium", "jetbrains", "visual-studio", "monodevelop",
    ];

    let lower_name = app_name.to_lowercase();
    
    for app in productive_apps {
        if lower_name.contains(app) {
            return "productive";
        }
    }

    let entertainment_apps = [
        "chrome", "firefox", "edge", "safari", "brave", "opera",
        "discord", "slack", "teams", "whatsapp", "telegram",
        "youtube", "spotify", "netflix", "twitch", "tiktok",
        "instagram", "facebook", "twitter", "linkedin", "reddit",
        "steam", "epic", "origin", "gog", "uplay", "blizzard",
        "game", "player", "video", "movie", "music",
    ];

    for app in entertainment_apps {
        if lower_name.contains(app) {
            return "unproductive";
        }
    }

    "neutral"
}
