import { Template } from 'tests'
import path from 'path'

const htmlTemplate = new Template(path.resolve(__dirname, '../'))

test('the syntax of the template is valid', async () => {

    await expect(htmlTemplate).toHaveValidSyntax()

})

test('the template cannot be parsed without path_to_source_code', async () => {

    const expectedErrors = {
        path_to_source_code: [ 'The path to html source code field is required.' ],
    }

    const parsing = htmlTemplate.parse('app', 'website')

    await expect(parsing).toFailDueToIncorrectFormInput(expectedErrors)

})

test('the template can be parsed', async () => {

    const variables = {
        'path_to_source_code': 'src/',
    }

    const parsing = await htmlTemplate.parse('app', 'website', variables)

    await expect(parsing).toSucceed()
    await expect(parsing).toMatchParsedTemplate(__dirname+'/concerns/parsed_template.yml')

})

test("the service works correctly when installed", async () => {

    const codeRepositoryPath = path.resolve(__dirname, 'concerns/application/')

    const variables = {
        'path_to_source_code': 'src/',
    }

    const service = await htmlTemplate.install(codeRepositoryPath, variables)

    try {

        const host = `http://localhost:${service.getEntrypoint('html')?.host_port}`

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
        await service.uninstall()
    }

}, 1000 * 60 * 3)