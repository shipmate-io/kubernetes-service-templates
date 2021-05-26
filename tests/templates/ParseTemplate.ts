import SmoothyApi from '@/api/SmoothyApi'
import ImportTemplate from '@/templates/ImportTemplate'
import { ParsedTemplate, Variables } from '@/types'

export class ParseTemplate 
{
    async execute(
        applicationSlug: string, serviceName: string, templatePath: string, templateVersion: string, 
        variables: Variables, environment: Variables
    ): Promise<ParsedTemplate>
    {
        const template = await (new ImportTemplate).execute(templatePath)

        if(!(templateVersion in template.versions)) {
            throw "Non existing version"
        }

        const versionedTemplate = template.versions[templateVersion]

        return await (new SmoothyApi).parseTemplate(
            applicationSlug, serviceName, versionedTemplate, variables, environment
        )
    }
}

export default ParseTemplate