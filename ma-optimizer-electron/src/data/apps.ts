export interface AppItem {
    id: string
    name: string
    category: string
    desc: string
    domain: string
}

export const apps: AppItem[] = [
    // Browsers
    { id: 'Google.Chrome', name: 'Google Chrome', category: 'browsers', desc: 'Fast, secure web browser by Google', domain: 'google.com' },
    { id: 'Mozilla.Firefox', name: 'Firefox', category: 'browsers', desc: 'Privacy-focused open source browser', domain: 'mozilla.org' },
    { id: 'Brave.Brave', name: 'Brave Browser', category: 'browsers', desc: 'Privacy browser with built-in ad blocker', domain: 'brave.com' },
    { id: 'Opera.Opera', name: 'Opera', category: 'browsers', desc: 'Feature-rich browser with free VPN', domain: 'opera.com' },
    { id: 'Opera.OperaGX', name: 'Opera GX', category: 'browsers', desc: 'Gaming browser with RAM/CPU limiter', domain: 'opera.com' },
    { id: 'Vivaldi.Vivaldi', name: 'Vivaldi', category: 'browsers', desc: 'Highly customizable browser', domain: 'vivaldi.com' },
    { id: 'Alex313031.Thorium.AVX2', name: 'Thorium Browser (AVX2)', category: 'browsers', desc: 'Ultra-fast Chromium fork compiled with AVX2 instruction sets', domain: 'thorium.rocks' },
    { id: 'Alex313031.Thorium', name: 'Thorium Browser', category: 'browsers', desc: 'Performance-optimized Chromium build for modern CPUs', domain: 'thorium.rocks' },

    // Developer Tools
    { id: 'Microsoft.VisualStudioCode', name: 'VS Code', category: 'dev', desc: 'Lightweight powerful code editor', domain: 'code.visualstudio.com' },
    { id: 'Notepad++.Notepad++', name: 'Notepad++', category: 'dev', desc: 'Feature-rich text and code editor', domain: 'notepad-plus-plus.org' },
    { id: 'Git.Git', name: 'Git', category: 'dev', desc: 'Distributed version control system', domain: 'git-scm.com' },
    { id: 'GitHub.GitHubDesktop', name: 'GitHub Desktop', category: 'dev', desc: 'Visual Git client by GitHub', domain: 'github.com' },
    { id: 'Python.Python.3.12', name: 'Python 3.12', category: 'dev', desc: 'Python programming language', domain: 'python.org' },
    { id: 'OpenJS.NodeJS', name: 'Node.js', category: 'dev', desc: 'JavaScript runtime environment', domain: 'nodejs.org' },
    { id: 'Oracle.JDK.21', name: 'Java JDK 21', category: 'dev', desc: 'Java Development Kit LTS', domain: 'oracle.com' },
    { id: 'Rustlang.Rustup', name: 'Rust', category: 'dev', desc: 'Systems programming language', domain: 'rust-lang.org' },
    { id: 'Docker.DockerDesktop', name: 'Docker Desktop', category: 'dev', desc: 'Container development platform', domain: 'docker.com' },
    { id: 'Postman.Postman', name: 'Postman', category: 'dev', desc: 'API development and testing tool', domain: 'postman.com' },
    { id: 'Microsoft.WindowsTerminal', name: 'Windows Terminal', category: 'dev', desc: 'Modern terminal application', domain: 'microsoft.com' },
    { id: 'JetBrains.Toolbox', name: 'JetBrains Toolbox', category: 'dev', desc: 'JetBrains IDE manager', domain: 'jetbrains.com' },
    { id: 'dbeaver.dbeaver', name: 'DBeaver', category: 'dev', desc: 'Universal database manager', domain: 'dbeaver.io' },

    // Media & Multimedia
    { id: 'VideoLAN.VLC', name: 'VLC Media Player', category: 'media', desc: 'Universal media player', domain: 'videolan.org' },
    { id: 'DAUM.PotPlayer', name: 'PotPlayer', category: 'media', desc: 'Feature-rich media player', domain: 'potplayer.daum.net' },
    { id: 'HandBrake.HandBrake', name: 'HandBrake', category: 'media', desc: 'Video transcoder', domain: 'handbrake.fr' },
    { id: 'OBSProject.OBSStudio', name: 'OBS Studio', category: 'media', desc: 'Streaming and recording', domain: 'obsproject.com' },
    { id: 'Audacity.Audacity', name: 'Audacity', category: 'media', desc: 'Free audio editor', domain: 'audacityteam.org' },
    { id: 'GIMP.GIMP', name: 'GIMP', category: 'media', desc: 'Professional image editor', domain: 'gimp.org' },
    { id: 'KDE.Krita', name: 'Krita', category: 'media', desc: 'Digital painting application', domain: 'krita.org' },
    { id: 'dotPDN.PaintDotNet', name: 'Paint.NET', category: 'media', desc: 'Intuitive image editor', domain: 'getpaint.net' },
    { id: 'Inkscape.Inkscape', name: 'Inkscape', category: 'media', desc: 'Vector graphics editor', domain: 'inkscape.org' },
    { id: 'qBittorrent.qBittorrent', name: 'qBittorrent', category: 'media', desc: 'Open source torrent client', domain: 'qbittorrent.org' },
    { id: 'Spotify.Spotify', name: 'Spotify', category: 'media', desc: 'Music streaming service', domain: 'spotify.com' },

    // Communication
    { id: 'Discord.Discord', name: 'Discord', category: 'comms', desc: 'Voice, video and text chat', domain: 'discord.com' },
    { id: 'Telegram.TelegramDesktop', name: 'Telegram', category: 'comms', desc: 'Fast secure messenger', domain: 'telegram.org' },
    { id: 'OpenWhisperSystems.Signal', name: 'Signal', category: 'comms', desc: 'Privacy-first messaging', domain: 'signal.org' },
    { id: 'SlackTechnologies.Slack', name: 'Slack', category: 'comms', desc: 'Team collaboration platform', domain: 'slack.com' },
    { id: 'Zoom.Zoom', name: 'Zoom', category: 'comms', desc: 'Video conferencing', domain: 'zoom.us' },
    { id: 'WhatsApp.WhatsApp', name: 'WhatsApp', category: 'comms', desc: 'Cross-platform messaging', domain: 'whatsapp.com' },

    // Security & Privacy
    { id: 'Bitwarden.Bitwarden', name: 'Bitwarden', category: 'security', desc: 'Open source password manager', domain: 'bitwarden.com' },
    { id: 'KeePassXCTeam.KeePassXC', name: 'KeePassXC', category: 'security', desc: 'Offline password manager', domain: 'keepassxc.org' },
    { id: 'Malwarebytes.Malwarebytes', name: 'Malwarebytes', category: 'security', desc: 'Anti-malware protection', domain: 'malwarebytes.com' },
    { id: 'ProtonTechnologies.ProtonVPN', name: 'ProtonVPN', category: 'security', desc: 'Privacy-focused VPN', domain: 'protonvpn.com' },

    // Gaming
    { id: 'Valve.Steam', name: 'Steam', category: 'gaming', desc: 'Largest PC gaming platform', domain: 'steampowered.com' },
    { id: 'EpicGames.EpicGamesLauncher', name: 'Epic Games', category: 'gaming', desc: 'Epic Games store', domain: 'epicgames.com' },
    { id: 'GOG.Galaxy', name: 'GOG Galaxy', category: 'gaming', desc: 'DRM-free game platform', domain: 'gog.com' },
    { id: 'ElectronicArts.EADesktop', name: 'EA App', category: 'gaming', desc: 'EA games platform', domain: 'ea.com' },
    { id: 'Playnite.Playnite', name: 'Playnite', category: 'gaming', desc: 'Unified game library', domain: 'playnite.link' },

    // Utilities
    { id: 'Microsoft.PowerToys', name: 'PowerToys', category: 'utils', desc: 'Windows power user utilities', domain: 'microsoft.com' },
    { id: 'AutoHotkey.AutoHotkey', name: 'AutoHotKey', category: 'utils', desc: 'Windows automation scripting', domain: 'autohotkey.com' },
    { id: 'CPUID.CPU-Z', name: 'CPU-Z', category: 'utils', desc: 'CPU/RAM/motherboard info', domain: 'cpuid.com' },
    { id: 'REALiX.HWiNFO', name: 'HWiNFO64', category: 'utils', desc: 'Comprehensive hardware info', domain: 'hwinfo.com' },
    { id: 'voidtools.Everything', name: 'Everything', category: 'utils', desc: 'Instant file search', domain: 'voidtools.com' },
    { id: 'ShareX.ShareX', name: 'ShareX', category: 'utils', desc: 'Advanced screenshot and recording', domain: 'getsharex.com' },
    { id: 'Rufus.Rufus', name: 'Rufus', category: 'utils', desc: 'Create bootable USB drives', domain: 'rufus.ie' },
    { id: '7zip.7zip', name: '7-Zip', category: 'utils', desc: 'High-compression archive tool', domain: '7-zip.org' },
    { id: 'WinDirStat.WinDirStat', name: 'WinDirStat', category: 'utils', desc: 'Disk usage statistics', domain: 'windirstat.net' },

    // Office & Productivity
    { id: 'TheDocumentFoundation.LibreOffice', name: 'LibreOffice', category: 'office', desc: 'Full-featured office suite', domain: 'libreoffice.org' },
    { id: 'SumatraPDF.SumatraPDF', name: 'Sumatra PDF', category: 'office', desc: 'Fast lightweight PDF reader', domain: 'sumatrapdfreader.org' },
    { id: 'Obsidian.Obsidian', name: 'Obsidian', category: 'office', desc: 'Knowledge base and notes', domain: 'obsidian.md' },
]

export const appCategories = [
    { id: 'browsers', name: 'Browsers' },
    { id: 'dev', name: 'Developer' },
    { id: 'media', name: 'Media' },
    { id: 'comms', name: 'Communication' },
    { id: 'security', name: 'Security' },
    { id: 'gaming', name: 'Gaming' },
    { id: 'utils', name: 'Utilities' },
    { id: 'office', name: 'Office' },
]
