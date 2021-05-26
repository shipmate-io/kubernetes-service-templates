import fs from 'fs'
import FormData from 'form-data'
import SmoothyApi from '@/api/SmoothyApi'
import ZipTemplate from '@/templates/ZipTemplate'
import { ImportedTemplate } from '@/types'
import { DirResult as Directory } from 'tmp'

class ImportTemplate 
{
    async execute(templatePath: string): Promise<ImportedTemplate>
    {
        const directory: Directory = await (new ZipTemplate).execute(templatePath)

        const form = new FormData()
        
        form.append('template', fs.createReadStream(`${directory.name}/template.zip`))

        return await (new SmoothyApi).importTemplate(form)
    }
}

export default ImportTemplate