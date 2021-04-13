import fs from 'fs'
import YAML from 'yaml'
import ParseTemplate from './templates/ParseTemplate'
import ValidateTemplate from './templates/ValidateTemplate'
import InstallTemplate from './templates/InstallTemplate'
import UninstallTemplate from './templates/UninstallTemplate'
import { Resource, Container, Entrypoint, ParsedTemplate, Variables, StatelessSet } from '@/types'
import 'jest-extended'

export class Template {

    template_path: string
    parsed_template?: ParsedTemplate

    constructor(template_path: string)
    {
        this.template_path = template_path
    }
    
    async parse(
        application_slug: string, service_name: string, variables: Variables = {}, environment: Variables = {}
    ): Promise<ParsedTemplate>
    {
        return await (new ParseTemplate).execute(
            application_slug, service_name, this.template_path, 'latest', variables, environment
        )
    }
    
    async assertThatSyntaxIsValid(): Promise<void>
    {
        const error =  await (new ValidateTemplate).execute(this.template_path)

        expect(error).toBe(null)
    }
    
    async install(
        code_repository_path: string|null, variables: Variables = {}, environment: Variables = {}, 
        initialization_time_in_seconds: number = 10
    ): Promise<void>
    {
        this.parsed_template = await (new InstallTemplate).execute(
            code_repository_path, this.template_path, 'latest', variables, environment, initialization_time_in_seconds
        )
    }
    
    getStatelessSet(name: string): StatelessSet|null
    {
        if(! this.parsed_template) return null

        for(const resource of this.parsed_template.template.deployment) {
            if(resource.type !== 'stateless_set') continue
            if(resource.name === name) return resource
        }

        return null
    }

    getEntrypoint(name: string): Entrypoint|null
    {
        if(! this.parsed_template) return null

        for(const resource of this.parsed_template.template.deployment) {
            if(resource.type !== 'entrypoint') continue
            if(resource.name === name) return resource
        }

        return null
    }

    async uninstall(): Promise<void>
    {
        if(! this.parsed_template) return

        return await (new UninstallTemplate).execute(this.parsed_template)
    }

}

export const utils = {

    readParsedTemplateFile: function(file_path: string): any
    {
        return YAML.parse(fs.readFileSync(file_path).toString())
    },

    assertThatTemplatesAreEqual: function(actual_template: ParsedTemplate, expected_template: ParsedTemplate): void
    {
        if(expected_template?.template?.deployment) {
            for (const resource of expected_template.template.deployment as Resource[]) {
                const matching_resource: Resource|undefined = actual_template?.template?.deployment
                    .find(candidate_resource => candidate_resource.id === resource.id)
                if(! matching_resource) {
                    throw `No resource with id ${resource.id} found in parsed template.`
                }
                expect(matching_resource).toEqual(expect.objectContaining(resource))
            }
        }

        if(expected_template?.template?.interface?.volumes) {
            expect(actual_template?.template?.interface?.volumes || []).toIncludeAllMembers(
                expected_template.template.interface.volumes
            )
        }

        if(expected_template?.template?.interface?.logs) {
            expect(actual_template?.template?.interface?.logs || []).toIncludeAllMembers(
                expected_template.template.interface.logs
            )
        }

        if(expected_template?.files) {
            expect(actual_template?.files || {}).toMatchObject(expected_template.files)
        }
    },

    sleep: async function(seconds: number): Promise<void>
    {
        await new Promise(resolve => setTimeout(resolve, 1000 * seconds))
    },

}