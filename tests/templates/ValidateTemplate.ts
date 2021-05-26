import { DirResult as Directory } from 'tmp'
import fs from 'fs'
import FormData from 'form-data'
import SmoothyApi from '@/api/SmoothyApi'
import ZipTemplate from '@/templates/ZipTemplate'
import ApiError from '@/api/ApiError'

export class ValidateTemplate
{
    async execute(templatePath: string): Promise<ApiError|null>
    {
        const directory: Directory = await (new ZipTemplate).execute(templatePath)

        const form = new FormData()
        
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