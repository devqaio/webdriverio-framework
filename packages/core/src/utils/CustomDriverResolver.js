/**
 * ═══════════════════════════════════════════════════════════════════════
 * CustomDriverResolver — Download & Cache Browser Drivers from a Custom URL
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Downloads a browser driver binary from a custom/internal artifact server
 * (e.g. Edge, Chrome, Gecko drivers hosted behind a corporate firewall),
 * extracts it into a local `.cache/` folder under the project root, and
 * returns the resolved binary path so WebdriverIO can use it.
 *
 * URL Pattern:
 *   http://<HOST_URL>/<DriverVersion>/<filename>.zip
 *
 * The filename is auto-built from the OS + architecture:
 *   • win32  / x64  → edgedriver_win64.zip
 *   • win32  / ia32 → edgedriver_win32.zip
 *   • linux  / x64  → edgedriver_linux64.zip
 *   • linux  / arm64→ edgedriver_linux_arm64.zip
 *   • darwin / x64  → edgedriver_mac64.zip
 *   • darwin / arm64→ edgedriver_mac_arm64.zip
 *
 * Usage:
 *   const { CustomDriverResolver } = require('@wdio-framework/core');
 *
 *   // Minimal — uses env vars DRIVER_HOST_URL + DRIVER_VERSION
 *   const edgePath = await CustomDriverResolver.resolve();
 *
 *   // Explicit — override everything
 *   const edgePath = await CustomDriverResolver.resolve({
 *       hostUrl:      'https://artifacts.corp.net/drivers',
 *       driverName:   'edgedriver',
 *       version:      '120.0.2210.91',
 *       os:           'win32',
 *       arch:         'x64',
 *       cacheDir:     '.cache',
 *       fileExtension:'zip',
 *       binaryName:   'msedgedriver',   // name inside the archive
 *       forceDownload: false,
 *   });
 *
 *   // Then use in wdio config:
 *   capabilities: [{
 *       browserName: 'MicrosoftEdge',
 *       'ms:edgeOptions': { binary: '...' },
 *       'wdio:edgedriverOptions': { edgedriverCustomPath: edgePath },
 *   }]
 *
 * Environment Variables (all optional, overridden by code options):
 *   DRIVER_HOST_URL    — base URL of the artifact server
 *   DRIVER_VERSION     — driver version string (e.g. "120.0.2210.91")
 *   DRIVER_NAME        — driver archive prefix (default: "edgedriver")
 *   DRIVER_BINARY_NAME — executable name inside the archive (default: "msedgedriver")
 *   DRIVER_CACHE_DIR   — cache directory relative to project root (default: ".cache")
 *   DRIVER_FORCE_DOWNLOAD — set to "true" to re-download even if cached
 * ═══════════════════════════════════════════════════════════════════════
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const http = require('http');
const https = require('https');
const { Logger } = require('./Logger');

const logger = Logger.getInstance('CustomDriverResolver');

// ─── Platform / Architecture Mapping ──────────────────────────

/**
 * Generates the platform-specific filename segment.
 *
 * @param {string} driverName - Prefix (e.g. "edgedriver")
 * @param {string} platform   - Node os.platform() value
 * @param {string} arch       - Node os.arch() value
 * @returns {string} e.g. "edgedriver_win64"
 */
function buildArchiveBaseName(driverName, platform, arch) {
    const platformMap = {
        win32:  { x64: 'win64', ia32: 'win32', arm64: 'win_arm64' },
        linux:  { x64: 'linux64', ia32: 'linux32', arm64: 'linux_arm64' },
        darwin: { x64: 'mac64', arm64: 'mac_arm64' },
    };

    const archMap = platformMap[platform];
    if (!archMap) {
        throw new Error(
            `Unsupported platform "${platform}". Supported: ${Object.keys(platformMap).join(', ')}`,
        );
    }

    const suffix = archMap[arch];
    if (!suffix) {
        throw new Error(
            `Unsupported architecture "${arch}" on ${platform}. Supported: ${Object.keys(archMap).join(', ')}`,
        );
    }

    return `${driverName}_${suffix}`;
}

/**
 * Returns the expected binary name with the correct extension for the
 * current platform.
 *
 * @param {string} binaryName - Base name (e.g. "msedgedriver")
 * @param {string} platform   - Node os.platform()
 * @returns {string} "msedgedriver.exe" on Windows, "msedgedriver" elsewhere
 */
function resolveBinaryFilename(binaryName, platform) {
    return platform === 'win32' ? `${binaryName}.exe` : binaryName;
}

// ─── Download Helpers ─────────────────────────────────────────

/**
 * Downloads a file from a URL and writes it to disk.
 * Supports HTTP and HTTPS. Follows up to 5 redirects.
 *
 * @param {string} url       - Full download URL
 * @param {string} destPath  - Absolute file path to write to
 * @returns {Promise<void>}
 */
