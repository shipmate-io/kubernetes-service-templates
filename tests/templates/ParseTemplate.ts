import SmoothyApi from '@/api/SmoothyApi'
import ImportTemplate from '@/templates/ImportTemplate'
import { ParsedTemplate, Variables } from '@/types'

export class ParseTemplate 
{
    async execute(
        application_slug: string, service_name: string, template_path: string, template_version: string, 
        variables: Variables, environment: Variables
    ): Promise<ParsedTemplate>
    {
        const template = await (new ImportTemplate).execute(template_path, 'kubernetes_cluster')

        if(!(template_version in template.versions)) {
            throw "Non existing version"
        }

        const versioned_template = template.versions[template_version]

        return await (new SmoothyApi).parseTemplate(
            application_slug, service_name, versioned_template, 'kubernetes_cluster', variables, environment
        )
    }
}

export default ParseTemplate