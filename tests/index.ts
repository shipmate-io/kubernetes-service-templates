import fs from 'fs'
import YAML from 'yaml'
import ParseTemplate from './templates/ParseTemplate'
import ValidateTemplate from './templates/ValidateTemplate'
import InstallTemplate from './templates/InstallTemplate'
import UninstallTemplate from './templates/UninstallTemplate'
import { Entrypoint, ParsedTemplate, Variables, StatelessSet } from '@/types'
import 'jest-extended'

function assertThatObjectsAreEqual(actual: any, expected: any): void
{
    if(typeof expected === 'object' && typeof actual === 'object') {
        const actualProperties = Object.keys(actual)
        const expectedProperties = Object.keys(expected)
        expect(actualProperties).toEqual(expect.arrayContaining(expectedProperties));
        
        expectedProperties.forEach(expectedProperty => {
            const actualValue = actual[expectedProperty]
            const expectedValue = expected[expectedProperty] 
            assertThatObjectsAreEqual(actualValue, expectedValue)
        })

        return
    }

    if(typeof expected === 'string' && typeof actual === 'string') {
        expect(actual.trim()).toBe(expected.trim());
        return
    }
    
    expect(actual).toBe(expected)
}

export class Template {

    templatePath: string
    parsedTemplate?: ParsedTemplate

    constructor(templatePath: string)
    {
        this.templatePath = templatePath
    }
    
    async parse(
        applicationSlug: string, serviceName: string, variables: Variables = {}, environment: Variables = {}
    ): Promise<ParsedTemplate>
    {
        return await (new ParseTemplate).execute(
            applicationSlug, serviceName, this.templatePath, 'latest', variables, environment
        )
    }
    
    async assertThatSyntaxIsValid(): Promise<void>
    {
        const error =  await (new ValidateTemplate).execute(this.templatePath)

        expect(error).toBe(null)
    }
    
    async install(
        codeRepositoryPath: string|null, variables: Variables = {}, environment: Variables = {}, 
        initializationTimeInSeconds: number = 10
    ): Promise<void>
    {
        this.parsedTemplate = await (new InstallTemplate).execute(
            codeRepositoryPath, this.templatePath, 'latest', variables, environment, initializationTimeInSeconds
        )
    }
    
    getStatelessSet(name: string): StatelessSet|null
    {
        if(! this.parsedTemplate) return null

        for(const resource of this.parsedTemplate.template.deployment) {
            if(resource.type !== 'stateless_set') continue
            if(resource.name === name) return resource
        }

        return null
    }

    getEntrypoint(name: string): Entrypoint|null
    {
        if(! this.parsedTemplate) return null

        for(const resource of this.parsedTemplate.template.deployment) {
            if(resource.type !== 'entrypoint') continue
            if(resource.name === name) return resource
        }

        return null
    }

    async uninstall(): Promise<void>
    {
        if(! this.parsedTemplate) return

        return await (new UninstallTemplate).execute(this.parsedTemplate)
    }

}

export const utils = {

    readParsedTemplateFile: function(filePath: string): any
    {
        return YAML.parse(fs.readFileSync(filePath).toString())
    },

    assertThatTemplatesAreEqual: function(actualTemplate: ParsedTemplate, expectedTemplate: ParsedTemplate): void
    {
        assertThatObjectsAreEqual(actualTemplate, expectedTemplate)
    },

    sleep: async function(seconds: number): Promise<void>
    {
        await new Promise(resolve => setTimeout(resolve, 1000 * seconds))
    },

}