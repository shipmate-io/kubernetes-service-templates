import Service from './Service'
import ParseTemplate from './actions/ParseTemplate'
import InstallTemplate from './actions/InstallTemplate'
import { ParsedTemplate, Variables } from '@/types'

export default class Template
{
    templatePath: string

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
    ): Promise<Service>
    {
        const parsedTemplate = await (new InstallTemplate).execute(
            codeRepositoryPath, this.templatePath, 'latest', variables, environment, initializationTimeInSeconds
        )

        return new Service(parsedTemplate)
    }
}