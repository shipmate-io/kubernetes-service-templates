import Docker from 'dockerode'
import { CronJob, Job } from '@/types'

class DeleteJob
{
    docker: Docker;

    constructor()
    {
        this.docker = new Docker()
    }

    async execute(job: Job|CronJob)
    {
        const container = job.containers[0]
        const dockerContainers: Docker.ContainerInfo[] = await this.docker.listContainers({ all: true })

        const jobExists: boolean = dockerContainers.flatMap(job => job.Names).includes(`/${container.id}`)

        if(! jobExists) return

        const dockerContainer: Docker.Container = this.docker.getContainer(container.id)

        if((await dockerContainer.inspect()).State.Running) {
            await dockerContainer.stop()
        }

        await dockerContainer.remove()
    }
}

export default DeleteJob