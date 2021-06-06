import ParseTemplate from './actions/ParseTemplate'
import { ParsedTemplate, Variables } from '@/types'

export default class Template
{
    templatePath: string

    constructor(templatePath: string)
    {
        this.templatePath = templatePath
    }

    public getPath(): string
    {
        return this.templatePath
    }
    
    public async parse(
        applicationSlug: string, serviceName: string, variables: Variables = {}, environment: Variables = {}
    ): Promise<ParsedTemplate>
    {
        return await (new ParseTemplate).execute(
            applicationSlug, serviceName, this.templatePath, 'latest', variables, environment
        )
    }
}