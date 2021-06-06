import path from 'path'
import Template from '@/Template'
import TemplateService from '@/TemplateService'
import Cluster from '@/Cluster'

const htmlTemplate = new Template(path.resolve(__dirname, '../'))

test('the syntax of the template is valid', async () => {

    await expect(htmlTemplate).toHaveValidSyntax()

})

test('the template can be parsed without path_to_source_code', async () => {

    const parsing = await htmlTemplate.parse('app', 'website')

    await expect(parsing).toSucceed()
    await expect(parsing).toMatchParsedTemplate(__dirname+'/concerns/parsed_template_without_path_to_source_code.yml')

})

test('the template can be parsed with path_to_source_code', async () => {

    const variables = {
        'path_to_source_code': 'src/',
    }

    const parsing = await htmlTemplate.parse('app', 'website', variables)

    await expect(parsing).toSucceed()
    await expect(parsing).toMatchParsedTemplate(__dirname+'/concerns/parsed_template_with_path_to_source_code.yml')

})

test("the service works correctly when installed without path_to_source_code", async () => {

    const cluster = await (new Cluster).start()

    try {

        const codeRepositoryPath = path.resolve(__dirname, 'concerns/application/src/')

        const service = await cluster.installTemplate(htmlTemplate, codeRepositoryPath)

        await assertThatServiceWorksAsExpected(service)
        
    } finally {
        await cluster.stop()
    }

}, 1000 * 60 * 3)

test("the service works correctly when installed with path_to_source_code", async () => {

    const cluster = await (new Cluster).start()

    try {

        const codeRepositoryPath = path.resolve(__dirname, 'concerns/application/')

        const variables = {
            'path_to_source_code': 'src/',
        }

        const service = await cluster.installTemplate(htmlTemplate, codeRepositoryPath, variables)
    
        await assertThatServiceWorksAsExpected(service)

    } finally {
        await cluster.stop()
    }

}, 1000 * 60 * 3)

async function assertThatServiceWorksAsExpected(service: TemplateService) 
{
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
}