function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const MAX_REDIRECTS = 5;
        let redirectCount = 0;

        function attemptDownload(currentUrl) {
            const client = currentUrl.startsWith('https') ? https : http;

            logger.info(`Downloading: ${currentUrl}`);

            const request = client.get(currentUrl, (response) => {
                // Handle redirects (301, 302, 303, 307, 308)
                if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
                    redirectCount++;
                    if (redirectCount > MAX_REDIRECTS) {
                        return reject(new Error(`Too many redirects (>${MAX_REDIRECTS}) for ${url}`));
                    }
                    const redirectUrl = response.headers.location;
                    if (!redirectUrl) {
                        return reject(new Error(`Redirect without Location header from ${currentUrl}`));
                    }
                    // Resolve relative redirect URLs against the current request URL
                    const resolvedRedirectUrl = new URL(redirectUrl, currentUrl).toString();
                    logger.debug(`Redirect ${redirectCount} \u2192 ${resolvedRedirectUrl}`);
                    return attemptDownload(resolvedRedirectUrl);
                }

                if (response.statusCode !== 200) {
                    return reject(
                        new Error(`Download failed: HTTP ${response.statusCode} for ${currentUrl}`),
                    );
                }

                const totalBytes = parseInt(response.headers['content-length'], 10) || 0;
                let downloadedBytes = 0;
                let lastLoggedPercent = -1;

                const fileStream = fs.createWriteStream(destPath);

                response.on('data', (chunk) => {
                    downloadedBytes += chunk.length;
                    if (totalBytes > 0) {
                        const pct = Math.floor((downloadedBytes / totalBytes) * 100);
                        // Log at every 25% interval
                        if (pct >= lastLoggedPercent + 25) {
                            lastLoggedPercent = pct;
                            logger.info(`  Progress: ${pct}% (${(downloadedBytes / 1024 / 1024).toFixed(1)} MB)`);
                        }
                    }
                });

                response.pipe(fileStream);

                fileStream.on('finish', () => {
                    fileStream.close();
                    logger.info(`Download complete: ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`);
                    resolve();
                });

                fileStream.on('error', (err) => {
                    fs.removeSync(destPath);
                    reject(err);
                });
            });

            request.on('error', (err) => {
                reject(new Error(`Network error downloading ${currentUrl}: ${err.message}`));
            });

            // 60-second timeout for the request
            request.setTimeout(60000, () => {
                request.destroy();
                reject(new Error(`Download timed out after 60s: ${currentUrl}`));
            });
        }

        attemptDownload(url);
    });
}

/**
 * Extracts a ZIP archive to a destination directory.
 * Uses the built-in Node.js `zlib` + `Archiver`-compatible approach,
 * falling back to the `unzipper` or system `tar`/`Expand-Archive`.
 *
 * @param {string} zipPath  - Path to the .zip file
 * @param {string} destDir  - Directory to extract into
 * @returns {Promise<void>}
 */
async function extractZip(zipPath, destDir) {
    fs.ensureDirSync(destDir);

    // Strategy 1: Try 'adm-zip' (lightweight, no native deps)
    try {
        const AdmZip = require('adm-zip');
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(destDir, /* overwrite */ true);
        logger.info(`Extracted via adm-zip to ${destDir}`);
        return;
    } catch {
        logger.debug('adm-zip not available, trying alternative extraction');
    }

    // Strategy 2: Try 'unzipper' (streaming)
    try {
        const unzipper = require('unzipper');
        await new Promise((resolve, reject) => {
            fs.createReadStream(zipPath)
                .pipe(unzipper.Extract({ path: destDir }))
                .on('close', resolve)
                .on('error', reject);
        });
        logger.info(`Extracted via unzipper to ${destDir}`);
        return;
    } catch {
        logger.debug('unzipper not available, trying system command');
    }

    // Strategy 3: OS-native extraction (safe against command injection)
    const { execFileSync } = require('child_process');
    const platform = os.platform();

    if (platform === 'win32') {
        // PowerShell Expand-Archive — use argument array to prevent injection
        execFileSync(
            'powershell',
            ['-NoProfile', '-Command', `Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force`],
            { stdio: 'pipe', timeout: 120000 },
        );
    } else {
        // Linux / macOS — unzip with argument array
        execFileSync('unzip', ['-o', zipPath, '-d', destDir], { stdio: 'pipe', timeout: 120000 });
    }

    logger.info(`Extracted via system command to ${destDir}`);
}

// ─── Main Resolver Class ──────────────────────────────────────

