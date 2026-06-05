const fs = require('fs')
const path = require('path')

const files = {
  middlewareFile: path.join(
    __dirname,
    '..',
    'node_modules',
    '@react-native',
    'dev-middleware',
    'dist',
    'createDevMiddleware.js'
  ),
  launcherFile: path.join(
    __dirname,
    '..',
    'node_modules',
    '@react-native',
    'dev-middleware',
    'dist',
    'utils',
    'DefaultToolLauncher.js'
  ),
  debuggerNodeFile: path.join(
    __dirname,
    '..',
    'node_modules',
    '@react-native',
    'debugger-shell',
    'dist',
    'node',
    'index.js'
  ),
  launchUtilsFile: path.join(
    __dirname,
    '..',
    'node_modules',
    '@react-native',
    'debugger-shell',
    'dist',
    'node',
    'private',
    'LaunchUtils.js'
  ),
}

function patchFile(file, transforms) {
  if (!fs.existsSync(file)) {
    console.warn('[patch-rn-devtools-shell] Arquivo nao encontrado:', file)
    return
  }

  let source = fs.readFileSync(file, 'utf8')
  let changed = false

  for (const transform of transforms) {
    if (source.includes(transform.after)) {
      continue
    }
    if (source.includes(transform.before)) {
      source = source.replace(transform.before, transform.after)
      changed = true
    } else {
      console.warn(
        '[patch-rn-devtools-shell] Trecho esperado nao encontrado em:',
        file
      )
    }
  }

  if (changed) {
    fs.writeFileSync(file, source)
    console.log(
      '[patch-rn-devtools-shell] Patch aplicado em',
      path.relative(process.cwd(), file)
    )
  } else {
    console.log(
      '[patch-rn-devtools-shell] Sem alteracoes em',
      path.relative(process.cwd(), file)
    )
  }
}

patchFile(files.middlewareFile, [
  {
    before:
      '    enableStandaloneFuseboxShell: config.enableStandaloneFuseboxShell ?? false,',
    after:
      '    enableStandaloneFuseboxShell: config.enableStandaloneFuseboxShell ?? true,',
  },
])

patchFile(files.launcherFile, [
  {
    before: `  async launchDebuggerShell(url, windowKey) {\n    if (process.env.NODE_ENV === "test") {\n      assertMockedInTests();\n    }\n    return await DefaultToolLauncher.launchDebuggerAppWindow(url);\n  },`,
    after: `  async launchDebuggerShell(url, windowKey) {\n    if (process.env.NODE_ENV === "test") {\n      assertMockedInTests();\n    }\n    return await unstable_spawnDebuggerShellWithArgs([\n      "--frontendUrl=" + url,\n      "--windowKey=" + windowKey,\n    ]);\n  },`,
  },
  {
    before: `  async prepareDebuggerShell(prebuiltBinaryPath) {\n    if (process.env.NODE_ENV === "test") {\n      assertMockedInTests();\n    }\n    return {\n      code: "platform_not_supported",\n      humanReadableMessage: "React Native DevTools standalone shell desativado neste projeto.",\n    };\n  },`,
    after: `  async prepareDebuggerShell(prebuiltBinaryPath) {\n    if (process.env.NODE_ENV === "test") {\n      assertMockedInTests();\n    }\n    return await unstable_prepareDebuggerShell();\n  },`,
  },
])

