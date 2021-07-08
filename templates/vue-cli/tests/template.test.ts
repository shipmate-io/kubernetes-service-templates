import Cluster from '@/Cluster';
import Template from '@/Template';
import path from 'path'

const vueCliTemplate = new Template(path.resolve(__dirname, '../'))

test('the template is valid', async () => {

    await expect(vueCliTemplate).toHaveValidSyntax();

})

test('the template cannot be parsed without the necessary variables', async () => {

    const parsing = vueCliTemplate.parse('app', 'website');

    const expectedErrors = {
        package_manager: [ 'The package manager field is required.' ],
        build_script: [ 'The build script field is required.' ],
        path_to_build: [ 'The path to build field is required.' ],
    };

    await expect(parsing).toFailDueToIncorrectFormInput(expectedErrors)

})

describe('the template can be parsed', () => {
  
    test('with npm as package manager', async () => {

        const variables = {
            'path_to_source_code': 'vue/',
            'package_manager': 'npm',
            'build_script': "npm run build\nnpm run optimize",
            'path_to_build': 'dist/',
        }

        const environment = {
            'VUE_APP_API_HOST': 'abc123',
            'VUE_APP_STRIPE_KEY': 'xyz789',
        }

        const parsing = vueCliTemplate.parse('app', 'website', variables, environment);

        await expect(parsing).toSucceed();
        await expect(parsing).toMatchParsedTemplate(__dirname+'/concerns/parsed_templates/npm.yml');

    })
  
    test('with yarn as package manager', async () => {

        const variables = {
            'path_to_source_code': '',
            'package_manager': 'yarn',
            'build_script': "yarn run build",
            'path_to_build': 'dist/',
            'additional_software_script': "apt-get install -y autoreconf",
        }

        const parsing = vueCliTemplate.parse('app', 'website', variables);

        await expect(parsing).toSucceed();
        await expect(parsing).toMatchParsedTemplate(__dirname+'/concerns/parsed_templates/yarn.yml');

    })
  
})

describe("the service works correctly when installed", () => {

    test('with npm as package manager', async () => {

        const cluster = await (new Cluster).start()

        try {
        
            const codeRepositoryPath = path.resolve(__dirname, 'concerns/application/')

            const variables = {
                'path_to_source_code': 'vue/',
                'package_manager': 'npm',
                'build_script': "npm run build",
                'path_to_build': 'dist/',
            }

            const environment = {
                'VUE_APP_KEY': 'abc123',
            }

            const vueCliService = await cluster.installTemplate(
                vueCliTemplate, codeRepositoryPath, variables, environment
            )

            const host = `http://localhost:${vueCliService.getEntrypoint('vue')?.host_port}`;

            expect((await page.goto(`${host}/`))?.status()).toBe(200);
            expect(page.url()).toEqual(`${host}/`);
            expect(await page.content()).toContain('You are viewing page: foo');
            expect(await page.content()).toContain('The application key is: abc123');

            expect((await page.goto(`${host}/bar`))?.status()).toBe(200);
            expect(page.url()).toEqual(`${host}/bar`);
            expect(await page.content()).toContain('You are viewing page: bar');

            expect((await page.goto(`${host}/baz`))?.status()).toBe(200);
            expect(page.url()).toEqual(`${host}/404`);
            expect(await page.content()).toContain('Oops, page not found!');

        } finally {
            await cluster.stop()
        }

    }, 1000 * 60 * 5)

    test('with yarn as package manager', async () => {

        const cluster = await (new Cluster).start()

        try {
        
            const codeRepositoryPath = path.resolve(__dirname, 'concerns/application/vue/')

            const variables = {
                'path_to_source_code': '/',
                'package_manager': 'yarn',
                'build_script': "yarn run build",
                'path_to_build': 'dist/',
            }

            const vueCliService = await cluster.installTemplate(vueCliTemplate, codeRepositoryPath, variables)

            const host = `http://localhost:${vueCliService.getEntrypoint('vue')?.host_port}`;

            expect((await page.goto(`${host}/`))?.status()).toBe(200);
            expect(page.url()).toEqual(`${host}/`);
            expect(await page.content()).toContain('You are viewing page: foo');
            expect(await page.content()).not.toContain('The application key is: abc123');

            expect((await page.goto(`${host}/bar`))?.status()).toBe(200);
            expect(page.url()).toEqual(`${host}/bar`);
            expect(await page.content()).toContain('You are viewing page: bar');

            expect((await page.goto(`${host}/baz`))?.status()).toBe(200);
            expect(page.url()).toEqual(`${host}/404`);
            expect(await page.content()).toContain('Oops, page not found!');

        } finally {
            await cluster.stop()
        }

    }, 1000 * 60 * 5)

})