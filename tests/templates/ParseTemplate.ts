import fs from 'fs'
import FormData from 'form-data'
import SmoothyApi from '@/api/SmoothyApi'
import ZipTemplate from '@/templates/ZipTemplate'
import { ParsedTemplate, ImportedTemplate, Variables } from '@/types'

export class ParseTemplate 
{
    async execute(
        applicationName: string, serviceName: string, templatePath: string, templateVersion: string, 
        variables: Variables, environment: Variables
    ): Promise<ParsedTemplate>
    {
        const pathToZipFile = await (new ZipTemplate).execute(templatePath)
        const importedTemplate = await this.importTemplate(pathToZipFile)

        if(!(templateVersion in importedTemplate.versions)) {
            throw "Non existing version"
        }

        const template = importedTemplate.versions[templateVersion]

        return await (new SmoothyApi).parseTemplate(applicationName, serviceName, template, variables, environment)
    }

    private async importTemplate(pathToZipFile: string): Promise<ImportedTemplate>
    {
        const form = new FormData()

        form.append('template', fs.createReadStream(pathToZipFile))

        return await (new SmoothyApi).importTemplate(form)
    }
}

export default ParseTemplate