<?php

$basePath = dirname(__DIR__);
$concurrently = $basePath.DIRECTORY_SEPARATOR.'node_modules'.DIRECTORY_SEPARATOR.'concurrently'.DIRECTORY_SEPARATOR.'dist'.DIRECTORY_SEPARATOR.'bin'.DIRECTORY_SEPARATOR.'concurrently.js';

if (! file_exists($concurrently)) {
    fwrite(STDERR, "Missing concurrently. Run npm install first.\n");
    exit(1);
}

$nodeBinary = PHP_OS_FAMILY === 'Windows' ? 'node.exe' : 'node';
$npmBinary = PHP_OS_FAMILY === 'Windows' ? 'npm.cmd' : 'npm';

$node = firstExistingPath([
    getenv('NODE_BINARY') ?: null,
    ...pathsFromLaragon($nodeBinary),
    ...pathsFromEnvironment($nodeBinary),
    PHP_OS_FAMILY === 'Windows' ? 'C:\Program Files\nodejs\node.exe' : null,
]);

$npm = firstExistingPath([
    getenv('NPM_BINARY') ?: null,
    ...pathsFromLaragon($npmBinary),
    ...pathsFromEnvironment($npmBinary),
    PHP_OS_FAMILY === 'Windows' ? 'C:\Program Files\nodejs\npm.cmd' : null,
]);

if ($node === null) {
    fwrite(STDERR, "Unable to find node. Install Node.js or set NODE_BINARY to its full path.\n");
    exit(1);
}

if ($npm === null) {
    fwrite(STDERR, "Unable to find npm. Install Node.js or set NPM_BINARY to its full path.\n");
    exit(1);
}

$php = PHP_BINARY;

$command = [
    $node,
    $concurrently,
    '-c',
    '#93c5fd,#c4b5fd,#fdba74',
];

$names = [];

$host = getenv('LARAVEL_DEV_HOST') ?: '127.0.0.1';
$port = getenv('LARAVEL_DEV_PORT') ?: '8000';

$command[] = command($php, ['artisan', 'serve', '--host='.$host, '--port='.$port]);
$names[] = 'server';

$command[] = command($php, ['artisan', 'queue:listen', '--tries=1', '--timeout=0']);
$command[] = command($npm, ['run', 'dev']);
$names[] = 'queue';
$names[] = 'vite';
$command[] = '--names='.implode(',', $names);
$command[] = '--kill-others';

if (in_array('--dry-run', $argv, true)) {
    fwrite(STDOUT, implode(PHP_EOL, [
        'Dev command:',
        implode(' ', array_map('quote', $command)),
        '',
    ]));
    exit(0);
}

$descriptorSpec = [
    ['file', 'php://stdin', 'r'],
    ['file', 'php://stdout', 'w'],
    ['file', 'php://stderr', 'w'],
];

$process = proc_open($command, $descriptorSpec, $pipes, $basePath);

if (! is_resource($process)) {
    fwrite(STDERR, "Unable to start the development processes.\n");
    exit(1);
}

exit(proc_close($process));

/**
 * @param  array<int, string|null>  $paths
 */
function firstExistingPath(array $paths): ?string
{
    foreach ($paths as $path) {
        if (! is_string($path) || trim($path) === '') {
            continue;
        }

        $firstLine = strtok(trim($path), PHP_EOL);
        if (! is_string($firstLine) || trim($firstLine) === '') {
            continue;
        }

        $candidate = trim($firstLine);

        if (file_exists($candidate)) {
            return $candidate;
        }
    }

    return null;
}

/**
 * @return array<int, string>
 */
function pathsFromEnvironment(string $binary): array
{
    $paths = [];
    $pathValue = (string) getenv('PATH');

    foreach (explode(PATH_SEPARATOR, $pathValue) as $directory) {
        $directory = trim($directory, '" ');

        if ($directory === '') {
            continue;
        }

        $paths[] = rtrim($directory, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR.$binary;
    }

    return $paths;
}

/**
 * @return array<int, string>
 */
function pathsFromLaragon(string $binary): array
{
    $paths = [];
    $nodeRoot = 'C:\laragon\bin\nodejs';

    if (! is_dir($nodeRoot)) {
        return $paths;
    }

    $directories = glob($nodeRoot.DIRECTORY_SEPARATOR.'*', GLOB_ONLYDIR);

    if ($directories === false) {
        return $paths;
    }

    rsort($directories);

    foreach ($directories as $directory) {
        $paths[] = $directory.DIRECTORY_SEPARATOR.$binary;
    }

    return $paths;
}

function quote(string $value): string
{
    return '"'.str_replace('"', '\"', $value).'"';
}

/**
 * @param  array<int, string>  $arguments
 */
function command(string $binary, array $arguments): string
{
    return implode(' ', [
        commandPart($binary),
        ...array_map('commandPart', $arguments),
    ]);
}

function commandPart(string $value): string
{
    if (! str_contains($value, ' ') && ! str_contains($value, '"')) {
        return $value;
    }

    return '"'.str_replace('"', '\"', $value).'"';
}
