import tmp, { DirResult as Directory } from 'tmp'
import fs from 'fs'
import ParseTemplate from '@/actions/ParseTemplate'
import UninstallTemplate from '@/actions/UninstallTemplate'
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
        codeRepositoryPath: string|null, templatePath: string, templateVersion: string, variables: Variables, 
        environment: Variables, initializationTimeInSeconds: number
    ): Promise<ParsedTemplate>
    {
        const applicationSlug = uuidv4().substring(0, 8)
        const serviceName = uuidv4().substring(0, 8)
        const template = await (new ParseTemplate).execute(
            applicationSlug, serviceName, templatePath, templateVersion, variables, environment
        )

        try {
            await new CreateNetwork().execute('smoothy')
            await this.buildImages(codeRepositoryPath, template)
            await this.createVolumes(template)
            await this.createConfigFiles(template)
            await this.runContainers(template)
            await this.runJobs(template)
        } catch (error) {
            (new UninstallTemplate).execute(template)
            throw error
        }

        await new Promise(resolve => setTimeout(resolve, 1000 * initializationTimeInSeconds))

        return template
    }

    async buildImages(codeRepositoryPath: string|null, template: ParsedTemplate): Promise<void>
    {
        const images: Image[] = []

        for(const resource of template.template.deployment) {
            if(resource.type !== 'image') continue
            images.push(resource)
        }

        if(images.length === 0) return

        if(codeRepositoryPath === null) {
            throw new Error("No code repository path provided.")
        }

        for(const image of images) {
            await new BuildImage().execute(codeRepositoryPath, template, image)
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
        const configFiles: ConfigFile[] = []

        for(const resource of template.template.deployment) {
            if(resource.type !== 'config_file') continue
            configFiles.push(resource)
        }

        if(configFiles.length === 0) return

        for(const configFile of configFiles) {
            fs.writeFileSync(`${this.directory.name}/${configFile.id}`, configFile.contents)
        }
    }

    async runContainers(template: ParsedTemplate): Promise<void>
    {
        const entrypoints: Entrypoint[] = []

        template.template.deployment.forEach(resource => {

            if(resource.type !== 'entrypoint') return

            const minPort = 50000
            const maxPort = 65353
            const randomPort = Math.floor(Math.random() * (maxPort - minPort) ) + minPort

            resource.host_port = randomPort

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