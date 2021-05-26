import { Template, utils } from 'tests'
import path from 'path'
import ApiError from '@/api/ApiError';

const htmlTemplate = new Template(path.resolve(__dirname, '../'))

test('the syntax of the template is valid', async () => {

    await expect(htmlTemplate).toHaveValidSyntax()

})

test('the template cannot be parsed without path_to_source_code', async () => {

    let thrownError

    try {
        await htmlTemplate.parse('app', 'website')
    } catch (error) {
        thrownError = error
    }

    expect(thrownError).toBeInstanceOf(ApiError)
    expect(thrownError.status).toBe(422)
    expect(thrownError.errors).toMatchObject({
        path_to_source_code: [ 'The path to html source code field is required.' ],
    })

})

test('the template can be parsed', async () => {

    const variables = {
        'path_to_source_code': 'src/',
    }

    const actualTemplate = await htmlTemplate.parse('app', 'website', variables)

    const expectedTemplate = utils.readParsedTemplateFile(__dirname+'/concerns/parsed_template.yml')

    utils.assertThatTemplatesAreEqual(actualTemplate, expectedTemplate)

})

test("the service works correctly when installed", async () => {

    const codeRepositoryPath = path.resolve(__dirname, 'concerns/application/')

    const variables = {
        'path_to_source_code': 'src/',
    }

    await htmlTemplate.install(codeRepositoryPath, variables)

    try {

        const host = `http://localhost:${htmlTemplate.getEntrypoint('html')?.host_port}`

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
        await htmlTemplate.uninstall()
    }

}, 1000 * 60 * 3)