<?php

namespace App\Console\Commands;

use App\Contracts\ImageUploader;
use App\Support\CloudinaryUploader;
use App\Support\ImageEngine;
use App\Support\MediaPath;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Diagnose image upload on the host it is run on.
 *
 * Cloudinary is the only image store: uploads go there and images are served
 * from there, so nothing is written to this server. That makes "works locally,
 * fails in production" almost always a question of credentials or reachability
 * rather than disk permissions, and this command answers it directly:
 *
 *   - which driver is actually bound;
 *   - whether CLOUDINARY_URL is present (config caching is a common culprit);
 *   - whether the credentials authenticate and the API is reachable;
 *   - optionally, a real upload round trip, which is the only thing that proves
 *     an upload will actually succeed.
 *
 * Run with --upload for the end-to-end proof.
 */
class MediaDoctorCommand extends Command
{
    protected $signature = 'media:doctor {--upload : Also perform a real upload and delete it again}';

    protected $description = 'Report whether image uploads can work on this host, and prove it end to end.';

    public function handle(): int
    {
        $this->newLine();
        $this->line('<options=bold>Bellah Options — image upload diagnostics</>');
        $this->newLine();

        $this->reportDriver();

        $ok = $this->checkCloudinary();

        if ($ok && $this->option('upload')) {
            $ok = $this->checkUploadRoundTrip();
        }

        $this->reportLegacyLocalMedia();
        $this->reportPhp();

        $this->newLine();

        if (! $ok) {
            $this->line('<fg=red>Image uploads will NOT work on this host until the above is fixed.</>');
            $this->newLine();
        }

        return $ok ? self::SUCCESS : self::FAILURE;
    }

    private function reportDriver(): void
    {
        $this->line('<options=bold>Upload driver</>');

        try {
            $driver = app(ImageUploader::class);
            $isCloudinary = $driver instanceof CloudinaryUploader;

            $this->line('  Bound class   : '.$driver::class);

            if (! $isCloudinary) {
                $this->line('  <fg=red>Unexpected. Cloudinary is meant to be the only image store, so this');
                $this->line('  binding has been overridden somewhere.</>');
            }
        } catch (Throwable $exception) {
            $this->line('  Bound class   : <fg=red>could not resolve — '.$exception->getMessage().'</>');
        }

        $this->newLine();
    }

    private function checkCloudinary(): bool
    {
        $this->line('<options=bold>Cloudinary</>');

        $url = trim((string) config('services.cloudinary.url', ''));

        if ($url === '') {
            $this->line('  CLOUDINARY_URL: <fg=red>not set</>');

            if (app()->configurationIsCached()) {
                $this->line('  <fg=yellow>Configuration is cached. A variable added to .env after the cache was');
                $this->line('  built is invisible to the app. Run: php artisan config:clear && php artisan config:cache</>');
            }

            $this->line('  <fg=red>Uploads cannot run. Nothing is written to this server as a fallback.</>');
            $this->newLine();

            return false;
        }

        $this->line('  CLOUDINARY_URL: set (cloud: '.$this->cloudName($url).')');
        $this->line('  Config cached : '.$this->yesNo(app()->configurationIsCached()));

        $driver = app(ImageUploader::class);

        if (! $driver instanceof CloudinaryUploader) {
            $this->line('  <fg=red>Skipping connectivity check: the bound driver is not the Cloudinary driver.</>');
            $this->newLine();

            return false;
        }

        $this->line('  Checking credentials and reachability...');
        $ping = $driver->ping();

        if (! $ping['ok']) {
            $this->line('  <fg=red>FAILED — '.$ping['message'].'</>');
            $this->line('  Common causes: an expired or rotated API secret, the wrong cloud name,');
            $this->line('  or outbound HTTPS to api.cloudinary.com being blocked by the host.');

            return false;
        }

        $this->line('  <fg=green>PASSED — credentials authenticate and the API is reachable.</>');
        $this->newLine();

        return true;
    }

