import fs from 'fs'
import FormData from 'form-data'
import SmoothyApi from '@/api/SmoothyApi'
import ZipTemplate from '@/actions/ZipTemplate'
import ApiError from '@/api/ApiError'

export class ValidateTemplate
{
    async execute(templatePath: string): Promise<ApiError|null>
    {
        const pathToZipFile: string = await (new ZipTemplate).execute(templatePath)

        const form = new FormData()
        
        form.append('template', fs.createReadStream(pathToZipFile))

        try {
            await (new SmoothyApi).validateTemplate(form)
        } catch (error) {
            return error
        }

        return null
    }
}

export default ValidateTemplate