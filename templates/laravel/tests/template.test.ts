import { Template, utils } from 'tests'
import axios from 'axios'
import fs from 'fs'
import FormData from 'form-data'
import path from 'path'
import Docker from 'dockerode'

const laravel_template = new Template(path.resolve(__dirname, '../'))
const mysql_template = new Template(path.resolve(__dirname, '../../mysql'))
const redis_template = new Template(path.resolve(__dirname, '../../redis'))

test('the template is valid', async () => {

    await laravel_template.assertThatSyntaxIsValid()

})

test('the template can be parsed', async () => {

    const variables = {
        'path_to_source_code': 'services/laravel/',
        'paths_to_shared_libraries': [
            'libraries/ui-components',
        ],
        'php_version': '7.4',
        'private_composer_registries': [
            {
                'url': 'private.packagist.com',
                'username': 'john.doe@example.com',
                'password': 'secret',
            }
        ],
        'additional_software_script': `
apt-get install -y default-mysql-client gnupg2 certbot python3-certbot-dns-cloudflare

[ -d storage ] ?? echo "storage folder exists" || echo "storage folder does not exist"

echo "deb http://ppa.launchpad.net/ansible/ansible/ubuntu trusty main" | tee -a /etc/apt/sources.list
apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 93C4A3FD7BB9C367
apt update
apt install -y ansible        
`,
        'timezone': 'Europe/Brussels',
        'opcache_enabled': true,
        'maximum_file_upload_size': 25,
        'persistent_storage': true,
        'run_scheduler': true,
        'daemons': [
            'php artisan horizon'
        ],
        'build_assets': true,
        'package_manager': 'npm',
        'build_assets_script': 'npm run production',
        'deploy_script': 'php artisan config:cache\nphp artisan route:cache\nphp artisan view:cache\nrm -f public/storage\nphp artisan storage:link',
        'release_script': 'php artisan db:ready\nphp artisan migrate --force',
    }

    const environment = {
        'APP_KEY': 'base64:c3SzeMQZZHPT+eLQH6BnpDhw/uKH2N5zgM2x2a8qpcA=',
        'APP_ENV': 'production',
        'APP_DEBUG': false,
    }

    const actual_template = await laravel_template.parse('app', 'backend', variables, environment)

    const expected_template = utils.readParsedTemplateFile(__dirname+'/concerns/parsed_template.yml')

    utils.assertThatTemplatesAreEqual(actual_template, expected_template)

}, 1000 * 15)

test("the service works correctly when installed", async () => {

    const code_repository_path = path.resolve(__dirname, 'concerns/application/')

    await mysql_template.install(null, { 
        'version': '8.0',
        'root_password': 'secret',
        'user': 'johndoe',
        'password': 's3cr3t',
        'databases': [
            { 'name': 'laravel-app' },
        ]
    })

    await redis_template.install(null, { 'version': '6', 'password': 'abc123' })

    const variables = {
        'path_to_source_code': '',
        'paths_to_shared_libraries': [],
        'php_version': '7.4',
        'private_composer_registries': [],
        'additional_software_script': `
apt-get install -y default-mysql-client gnupg2 certbot python3-certbot-dns-cloudflare

echo "deb http://ppa.launchpad.net/ansible/ansible/ubuntu trusty main" | tee -a /etc/apt/sources.list
apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 93C4A3FD7BB9C367
apt update
apt install -y ansible
`,
        'timezone': 'Europe/Brussels',
        'opcache_enabled': true,
        'maximum_file_upload_size': 25,
        'run_scheduler': true,
        'daemons': [
            'php artisan queue:work'
        ],
        'build_assets': true,
        'package_manager': 'npm',
        'build_assets_script': 'npm run production',
        'deploy_script': 'php artisan config:cache\nphp artisan route:cache\nphp artisan view:cache\nrm -f public/storage\nphp artisan storage:link',
        'release_script': 'sleep 60s\nphp artisan migrate --force',
    }

    const environment = {
        'APP_KEY': 'base64:c3SzeMQZZHPT+eLQH6BnpDhw/uKH2N5zgM2x2a8qpcA=',
        'APP_ENV': 'production',
        'APP_DEBUG': false,
        'DB_CONNECTION': 'mysql',
        'DB_DATABASE': 'laravel-app',
        'DB_HOST': mysql_template.getStatelessSet('laravel')?.containers[0].id,
        'DB_PORT': 3306,
        'DB_USERNAME': 'johndoe',
        'DB_PASSWORD': 's3cr3t',
        'REDIS_HOST': 'host.docker.internal',
        'REDIS_PASSWORD': 'abc123',
        'REDIS_PORT': redis_template.getEntrypoint('redis')?.host_port,
    }

    await laravel_template.install(code_repository_path, variables, environment)

    try {

        const host = `http://localhost:${laravel_template.getEntrypoint('laravel')?.host_port}`

        await assertThatHomepageCanBeVisited(host)
        await assertThatImagesFromTheStorageFolderCanBeLoaded(host)
        await assertThatPhpinfoShowsTheExpectedConfiguration(host)
        await assertThatLogsAreWrittenToStdout(host)
        await assertThatCronJobIsExecuted()
        await assertThatQueuedJobsAreExecuted(host)
        await assertThatFilesCanBeUploaded(host)

    } finally {
        await laravel_template.uninstall()
        await mysql_template.uninstall()
        await redis_template.uninstall()
    }

}, 1000 * 60 * 5)

