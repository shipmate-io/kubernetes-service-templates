import Cluster from '@/Cluster';
import Template from '@/Template';
import path from 'path'

const nuxtTemplate = new Template(path.resolve(__dirname, '../'))

test('the template is valid', async () => {

    await expect(nuxtTemplate).toHaveValidSyntax();

})

test('the template cannot be parsed without the necessary variables', async () => {

    const parsing = nuxtTemplate.parse('app', 'website');

    const expectedErrors = {
        package_manager: [ 'The package manager field is required.' ],
        build_target: ['The build target field is required.'],
        build_script: [ 'The build script field is required.' ],
        path_to_build: [ 'The path to build field is required.' ],
    };

    await expect(parsing).toFailDueToIncorrectFormInput(expectedErrors)

})

test('the template can be parsed', async () => {

    const variables = {
        'path_to_source_code': 'src/',
        'package_manager': 'npm',
        'private_npm_registries': [
            {
                'url': 'https://npm.pkg.github.com/',
                'scope': '@spatie',
                'auth_token': '5tS2O6eqzCMykMk9zF0za8L2QMbQGbbR',
            }
        ],
        'build_script': "npm run generate",
        'path_to_server': 'src/server.js',
    }

    const environment = {
        'NUXT_ENV_API_HOST': 'abc123',
        'NUXT_ENV_STRIPE_KEY': 'xyz789',
    }

    const parsing = nuxtTemplate.parse('app', 'website', variables, environment);

    await expect(parsing).toSucceed();
    await expect(parsing).toMatchParsedTemplate(__dirname+'/concerns/parsed_templates/npm.yml');

})

test('the service works correctly when installed', async () => {

    const cluster = await (new Cluster).start()

    try {

        const codeRepositoryPath = path.resolve(__dirname, 'concerns/application/')

        const variables = {
            'path_to_source_code': 'src/',
            'package_manager': 'npm',
            'build_script': '',
            'path_to_server': 'src/server.js',
        }

        const environment = {
            'NUXT_ENV_APP_KEY': 'abc123',
        }

        const nodeService = await cluster.installTemplate(nuxtTemplate, codeRepositoryPath, variables, environment)

        const host = `http://localhost:${nodeService.getEntrypoint('nodejs')?.host_port}`;

        expect((await page.goto(`${host}/`))?.status()).toBe(200);
        expect(page.url()).toEqual(`${host}/`);
        expect(await page.content()).toContain('Hi from')

    } finally {
        await cluster.stop()
    }

}, 1000 * 60 * 5)
