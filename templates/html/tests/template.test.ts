import { Template, utils } from 'tests'
import path from 'path'
import ApiError from '@/api/ApiError';

const html_template = new Template(path.resolve(__dirname, '../'))

test('the template is valid', async () => {

    await html_template.assertThatSyntaxIsValid()

})

test('the template cannot be parsed without path_to_source_code', async () => {

    let thrown_error

    try {
        await html_template.parse('app', 'website')
    } catch (error) {
        thrown_error = error
    }

    expect(thrown_error).toBeInstanceOf(ApiError)
    expect(thrown_error.status).toBe(422)
    expect(thrown_error.errors).toMatchObject({
        path_to_source_code: [ 'The path to html source code field is required.' ],
    })

})

test('the template can be parsed', async () => {

    const variables = {
        'path_to_source_code': 'src/',
    }

    const actual_template = await html_template.parse('app', 'website', variables)

    const expected_template = utils.readParsedTemplateFile(__dirname+'/concerns/parsed_template.yml')

    utils.assertThatTemplatesAreEqual(actual_template, expected_template)

})

test("the service works correctly when installed", async () => {

    const code_repository_path = path.resolve(__dirname, 'concerns/application/')

    const variables = {
        'path_to_source_code': 'src/',
    }

    await html_template.install(code_repository_path, variables)

    try {

        const host = `http://localhost:${html_template.getEntrypoint('html')?.host_port}`

        expect((await page.goto(`${host}/`))?.status()).toBe(200)
        expect(page.url()).toEqual(`${host}/`)
        expect(await page.content()).toContain('You are viewing the home page.')

        expect((await page.goto(`${host}/index.html`))?.status()).toBe(200)
        expect(page.url()).toEqual(`${host}/`)
        expect(await page.content()).toContain('You are viewing the home page.')

        expect((await page.goto(`${host}/hello`))?.status()).toBe(200)
        expect(page.url()).toEqual(`${host}/hello`)
        expect(await page.content()).toContain('You are viewing the hello page.')

        expect((await page.goto(`${host}/hello.html`))?.status()).toBe(200)
        expect(page.url()).toEqual(`${host}/hello`)
        expect(await page.content()).toContain('You are viewing the hello page.')

        expect((await page.goto(`${host}/hello/team`))?.status()).toBe(200)
        expect(page.url()).toEqual(`${host}/hello/team`)
        expect(await page.content()).toContain('You are viewing the team page.')

        expect((await page.goto(`${host}/hello/team.html`))?.status()).toBe(200)
        expect(page.url()).toEqual(`${host}/hello/team`)
        expect(await page.content()).toContain('You are viewing the team page.')

        expect((await page.goto(`${host}/baz`))?.status()).toBe(404)
        expect(page.url()).toEqual(`${host}/baz`)
        expect(await page.content()).toContain('Woops, page not found!')

    } finally {
        await html_template.uninstall()
    }

}, 1000 * 60 * 3)