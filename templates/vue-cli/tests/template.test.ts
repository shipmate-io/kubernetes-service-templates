import { Template, utils } from 'tests'
import path from 'path'
import ApiError from '@/api/ApiError';

const vue_template = new Template(path.resolve(__dirname, '../'))

test('the template is valid', async () => {

    await vue_template.assertThatSyntaxIsValid()

})

test('the template cannot be parsed without package_manager and build_script', async () => {

    let thrown_error

    try {
        await vue_template.parse('app', 'website')
    } catch (error) {
        thrown_error = error
    }

    expect(thrown_error).toBeInstanceOf(ApiError)
    expect(thrown_error.status).toBe(422)
    expect(thrown_error.errors).toMatchObject({
        package_manager: [ 'The package manager field is required.' ],
        build_script: [ 'The build script field is required.' ],
    })

})

describe('the template can be parsed', () => {
  
    test('with npm as package manager', async () => {

        const variables = {
            'path_to_source_code': 'src/',
            'package_manager': 'npm',
            'build_script': "npm run build\nnpm run optimize",
            'path_to_built_source_code': 'dist/',
        }

        const environment = {
            'VUE_APP_API_HOST': 'abc123',
            'VUE_APP_STRIPE_KEY': 'xyz789',
        }
        
        const actual_template = await vue_template.parse('app', 'website', variables, environment)
    
        const expected_template = utils.readParsedTemplateFile(__dirname+'/concerns/parsed_templates/npm.yml')
    
        utils.assertThatTemplatesAreEqual(actual_template, expected_template)

    })
  
    test('with yarn as package manager', async () => {

        const variables = {
            'path_to_source_code': '',
            'package_manager': 'yarn',
            'build_script': "yarn run build",
            'path_to_built_source_code': 'dist/',
        }
        
        const actual_template = await vue_template.parse('app', 'website', variables)
    
        const expected_template = utils.readParsedTemplateFile(__dirname+'/concerns/parsed_templates/yarn.yml')
    
        utils.assertThatTemplatesAreEqual(actual_template, expected_template)

    })
  
})

describe("the service works correctly when installed", () => {

    test('with npm as package manager', async () => {
        
        const code_repository_path = path.resolve(__dirname, 'concerns/application/')

        const variables = {
            'path_to_source_code': 'vue/',
            'package_manager': 'npm',
            'build_script': "npm run build",
            'path_to_built_source_code': 'dist/',
        }

        const environment = {
            'VUE_APP_KEY': 'abc123',
        }

        await vue_template.install(code_repository_path, variables, environment)

        try {

            const host = `http://localhost:${vue_template.getEntrypoint('vue')?.host_port}`

            expect((await page.goto(`${host}/`))?.status()).toBe(200)
            expect(page.url()).toEqual(`${host}/`)
            expect(await page.content()).toContain('You are viewing page: foo')
            expect(await page.content()).toContain('The application key is: abc123')

            expect((await page.goto(`${host}/bar`))?.status()).toBe(200)
            expect(page.url()).toEqual(`${host}/bar`)
            expect(await page.content()).toContain('You are viewing page: bar')

            expect((await page.goto(`${host}/baz`))?.status()).toBe(200)
            expect(page.url()).toEqual(`${host}/404`)
            expect(await page.content()).toContain('Oops, page not found!')

        } finally {
            await vue_template.uninstall()
        }

    }, 1000 * 60 * 4)

    test('with yarn as package manager', async () => {
        
        const code_repository_path = path.resolve(__dirname, 'concerns/application/vue/')

        const variables = {
            'path_to_source_code': '/',
            'package_manager': 'yarn',
            'build_script': "yarn run build",
            'path_to_built_source_code': 'dist/',
        }

        await vue_template.install(code_repository_path, variables)

        try {

            const host = `http://localhost:${vue_template.getEntrypoint('vue')?.host_port}`

            expect((await page.goto(`${host}/`))?.status()).toBe(200)
            expect(page.url()).toEqual(`${host}/`)
            expect(await page.content()).toContain('You are viewing page: foo')

            expect((await page.goto(`${host}/bar`))?.status()).toBe(200)
            expect(page.url()).toEqual(`${host}/bar`)
            expect(await page.content()).toContain('You are viewing page: bar')

            expect((await page.goto(`${host}/baz`))?.status()).toBe(200)
            expect(page.url()).toEqual(`${host}/404`)
            expect(await page.content()).toContain('Oops, page not found!')

        } finally {
            await vue_template.uninstall()
        }

    }, 1000 * 60 * 4)

})