async function assertThatHomepageCanBeVisited(host: string): Promise<void>
{
    expect((await page.goto(`${host}/`))?.status()).toBe(200)
    expect(page.url()).toEqual(`${host}/`)
    expect(await page.content()).toContain('Laravel')
}

async function assertThatImagesFromTheStorageFolderCanBeLoaded(host: string): Promise<void>
{
    const image_response = await axios.get(`${host}/storage/image.jpg`)

    expect(image_response.status).toBe(200)
}

async function assertThatPhpinfoShowsTheExpectedConfiguration(host: string): Promise<void>
{
    expect((await page.goto(`${host}/phpinfo`))?.status()).toBe(200)
    expect(page.url()).toEqual(`${host}/phpinfo`)

    const html = await page.evaluate(() => document.body.innerHTML)
    expect(html).toContain('<td class="e">post_max_size</td><td class="v">25M</td><td class="v">25M</td>')
    expect(html).toContain('<td class="e">upload_max_filesize</td><td class="v">25M</td><td class="v">25M</td>')
    expect(html).toContain('<td class="e">date.timezone</td><td class="v">Europe/Brussels</td>')
}

async function assertThatLogsAreWrittenToStdout(host: string): Promise<void>
{
    const laravel_container_id = laravel_template.getStatelessSet('laravel')?.containers[0].id

    if(! laravel_container_id) fail()

    const laravel_container = await new Docker().getContainer(laravel_container_id)

    const logs_1 = await laravel_container.logs({ stdout: true, stderr: true, tail: 100, follow: false })

    expect(logs_1.toString()).toContain("Current default time zone: 'Europe/Brussels'")
    expect(logs_1.toString()).not.toContain("production.ERROR: Woops, something went wrong.")

    await page.goto(`${host}/log`)

    const logs_2 = await laravel_container.logs({ stdout: true, stderr: true, tail: 100, follow: false })

    expect(logs_2.toString()).toContain("production.ERROR: Woops, something went wrong.")
}

async function assertThatCronJobIsExecuted(): Promise<void>
{
    const scheduler_container_id = laravel_template.getStatelessSet('laravel')?.containers[0].id

    if(! scheduler_container_id) fail()

    const scheduler_container = await new Docker().getContainer(scheduler_container_id)

    const logs_1 = await scheduler_container.logs({ stdout: true, stderr: true, tail: 100, follow: false })

    expect(logs_1.toString()).toContain('production.NOTICE: Cron job executed.')
}

async function assertThatQueuedJobsAreExecuted(host: string): Promise<void>
{
    const daemon_container_id = laravel_template.getStatelessSet('laravel')?.containers[0].id

    if(! daemon_container_id) fail()

    const daemon_container = await new Docker().getContainer(daemon_container_id)

    await page.goto(`${host}/job`)

    await utils.sleep(5)

    const logs = await daemon_container.logs({ stdout: true, stderr: true, tail: 100, follow: false })

    expect(logs.toString()).toContain('production.NOTICE: Queued job executed.')
}

async function assertThatFilesCanBeUploaded(host: string): Promise<void>
{
    const form = new FormData()

    form.append('image', fs.createReadStream(path.resolve(__dirname, 'concerns/image.jpg')))

    const upload_response = await axios.post(`${host}/image-upload`, form, {
        headers: {
            ...form.getHeaders()
        }
    })

    expect(upload_response.status).toBe(200)

    const image_url = upload_response.data

    expect(image_url).toBeString()

    const image_response = await axios.get(image_url)

    expect(image_response.status).toBe(200)
}