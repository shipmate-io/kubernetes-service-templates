// import path from 'path'
// import rimraf from 'rimraf'
// import fs from 'fs'
import DeleteImage from '@/docker/DeleteImage'
import DeleteVolume from '@/docker/DeleteVolume'
import DeleteContainer from '@/docker/DeleteContainer'
import DeleteJob from '@/docker/DeleteJob'
import { ParsedTemplate } from '@/types'

export class UninstallTemplate
{
    async execute(template: ParsedTemplate): Promise<void>
    {
        await this.deleteJobs(template)
        await this.deleteContainers(template)
        // await this.deleteConfigFiles(template)
        await this.deleteVolumes(template)
        await this.deleteImages(template)
    }

    async deleteJobs(template: ParsedTemplate): Promise<void>
    {
        const promises: Promise<void>[] = []

        template.template.deployment.forEach(resource => {

            if(resource.type !== 'job' && resource.type !== 'cron_job') return

            promises.push(new DeleteJob().execute(resource))

        })

        await Promise.all(promises)
    }

    async deleteContainers(template: ParsedTemplate): Promise<void>
    {
        const promises: Promise<void>[] = []

        template.template.deployment.forEach(resource => {

            if(resource.type !== 'stateless_set' && resource.type !== 'daemon_set') return

            promises.push(new DeleteContainer().execute(resource))

        })

        await Promise.all(promises)
    }

    /*
    async deleteConfigFiles(service: Service): Promise<void>
    {        
        const folder_path = path.join(app.getPath('userData'), `services/${service_name}`)

        if(! fs.existsSync(folder_path)) return
        
        rimraf.sync(folder_path)
    }
    */

    async deleteVolumes(template: ParsedTemplate): Promise<void>
    {
        const promises: Promise<void>[] = []

        template.template.deployment.forEach(resource => {
            
            if(resource.type !== 'volume') return
            
            promises.push(new DeleteVolume().execute(resource))
            
         })

        await Promise.all(promises)
    }

    async deleteImages(template: ParsedTemplate): Promise<void>
    {
        const promises: Promise<void>[] = []

        template.template.deployment.forEach(resource => {
            
            if(resource.type !== 'image') return
            
            promises.push(new DeleteImage().execute(resource))
            
        })

        await Promise.all(promises)
    }
}

export default UninstallTemplate