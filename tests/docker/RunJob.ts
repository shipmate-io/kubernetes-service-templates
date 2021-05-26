import Docker from 'dockerode'
import { DirResult as Directory } from 'tmp'
import { CronJob, Job } from '@/types'

class RunJob
{
    docker: Docker

    constructor()
    {
        this.docker = new Docker()
    }

    async execute(directory: Directory, resource: Job|CronJob)
    {
        const container = resource.containers[0]
        const dockerContainers = await this.docker.listContainers()
        const jobExists = dockerContainers.flatMap(container => container.Names).includes(container.id)

        if(jobExists) return

        const image = container.image
        const command = container.command
        const environment = container.environment || []
        const volumeMounts = container.volume_mounts || []
        const configFileMounts = container.config_file_mounts || []

        const binds: string[] = []

        for(const volumeMount of volumeMounts) {
            binds.push(`${volumeMount.volume}:${volumeMount.mount_path}`)
        }

        for(const configFileMount of configFileMounts) {
            binds.push(`${directory.name}/${configFileMount.config_file}:${configFileMount.mount_path}`)
        }

        const config: Docker.ContainerCreateOptions = {
            name: container.id,
            Tty: true,
            Env: environment.map(environmentVariable => `${environmentVariable.name}=${environmentVariable.value}`),
            Image: image,
            Cmd: command,
            HostConfig: {
                NetworkMode: 'smoothy',
                Binds: binds,
                RestartPolicy: {
                    Name: 'on-failure',
                    MaximumRetryCount: 3
                }
            }
        }
        
        const dockerContainer: Docker.Container = await this.docker.createContainer(config)

        await dockerContainer.start()
    }
}

export default RunJob