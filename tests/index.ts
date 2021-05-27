import ParseTemplate from './templates/ParseTemplate'
import InstallTemplate from './templates/InstallTemplate'
import UninstallTemplate from './templates/UninstallTemplate'
import { Entrypoint, ParsedTemplate, Variables, StatelessSet } from '@/types'
import 'jest-extended'

export class Template
{
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

    sleep: async function(seconds: number): Promise<void>
    {
        await new Promise(resolve => setTimeout(resolve, 1000 * seconds))
    },

}