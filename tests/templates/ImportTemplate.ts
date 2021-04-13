import fs from 'fs'
import FormData from 'form-data'
import SmoothyApi from '@/api/SmoothyApi'
import ZipTemplate from '@/templates/ZipTemplate'
import { ImportedTemplate } from '@/types'
import { DirResult as Directory } from 'tmp'

class ImportTemplate 
{
    async execute(template_path: string, deployment_type: string): Promise<ImportedTemplate>
    {
        const directory = await (new ZipTemplate).execute(template_path)

        return await this.callWebService(directory, deployment_type)
    }

    async callWebService(directory: Directory, deployment_type: string): Promise<ImportedTemplate>
    {
        const form = new FormData()
        
        form.append('deployment_type', deployment_type)
        form.append('template', fs.createReadStream(`${directory.name}/template.zip`))

        return await (new SmoothyApi).importTemplate(form)
    }
}

export default ImportTemplate