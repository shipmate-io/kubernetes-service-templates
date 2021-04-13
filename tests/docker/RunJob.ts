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
        const docker_containers = await this.docker.listContainers()
        const job_exists = docker_containers.flatMap(container => container.Names).includes(container.id)

        if(job_exists) return

        const image = container.image
        const command = container.command
        const environment = container.environment || []
        const volume_mounts = container.volume_mounts || []
        const config_file_mounts = container.config_file_mounts || []

        const binds: string[] = []

        for(const volume_mount of volume_mounts) {
            binds.push(`${volume_mount.volume}:${volume_mount.mount_path}`)
        }

        for(const config_file_mount of config_file_mounts) {
            binds.push(`${directory.name}/${config_file_mount.config_file}:${config_file_mount.mount_path}`)
        }

        const config: Docker.ContainerCreateOptions = {
            name: container.id,
            Tty: true,
            Env: environment.map(environment_variable => `${environment_variable.name}=${environment_variable.value}`),
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
        
        const docker_container: Docker.Container = await this.docker.createContainer(config)

        await docker_container.start()
    }
}

export default RunJob