import { DirResult as Directory } from 'tmp'
import fs from 'fs'
import FormData from 'form-data'
import SmoothyApi from '@/api/SmoothyApi'
import ZipTemplate from '@/templates/ZipTemplate'
import ApiError from '@/api/ApiError'

export class ValidateTemplate
{
    async execute(template_path: string): Promise<ApiError|null>
    {
        const directory = await (new ZipTemplate).execute(template_path)

        return await this.callWebService(directory)
    }

    async callWebService(directory: Directory): Promise<ApiError|null>
    {
        const form = new FormData()
        
        form.append('deployment_type', 'kubernetes_cluster')
        form.append('template', fs.createReadStream(`${directory.name}/template.zip`))

        try {
            await (new SmoothyApi).validateTemplate(form)
        } catch (error) {
            return error
        }

        return null
    }
}

export default ValidateTemplate