class CustomDriverResolver {
    /**
     * Resolve (download + extract + return path) a browser driver from a custom URL.
     *
     * @param {Object}  [options]
     * @param {string}  [options.hostUrl]         - Base artifact server URL (no trailing slash)
     * @param {string}  [options.driverName]      - Archive prefix (default: "edgedriver")
     * @param {string}  [options.version]         - Driver version string
     * @param {string}  [options.os]              - Override os.platform()
     * @param {string}  [options.arch]            - Override os.arch()
     * @param {string}  [options.cacheDir]        - Cache directory name (default: ".cache")
     * @param {string}  [options.fileExtension]   - Archive extension (default: "zip")
     * @param {string}  [options.binaryName]      - Executable name inside archive (default: "msedgedriver")
     * @param {boolean} [options.forceDownload]    - Re-download even if cached (default: false)
     * @param {string}  [options.customFilename]  - Override the entire filename (skip auto-build)
     * @param {string}  [options.sha256]          - Expected SHA-256 hex digest for download integrity check
     * @returns {Promise<string>} Absolute path to the extracted driver binary
     */
    static async resolve(options = {}) {
        const hostUrl       = options.hostUrl       || process.env.DRIVER_HOST_URL;
        const driverName    = options.driverName    || process.env.DRIVER_NAME        || 'edgedriver';
        const version       = options.version       || process.env.DRIVER_VERSION;
        const platform      = options.os            || os.platform();
        const arch          = options.arch          || os.arch();
        const cacheBase     = options.cacheDir      || process.env.DRIVER_CACHE_DIR   || '.cache';
        const fileExtension = options.fileExtension || 'zip';
        const binaryName    = options.binaryName    || process.env.DRIVER_BINARY_NAME || 'msedgedriver';
        const forceDownload = options.forceDownload || process.env.DRIVER_FORCE_DOWNLOAD === 'true';

        // ─── Validation ───────────────────────────────────────
        if (!hostUrl) {
            throw new Error(
                'CustomDriverResolver: hostUrl is required. ' +
                'Set DRIVER_HOST_URL env var or pass options.hostUrl.',
            );
        }
        if (!version) {
            throw new Error(
                'CustomDriverResolver: version is required. ' +
                'Set DRIVER_VERSION env var or pass options.version.',
            );
        }

        // ─── Build paths ─────────────────────────────────────
        const projectRoot = process.cwd();
        const cacheDir    = path.resolve(projectRoot, cacheBase);
        const versionDir  = path.join(cacheDir, driverName, version);

        // Auto-build filename from OS + arch, or use explicit override
        const archiveBaseName = options.customFilename
            ? options.customFilename
            : `${buildArchiveBaseName(driverName, platform, arch)}.${fileExtension}`;

        const downloadUrl = `${hostUrl.replace(/\/+$/, '')}/${version}/${archiveBaseName}`;
        const archivePath = path.join(versionDir, archiveBaseName);
        const binaryFileName = resolveBinaryFilename(binaryName, platform);

        logger.info('╔═══════════════════════════════════════════════════════════╗');
        logger.info('║         Custom Driver Resolution                         ║');
        logger.info('╚═══════════════════════════════════════════════════════════╝');
        logger.info(`  Driver     : ${driverName}`);
        logger.info(`  Version    : ${version}`);
        logger.info(`  Platform   : ${platform} / ${arch}`);
        logger.info(`  Archive    : ${archiveBaseName}`);
        logger.info(`  URL        : ${downloadUrl}`);
        logger.info(`  Cache Dir  : ${versionDir}`);
        logger.info(`  Binary     : ${binaryFileName}`);

        // ─── Check cache ──────────────────────────────────────
        const binaryPath = this._findBinary(versionDir, binaryFileName);
        if (binaryPath && !forceDownload) {
            logger.info(`✓ Driver already cached: ${binaryPath}`);
            this._ensureExecutable(binaryPath, platform);
            return binaryPath;
        }

        if (forceDownload) {
            logger.info('Force download enabled — removing existing cache');
            fs.removeSync(versionDir);
        }

        // ─── Download ─────────────────────────────────────────
        fs.ensureDirSync(versionDir);
        await downloadFile(downloadUrl, archivePath);

        // ─── Checksum verification (optional) ─────────────────
        if (options.sha256) {
            const crypto = require('crypto');
            const fileBuffer = fs.readFileSync(archivePath);
            const actual = crypto.createHash('sha256').update(fileBuffer).digest('hex');
            if (actual !== options.sha256.toLowerCase()) {
                fs.removeSync(archivePath);
                throw new Error(
                    `Checksum mismatch for ${archiveBaseName}.\n` +
                    `  Expected: ${options.sha256}\n` +
                    `  Actual:   ${actual}`,
                );
            }
            logger.info(`✓ SHA-256 checksum verified: ${actual.substring(0, 12)}...`);
        }

        // ─── Extract ──────────────────────────────────────────
        logger.info('Extracting archive...');
        await extractZip(archivePath, versionDir);

        // Clean up the archive file to save space
        fs.removeSync(archivePath);
        logger.info('Archive removed after extraction');

        // ─── Locate binary ────────────────────────────────────
        const resolvedBinaryPath = this._findBinary(versionDir, binaryFileName);
        if (!resolvedBinaryPath) {
            throw new Error(
                `Driver binary "${binaryFileName}" not found in extracted archive at ${versionDir}. ` +
                `Contents: ${this._listDir(versionDir).join(', ')}`,
            );
        }

        this._ensureExecutable(resolvedBinaryPath, platform);
        logger.info(`✓ Driver resolved: ${resolvedBinaryPath}`);
        return resolvedBinaryPath;
    }