    private function checkUploadRoundTrip(): bool
    {
        $this->line('<options=bold>Upload round trip</>');

        $driver = app(ImageUploader::class);

        if (! $driver instanceof CloudinaryUploader) {
            $this->line('  <fg=red>Skipped: not using the Cloudinary driver.</>');
            $this->newLine();

            return false;
        }

        $this->line('  Uploading a 1x1 probe image and deleting it again...');
        $result = $driver->verifyUpload();

        if (! $result['ok']) {
            $this->line('  <fg=red>FAILED — '.$result['message'].'</>');
            $this->line('  A ping succeeded, so this is an upload-specific problem: a read-only API');
            $this->line('  key, an exhausted quota, or a locked upload preset.');

            return false;
        }

        $this->line('  <fg=green>PASSED — uploaded and removed '.$result['message'].'</>');
        $this->newLine();

        return true;
    }

    /**
     * Assets stored locally before Cloudinary became the only store.
     *
     * Reported for information only: this path is read-only now, and matters
     * because those files still need to be served until they are migrated.
     */
    private function reportLegacyLocalMedia(): void
    {
        $this->line('<options=bold>Legacy local media (read-only)</>');

        $root = (string) config('filesystems.disks.'.ImageEngine::DISK.'.root', '');

        $this->line('  Root          : '.($root !== '' ? $root : '(unset)'));
        $this->line('  Root exists   : '.$this->yesNo($root !== '' && is_dir($root)));

        if ($root === '' || ! is_dir($root)) {
            $this->line('  Stored files  : none');
            $this->newLine();

            return;
        }

        $this->line('  Root writable : '.$this->yesNo(is_writable($root)).' <fg=gray>(not required — uploads no longer write here)</>');

        try {
            $disk = Storage::disk(ImageEngine::DISK);
            $files = 0;

            foreach ($disk->directories() as $directory) {
                $files += count($disk->files($directory));
            }

            $this->line('  Stored files  : '.$files.' (served via /media/{folder}/{name})');
        } catch (Throwable $exception) {
            $this->line('  Stored files  : <fg=yellow>could not read — '.$exception->getMessage().'</>');
        }

        $this->newLine();
    }

    private function reportPhp(): void
    {
        $this->line('<options=bold>PHP capabilities</>');
        $this->line('  <fg=gray>Uploads are forwarded through this server, so these limits still apply.</>');

        $this->line('  PHP version   : '.PHP_VERSION);
        $this->line('  file_uploads  : '.$this->yesNo((bool) ini_get('file_uploads')));
        $this->line('  upload_tmp_dir: '.(ini_get('upload_tmp_dir') ?: '(system default: '.sys_get_temp_dir().')'));
        $this->line('  Tmp writable  : '.$this->yesNo($this->tempDirWritable()));
        $this->line('  upload_max    : '.(ini_get('upload_max_filesize') ?: '(unset)'));
        $this->line('  post_max      : '.(ini_get('post_max_size') ?: '(unset)'));
        $this->line('  memory_limit  : '.(ini_get('memory_limit') ?: '(unset)'));
        $this->line('  open_basedir  : '.((string) ini_get('open_basedir') !== '' ? (string) ini_get('open_basedir') : '(not set)'));

        $this->newLine();
    }

    private function tempDirWritable(): bool
    {
        $probe = @tempnam(sys_get_temp_dir(), 'bellah-doctor-');

        if ($probe === false) {
            return false;
        }

        @unlink($probe);

        return true;
    }

    private function cloudName(string $url): string
    {
        // cloudinary://<api_key>:<api_secret>@<cloud_name>
        $host = (string) parse_url($url, PHP_URL_HOST);

        return $host !== '' ? $host : '(unparseable)';
    }

    private function yesNo(bool $value): string
    {
        return $value ? '<fg=green>yes</>' : '<fg=red>no</>';
    }
}