patchFile(files.debuggerNodeFile, [
  {
    before:
      '    const { ELECTRON_RUN_AS_NODE: _, GSETTINGS_SCHEMA_DIR: __, ...env } = process.env;',
    after:
      '    const { ELECTRON_RUN_AS_NODE: _, GSETTINGS_SCHEMA_DIR: __, RN_DEVTOOLS_GSETTINGS_SCHEMA_DIR, RN_DEVTOOLS_OZONE_PLATFORM, RN_DEVTOOLS_LIBGL_ALWAYS_SOFTWARE, RN_DEVTOOLS_GDK_BACKEND, RN_DEVTOOLS_FORCE_XWAYLAND, ...env } = process.env;',
  },
  {
    before:
      '    const { ELECTRON_RUN_AS_NODE: _, GSETTINGS_SCHEMA_DIR: __, RN_DEVTOOLS_GSETTINGS_SCHEMA_DIR, ...env } = process.env;',
    after:
      '    const { ELECTRON_RUN_AS_NODE: _, GSETTINGS_SCHEMA_DIR: __, RN_DEVTOOLS_GSETTINGS_SCHEMA_DIR, RN_DEVTOOLS_OZONE_PLATFORM, RN_DEVTOOLS_LIBGL_ALWAYS_SOFTWARE, RN_DEVTOOLS_GDK_BACKEND, RN_DEVTOOLS_FORCE_XWAYLAND, ...env } = process.env;',
  },
  {
    before: `    const child = spawn(binaryPath, [...baseArgs, ...args], {\n      stdio: ["ignore", "pipe", "pipe"],\n      windowsHide: true,\n      detached: mode === "detached",\n      env: {\n        ...env,\n        ...(RN_DEVTOOLS_GSETTINGS_SCHEMA_DIR\n          ? { GSETTINGS_SCHEMA_DIR: RN_DEVTOOLS_GSETTINGS_SCHEMA_DIR }\n          : {}),\n      },\n    });`,
    after: `    const child = spawn(binaryPath, [...baseArgs, ...args], {\n      stdio: ["ignore", "pipe", "pipe"],\n      windowsHide: true,\n      detached: mode === "detached",\n      env: {\n        ...env,\n        ...(RN_DEVTOOLS_GSETTINGS_SCHEMA_DIR\n          ? { GSETTINGS_SCHEMA_DIR: RN_DEVTOOLS_GSETTINGS_SCHEMA_DIR }\n          : {}),\n        ...(RN_DEVTOOLS_OZONE_PLATFORM\n          ? {\n              OZONE_PLATFORM: RN_DEVTOOLS_OZONE_PLATFORM,\n              ELECTRON_OZONE_PLATFORM_HINT: RN_DEVTOOLS_OZONE_PLATFORM,\n            }\n          : {}),\n        ...(RN_DEVTOOLS_LIBGL_ALWAYS_SOFTWARE === "1"\n          ? { LIBGL_ALWAYS_SOFTWARE: "1" }\n          : {}),\n        ...(RN_DEVTOOLS_GDK_BACKEND\n          ? { GDK_BACKEND: RN_DEVTOOLS_GDK_BACKEND }\n          : {}),\n        ...(RN_DEVTOOLS_FORCE_XWAYLAND === "1"\n          ? { WAYLAND_DISPLAY: '', XDG_SESSION_TYPE: 'x11' }\n          : {}),\n      },\n    });`,
  },
  {
    before: `    const child = spawn(binaryPath, runtimeArgs, {\n      stdio: ["ignore", "pipe", "pipe"],\n      windowsHide: true,\n      detached: mode === "detached",\n      env: {\n        ...env,\n        ...(RN_DEVTOOLS_GSETTINGS_SCHEMA_DIR\n          ? { GSETTINGS_SCHEMA_DIR: RN_DEVTOOLS_GSETTINGS_SCHEMA_DIR }\n          : {}),\n        ...(RN_DEVTOOLS_OZONE_PLATFORM\n          ? {\n              OZONE_PLATFORM: RN_DEVTOOLS_OZONE_PLATFORM,\n              ELECTRON_OZONE_PLATFORM_HINT: RN_DEVTOOLS_OZONE_PLATFORM,\n            }\n          : {}),\n        ...(RN_DEVTOOLS_LIBGL_ALWAYS_SOFTWARE === "1"\n          ? { LIBGL_ALWAYS_SOFTWARE: "1" }\n          : {}),\n      },\n    });`,
    after: `    const child = spawn(binaryPath, [...baseArgs, ...args], {\n      stdio: ["ignore", "pipe", "pipe"],\n      windowsHide: true,\n      detached: mode === "detached",\n      env: {\n        ...env,\n        ...(RN_DEVTOOLS_GSETTINGS_SCHEMA_DIR\n          ? { GSETTINGS_SCHEMA_DIR: RN_DEVTOOLS_GSETTINGS_SCHEMA_DIR }\n          : {}),\n        ...(RN_DEVTOOLS_OZONE_PLATFORM\n          ? {\n              OZONE_PLATFORM: RN_DEVTOOLS_OZONE_PLATFORM,\n              ELECTRON_OZONE_PLATFORM_HINT: RN_DEVTOOLS_OZONE_PLATFORM,\n            }\n          : {}),\n        ...(RN_DEVTOOLS_LIBGL_ALWAYS_SOFTWARE === "1"\n          ? { LIBGL_ALWAYS_SOFTWARE: "1" }\n          : {}),\n        ...(RN_DEVTOOLS_GDK_BACKEND\n          ? { GDK_BACKEND: RN_DEVTOOLS_GDK_BACKEND }\n          : {}),\n        ...(RN_DEVTOOLS_FORCE_XWAYLAND === "1"\n          ? { WAYLAND_DISPLAY: '', XDG_SESSION_TYPE: 'x11' }\n          : {}),\n      },\n    });`,
  },
])

