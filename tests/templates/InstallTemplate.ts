import tmp, { DirResult as Directory } from 'tmp'
import fs from 'fs'
import ParseTemplate from '@/templates/ParseTemplate'
import UninstallTemplate from '@/templates/UninstallTemplate'
import BuildImage from '@/docker/BuildImage'
import CreateNetwork from '@/docker/CreateNetwork'
import CreateVolume from '@/docker/CreateVolume'
import RunJob from '@/docker/RunJob'
import RunContainer from '@/docker/RunContainer'
import { Volume, Image, Entrypoint, ConfigFile, ParsedTemplate, Variables } from '@/types'
import { v4 as uuidv4 } from 'uuid'

tmp.setGracefulCleanup()

export class InstallTemplate
{
    directory: Directory

    constructor()
    {
        this.directory = tmp.dirSync()
    }

    async execute(
        code_repository_path: string|null, template_path: string, template_version: string, variables: Variables, 
        environment: Variables, initialization_time_in_seconds: number
    ): Promise<ParsedTemplate>
    {
        const application_slug = uuidv4().substring(0, 8)
        const service_name = uuidv4().substring(0, 8)
        const template = await (new ParseTemplate).execute(
            application_slug, service_name, template_path, template_version, variables, environment
        )

        try {
            await new CreateNetwork().execute('smoothy')
            await this.buildImages(code_repository_path, template)
            await this.createVolumes(template)
            await this.createConfigFiles(template)
            await this.runContainers(template)
            await this.runJobs(template)
        } catch (error) {
            (new UninstallTemplate).execute(template)
            throw error
        }

        await new Promise(resolve => setTimeout(resolve, 1000 * initialization_time_in_seconds))

        return template
    }

    async buildImages(code_repository_path: string|null, template: ParsedTemplate): Promise<void>
    {
        const images: Image[] = []

        for(const resource of template.template.deployment) {
            if(resource.type !== 'image') continue
            images.push(resource)
        }

        if(images.length === 0) return

        if(code_repository_path === null) {
            throw new Error("No code repository path provided.")
        }

        for(const image of images) {
            await new BuildImage().execute(code_repository_path, template, image)
        }
    }

    async createVolumes(template: ParsedTemplate): Promise<void>
    {
        const volumes: Volume[] = []

        for(const resource of template.template.deployment) {
            if(resource.type !== 'volume') continue
            volumes.push(resource)
        }

        if(volumes.length === 0) return

        for(const volume of volumes) {
            await new CreateVolume().execute(volume)
        }
    }

    async createConfigFiles(template: ParsedTemplate): Promise<void>
    {
        const config_files: ConfigFile[] = []

        for(const resource of template.template.deployment) {
            if(resource.type !== 'config_file') continue
            config_files.push(resource)
        }

        if(config_files.length === 0) return

        for(const config_file of config_files) {
            fs.writeFileSync(`${this.directory.name}/${config_file.id}`, config_file.contents)
        }
    }

    async runContainers(template: ParsedTemplate): Promise<void>
    {
        const entrypoints: Entrypoint[] = []

        template.template.deployment.forEach(resource => {

            if(resource.type !== 'entrypoint') return

            const min_port = 50000
            const max_port = 65353
            const random_port = Math.floor(Math.random() * (max_port - min_port) ) + min_port

            resource.host_port = random_port

            entrypoints.push(resource)

        })

        for(const resource of template.template.deployment) {

            if(resource.type !== 'stateless_set' && resource.type !== 'daemon_set') continue

            await new RunContainer().execute(this.directory, resource, entrypoints)

        }
    }

    async runJobs(template: ParsedTemplate): Promise<void>
    {
        for(const resource of template.template.deployment) {

            if(resource.type !== 'job' && resource.type !== 'cron_job') continue

            await new RunJob().execute(this.directory, resource)

        }
    }
}

export default InstallTemplate