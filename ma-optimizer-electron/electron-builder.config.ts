import type { Configuration } from 'electron-builder'

const config: Configuration = {
    appId: 'com.mathiyass.ma-optimizer',
    productName: 'MA-Optimizer',
    copyright: `Copyright © ${new Date().getFullYear()} Mathisha Angirasa`,

    directories: {
        output: 'release',
        buildResources: 'public',
    },

    files: [
        'dist/**/*',
        'electron/dist/**/*',
        '!node_modules/**/*',
    ],

    extraResources: [
        { from: 'public', to: 'public', filter: ['**/*'] },
    ],

    win: {
        target: [
            { target: 'portable', arch: ['x64'] },
            { target: 'nsis', arch: ['x64'] },
        ],
        icon: 'public/icon.ico',
        requestedExecutionLevel: 'requireAdministrator',
        signAndEditExecutable: false,
    },

    portable: {
        artifactName: 'MA-Optimizer-v${version}-portable.exe',
        requestedExecutionLevel: 'requireAdministrator',
        unpackDirName: 'MA-Optimizer',
    },

    nsis: {
        oneClick: false,
        allowToChangeInstallationDirectory: true,
        createDesktopShortcut: true,
        createStartMenuShortcut: true,
        shortcutName: 'MA-Optimizer',
        artifactName: 'MA-Optimizer-v${version}-setup.exe',
    },

    publish: {
        provider: 'github',
        owner: 'Mathiyass',
        repo: 'MA-Optimizer',
        releaseType: 'release',
    },
}

export default config