    /**
     * Convenience method: resolve the driver and return an object ready
     * to spread into WDIO capabilities for Edge.
     *
     * @param {Object} [options] — same as resolve()
     * @returns {Promise<Object>} e.g. { 'wdio:edgedriverOptions': { edgedriverCustomPath: '...' } }
     */
    static async resolveEdgeCapabilityOverrides(options = {}) {
        const driverPath = await this.resolve({
            driverName: 'edgedriver',
            binaryName: 'msedgedriver',
            ...options,
        });

        return {
            'wdio:edgedriverOptions': {
                edgedriverCustomPath: driverPath,
            },
        };
    }

    /**
     * Convenience method: resolve the driver and return an object ready
     * to spread into WDIO capabilities for Chrome.
     *
     * @param {Object} [options] — same as resolve()
     * @returns {Promise<Object>}
     */
    static async resolveChromeCapabilityOverrides(options = {}) {
        const driverPath = await this.resolve({
            driverName: 'chromedriver',
            binaryName: 'chromedriver',
            ...options,
        });

        return {
            'wdio:chromedriverOptions': {
                binary: driverPath,
            },
        };
    }

    /**
     * Convenience method: resolve the driver and return an object ready
     * to spread into WDIO capabilities for Firefox (geckodriver).
     *
     * @param {Object} [options] — same as resolve()
     * @returns {Promise<Object>}
     */
    static async resolveGeckoCapabilityOverrides(options = {}) {
        const driverPath = await this.resolve({
            driverName: 'geckodriver',
            binaryName: 'geckodriver',
            ...options,
        });

        return {
            'wdio:geckodriverOptions': {
                binary: driverPath,
            },
        };
    }

    /**
     * Get the cache directory path for inspection / cleanup.
     *
     * @param {string} [cacheDir='.cache'] - Cache directory name
     * @returns {string} Absolute path
     */
    static getCacheDir(cacheDir = '.cache') {
        return path.resolve(process.cwd(), cacheDir);
    }

    /**
     * Clean the entire driver cache.
     *
     * @param {string} [cacheDir='.cache'] - Cache directory name
     */
    static cleanCache(cacheDir = '.cache') {
        const dir = this.getCacheDir(cacheDir);
        if (fs.existsSync(dir)) {
            fs.removeSync(dir);
            logger.info(`Cache cleaned: ${dir}`);
        }
    }

    // ─── Private Helpers ──────────────────────────────────────

    /**
     * Recursively find a binary file in a directory tree.
     * Some archives nest files inside a subdirectory.
     *
     * @param {string} dir          - Directory to search
     * @param {string} binaryName   - File name to locate
     * @returns {string|null} Absolute path or null
     */
    static _findBinary(dir, binaryName) {
        if (!fs.existsSync(dir)) return null;

        // Direct check first
        const directPath = path.join(dir, binaryName);
        if (fs.existsSync(directPath)) return directPath;

        // Recursive search (archives sometimes nest in a subfolder)
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const entryPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                const found = this._findBinary(entryPath, binaryName);
                if (found) return found;
            } else if (entry.name === binaryName) {
                return entryPath;
            }
        }

        return null;
    }

    /**
     * Ensure the binary is executable on Unix-like systems.
     *
     * @param {string} binaryPath
     * @param {string} platform
     */
    static _ensureExecutable(binaryPath, platform) {
        if (platform !== 'win32') {
            try {
                fs.chmodSync(binaryPath, 0o755);
            } catch (err) {
                logger.warn(`Could not set executable permission: ${err.message}`);
            }
        }
    }

    /**
     * List all files in a directory (for error diagnostics).
     *
     * @param {string} dir
     * @returns {string[]}
     */
    static _listDir(dir) {
        if (!fs.existsSync(dir)) return [];
        const results = [];

        function walk(currentDir, prefix = '') {
            const entries = fs.readdirSync(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
                if (entry.isDirectory()) {
                    walk(path.join(currentDir, entry.name), rel);
                } else {
                    results.push(rel);
                }
            }
        }

        walk(dir);
        return results;
    }
}

module.exports = { CustomDriverResolver };