patchFile(files.launchUtilsFile, [
  {
    before: `    const { GSETTINGS_SCHEMA_DIR: _, ...env } = process.env;\n    const child = spawn(command, args, {\n      stdio: ["ignore", "ignore", "pipe"],\n      encoding: "utf8",\n      windowsHide: true,\n      env,\n    });`,
    after: `    const {\n      GSETTINGS_SCHEMA_DIR: _,\n      RN_DEVTOOLS_GSETTINGS_SCHEMA_DIR,\n      RN_DEVTOOLS_OZONE_PLATFORM,\n      RN_DEVTOOLS_LIBGL_ALWAYS_SOFTWARE,\n      RN_DEVTOOLS_GDK_BACKEND,\n      RN_DEVTOOLS_FORCE_XWAYLAND,\n      ...env\n    } = process.env;\n    const child = spawn(command, args, {\n      stdio: ["ignore", "ignore", "pipe"],\n      encoding: "utf8",\n      windowsHide: true,\n      env: {\n        ...env,\n        ...(RN_DEVTOOLS_GSETTINGS_SCHEMA_DIR\n          ? { GSETTINGS_SCHEMA_DIR: RN_DEVTOOLS_GSETTINGS_SCHEMA_DIR }\n          : {}),\n        ...(RN_DEVTOOLS_OZONE_PLATFORM\n          ? {\n              OZONE_PLATFORM: RN_DEVTOOLS_OZONE_PLATFORM,\n              ELECTRON_OZONE_PLATFORM_HINT: RN_DEVTOOLS_OZONE_PLATFORM,\n            }\n          : {}),\n        ...(RN_DEVTOOLS_LIBGL_ALWAYS_SOFTWARE === "1"\n          ? { LIBGL_ALWAYS_SOFTWARE: "1" }\n          : {}),\n        ...(RN_DEVTOOLS_GDK_BACKEND\n          ? { GDK_BACKEND: RN_DEVTOOLS_GDK_BACKEND }\n          : {}),\n        ...(RN_DEVTOOLS_FORCE_XWAYLAND === "1"\n          ? { WAYLAND_DISPLAY: '', XDG_SESSION_TYPE: 'x11' }\n          : {}),\n      },\n    });`,
  },
  {
    before: `    const {\n      GSETTINGS_SCHEMA_DIR: _,\n      RN_DEVTOOLS_GSETTINGS_SCHEMA_DIR,\n      ...env\n    } = process.env;\n    const child = spawn(command, args, {\n      stdio: ["ignore", "ignore", "pipe"],\n      encoding: "utf8",\n      windowsHide: true,\n      env: {\n        ...env,\n        ...(RN_DEVTOOLS_GSETTINGS_SCHEMA_DIR\n          ? { GSETTINGS_SCHEMA_DIR: RN_DEVTOOLS_GSETTINGS_SCHEMA_DIR }\n          : {}),\n      },\n    });`,
    after: `    const {\n      GSETTINGS_SCHEMA_DIR: _,\n      RN_DEVTOOLS_GSETTINGS_SCHEMA_DIR,\n      RN_DEVTOOLS_OZONE_PLATFORM,\n      RN_DEVTOOLS_LIBGL_ALWAYS_SOFTWARE,\n      RN_DEVTOOLS_GDK_BACKEND,\n      RN_DEVTOOLS_FORCE_XWAYLAND,\n      ...env\n    } = process.env;\n    const child = spawn(command, args, {\n      stdio: ["ignore", "ignore", "pipe"],\n      encoding: "utf8",\n      windowsHide: true,\n      env: {\n        ...env,\n        ...(RN_DEVTOOLS_GSETTINGS_SCHEMA_DIR\n          ? { GSETTINGS_SCHEMA_DIR: RN_DEVTOOLS_GSETTINGS_SCHEMA_DIR }\n          : {}),\n        ...(RN_DEVTOOLS_OZONE_PLATFORM\n          ? {\n              OZONE_PLATFORM: RN_DEVTOOLS_OZONE_PLATFORM,\n              ELECTRON_OZONE_PLATFORM_HINT: RN_DEVTOOLS_OZONE_PLATFORM,\n            }\n          : {}),\n        ...(RN_DEVTOOLS_LIBGL_ALWAYS_SOFTWARE === "1"\n          ? { LIBGL_ALWAYS_SOFTWARE: "1" }\n          : {}),\n        ...(RN_DEVTOOLS_GDK_BACKEND\n          ? { GDK_BACKEND: RN_DEVTOOLS_GDK_BACKEND }\n          : {}),\n        ...(RN_DEVTOOLS_FORCE_XWAYLAND === "1"\n          ? { WAYLAND_DISPLAY: '', XDG_SESSION_TYPE: 'x11' }\n          : {}),\n      },\n    });`,
  },
])
